/**
 * Converts a recorded browser audio Blob (e.g. audio/webm, audio/ogg, or audio/mp4)
 * into a 16 kHz, 16-bit mono Linear PCM WAV Blob using the Web Audio API.
 * Falls back gracefully to the original Blob if Web Audio API decoding is unavailable.
 */
export async function convertAudioBlobToMono16kWav(inputBlob: Blob): Promise<Blob> {
  if (typeof window === "undefined") {
    return inputBlob;
  }

  // If already a canonical WAV blob, return as-is
  if (inputBlob.type === "audio/wav" || inputBlob.type === "audio/wave") {
    const headerBuf = await inputBlob.slice(0, 12).arrayBuffer();
    if (headerBuf.byteLength >= 12) {
      const view = new DataView(headerBuf);
      const isRiff =
        view.getUint8(0) === 0x52 && // R
        view.getUint8(1) === 0x49 && // I
        view.getUint8(2) === 0x46 && // F
        view.getUint8(3) === 0x46; // F
      if (isRiff) {
        return inputBlob;
      }
    }
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx || typeof OfflineAudioContext === "undefined") {
    return inputBlob;
  }

  let audioCtx: AudioContext | null = null;
  try {
    const arrayBuffer = await inputBlob.arrayBuffer();
    audioCtx = new AudioCtx();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    const targetSampleRate = 16000;
    const targetLength = Math.max(1, Math.ceil(decodedBuffer.duration * targetSampleRate));

    const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);
    const wavArrayBuffer = encodeMonoPcm16Wav(channelData, targetSampleRate);

    return new Blob([wavArrayBuffer], { type: "audio/wav" });
  } catch {
    // Graceful fallback to original MediaRecorder blob if browser cannot decode container
    return inputBlob;
  } finally {
    if (audioCtx && audioCtx.state !== "closed") {
      try {
        await audioCtx.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}

/**
 * Downsamples an array of Float32Array mono PCM chunks from `sourceSampleRate`
 * (e.g. 44100 Hz or 48000 Hz) to 16000 Hz and encodes a canonical 44-byte RIFF/WAVE PCM16 Blob.
 */
export function encodePcmChunksToMono16kWavBlob(
  chunks: Float32Array[],
  sourceSampleRate: number
): Blob {
  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }

  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const targetSampleRate = 16000;
  const resampled = downsampleFloat32Buffer(
    merged,
    sourceSampleRate || 48000,
    targetSampleRate
  );
  const wavArrayBuffer = encodeMonoPcm16Wav(resampled, targetSampleRate);
  return new Blob([wavArrayBuffer], { type: "audio/wav" });
}

export function downsampleFloat32Buffer(
  buffer: Float32Array,
  sourceRate: number,
  targetRate = 16000
): Float32Array {
  if (sourceRate <= 0 || sourceRate === targetRate || buffer.length === 0) {
    return buffer;
  }

  const ratio = sourceRate / targetRate;
  const newLength = Math.max(1, Math.round(buffer.length / ratio));
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const startIdx = Math.floor(i * ratio);
    const endIdx = Math.min(buffer.length, Math.floor((i + 1) * ratio));
    if (endIdx > startIdx) {
      let sum = 0;
      for (let j = startIdx; j < endIdx; j++) {
        sum += buffer[j];
      }
      result[i] = sum / (endIdx - startIdx);
    } else {
      result[i] = buffer[Math.min(startIdx, buffer.length - 1)] ?? 0;
    }
  }

  return result;
}

/**
 * Encodes Float32Array mono audio samples [-1.0, 1.0] into a standard 44-byte RIFF/WAVE PCM16 buffer.
 */
export function encodeMonoPcm16Wav(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  const bytesPerSample = 2;
  const dataByteLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  writeAsciiString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeAsciiString(view, 8, "WAVE");
  writeAsciiString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM subchunk1 size
  view.setUint16(20, 1, true); // AudioFormat = 1 (Linear PCM)
  view.setUint16(22, 1, true); // NumChannels = 1 (Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * bytesPerSample, true); // ByteRate
  view.setUint16(32, bytesPerSample, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeAsciiString(view, 36, "data");
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

function writeAsciiString(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
