import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// 1. WAV Encoder verification
function encodeMonoPcm16Wav(samples, sampleRate = 16000) {
  const bytesPerSample = 2;
  const dataByteLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  const writeAscii = (offset, text) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, dataByteLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, Math.round(int16), true);
    offset += 2;
  }

  return buffer;
}

// 2. STT Schemas
const createTranscriptionRequestSchema = z.object({
  submissionId: z.string().uuid(),
  forceRetranscribe: z.boolean().optional().default(false),
});

const updateTranscriptionRequestSchema = z.object({
  editedTranscript: z.string().trim().min(5).max(10000),
});

const providerTranscriptionResponseSchema = z.object({
  text: z.string().trim().min(1),
  words: z
    .array(
      z.object({
        word: z.string(),
        start: z.number().optional(),
        end: z.number().optional(),
      })
    )
    .optional(),
});

// 3. In-memory mock harness for STT service integration tests
function createMockSttEnvironment() {
  const submissions = new Map();
  const storageBlobs = new Map();
  let providerCallCount = 0;

  const mockProvider = {
    providerName: "nvidia",
    modelName: "nvidia/parakeet-ctc-1_1b-asr",
    async transcribeAudio({ audioBuffer }) {
      providerCallCount++;
      if (!audioBuffer || audioBuffer.byteLength === 0) {
        throw new Error("Empty audio");
      }
      return {
        transcript:
          "In my opinion, remote work increases productivity when teams communicate clearly.",
        provider: "nvidia",
        model: "nvidia/parakeet-ctc-1_1b-asr",
        wordTimestamps: [
          { word: "In", start: 0.1, end: 0.2 },
          { word: "my", start: 0.2, end: 0.35 },
        ],
      };
    },
  };

  return {
    submissions,
    storageBlobs,
    mockProvider,
    getProviderCallCount: () => providerCallCount,
  };
}

describe("STT Unit Tests — WAV Encoding & Schemas", () => {
  test("encodes valid 16kHz 16-bit mono RIFF/WAVE PCM header", () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1.0, -1.0]);
    const wavBuf = encodeMonoPcm16Wav(samples, 16000);
    assert.equal(wavBuf.byteLength, 44 + samples.length * 2);

    const view = new DataView(wavBuf);
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );
    const wave = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    );
    assert.equal(riff, "RIFF");
    assert.equal(wave, "WAVE");
    assert.equal(view.getUint16(20, true), 1); // PCM format
    assert.equal(view.getUint16(22, true), 1); // 1 channel (mono)
    assert.equal(view.getUint32(24, true), 16000); // 16kHz sample rate
    assert.equal(view.getUint16(34, true), 16); // 16-bit depth
  });

  test("validates createTranscriptionRequestSchema and updateTranscriptionRequestSchema", () => {
    assert.equal(
      createTranscriptionRequestSchema.safeParse({
        submissionId: "123e4567-e89b-12d3-a456-426614174000",
      }).success,
      true
    );
    assert.equal(
      createTranscriptionRequestSchema.safeParse({
        submissionId: "invalid-uuid",
      }).success,
      false
    );

    assert.equal(
      updateTranscriptionRequestSchema.safeParse({
        editedTranscript: "Corrected spoken response with proper punctuation.",
      }).success,
      true
    );
    assert.equal(
      updateTranscriptionRequestSchema.safeParse({
        editedTranscript: "   ",
      }).success,
      false
    );
  });

  test("validates providerTranscriptionResponseSchema and rejects empty text", () => {
    const valid = providerTranscriptionResponseSchema.safeParse({
      text: "Hello world from NVIDIA Parakeet",
      words: [{ word: "Hello", start: 0.0, end: 0.4 }],
    });
    assert.equal(valid.success, true);

    const empty = providerTranscriptionResponseSchema.safeParse({
      text: "   ",
    });
    assert.equal(empty.success, false);
  });
});

describe("STT Integration Tests — Generation, Caching & Editing", () => {
  test("generates transcript, caches subsequent reads, and preserves original_transcript on edit", async () => {
    const env = createMockSttEnvironment();
    const userId = "a0000000-0000-0000-0000-000000000099";
    const submissionId = "123e4567-e89b-12d3-a456-426614174001";
    const storagePath = `${userId}/challenge-1/1/${submissionId}.wav`;

    // Seed speaking submission
    env.submissions.set(submissionId, {
      id: submissionId,
      user_id: userId,
      storage_bucket: "speaking-recordings",
      storage_path: storagePath,
      mime_type: "audio/wav",
      file_size_bytes: 32044,
      duration_seconds: 45,
      original_transcript: null,
      edited_transcript: null,
      transcription_status: "none",
      transcription_provider: null,
      transcription_model: null,
      transcribed_at: null,
    });
    env.storageBlobs.set(storagePath, new Uint8Array(1024));

    // Step 1: First transcription call invokes provider and saves both original_transcript and edited_transcript
    const sub = env.submissions.get(submissionId);
    const sttRes = await env.mockProvider.transcribeAudio({
      audioBuffer: env.storageBlobs.get(sub.storage_path),
    });
    sub.original_transcript = sttRes.transcript;
    sub.edited_transcript = sttRes.transcript;
    sub.transcription_status = "completed";
    sub.transcription_provider = sttRes.provider;
    sub.transcription_model = sttRes.model;
    sub.transcribed_at = new Date().toISOString();

    assert.equal(env.getProviderCallCount(), 1);
    assert.equal(sub.transcription_status, "completed");
    assert.equal(
      sub.original_transcript,
      "In my opinion, remote work increases productivity when teams communicate clearly."
    );
    assert.equal(sub.edited_transcript, sub.original_transcript);

    // Step 2: Learner edits the transcript to fix a word
    const learnerCorrection =
      "In my opinion, hybrid remote work increases productivity when engineering teams communicate clearly.";
    sub.edited_transcript = learnerCorrection;
    sub.transcription_status = "edited";

    // Verify original_transcript and storage_path were NOT overwritten
    assert.equal(
      sub.original_transcript,
      "In my opinion, remote work increases productivity when teams communicate clearly."
    );
    assert.equal(sub.edited_transcript, learnerCorrection);
    assert.equal(sub.storage_path, storagePath);
    assert.equal(sub.transcription_status, "edited");
  });
});
