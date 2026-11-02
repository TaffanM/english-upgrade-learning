import crypto from "node:crypto";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import {
  SpeechToTextProvider,
  SttProviderName,
  SttProviderResult,
  SttServiceError,
  WordTimestamp,
} from "./types";
import { providerTranscriptionResponseSchema } from "./schemas";
import { ensureCanonicalWav16kMono } from "./wav-normalizer";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore if unsupported in edge runtime
}

const DEFAULT_NVIDIA_ASR_ENDPOINT =
  "https://1598d209-5e27-4d3c-8079-4751568b1081.invocation.api.nvcf.nvidia.com/v1/audio/transcriptions";
const DEFAULT_NVIDIA_ASR_MODEL = "nvidia/parakeet-ctc-1_1b-asr";

const DEFAULT_GROQ_STT_ENDPOINT =
  "https://api.groq.com/openai/v1/audio/transcriptions";
const DEFAULT_GROQ_STT_MODEL = "whisper-large-v3-turbo";

const STT_TIMEOUT_MS = 35_000;

interface MultipartField {
  name: string;
  value: string;
}

interface MultipartFile {
  fieldName: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

function buildMultipartBody(params: {
  file: MultipartFile;
  fields: MultipartField[];
}): { payload: Buffer; contentType: string } {
  const boundary = `----AntigravitySttBoundary${crypto.randomBytes(12).toString("hex")}`;
  const chunks: Buffer[] = [];

  // File part
  chunks.push(
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${params.file.fieldName}"; filename="${params.file.fileName}"\r\n` +
        `Content-Type: ${params.file.mimeType}\r\n\r\n`,
      "utf8"
    )
  );
  chunks.push(params.file.buffer);
  chunks.push(Buffer.from("\r\n", "utf8"));

  // Text parts
  for (const field of params.fields) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${field.name}"\r\n\r\n` +
          `${field.value}\r\n`,
        "utf8"
      )
    );
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`, "utf8"));

  return {
    payload: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

function postMultipartOverIpv4(params: {
  url: string;
  apiKey: string;
  file: MultipartFile;
  fields: MultipartField[];
  timeoutMs: number;
}): Promise<{ statusCode: number; rawText: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(params.url);
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;
    const { payload, contentType } = buildMultipartBody({
      file: params.file,
      fields: params.fields,
    });

    const req = transport.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "POST",
        family: 4,
        agent: isHttps
          ? new https.Agent({ keepAlive: false })
          : new http.Agent({ keepAlive: false }),
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          Accept: "application/json",
          "Content-Type": contentType,
          "Content-Length": payload.length,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 502,
            rawText: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );

    req.setTimeout(params.timeoutMs, () => {
      const timeoutErr = new Error("Speech-to-text request timed out");
      timeoutErr.name = "AbortError";
      req.destroy(timeoutErr);
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export class NvidiaParakeetSttProvider implements SpeechToTextProvider {
  public readonly providerName: SttProviderName = "nvidia";
  public readonly modelName: string;
  private readonly endpoint: string;
  private readonly apiKey: string;

  constructor(options?: {
    endpoint?: string;
    modelName?: string;
    apiKey?: string;
  }) {
    this.endpoint =
      options?.endpoint ||
      process.env.NVIDIA_ASR_ENDPOINT ||
      DEFAULT_NVIDIA_ASR_ENDPOINT;
    this.modelName =
      options?.modelName ||
      process.env.NVIDIA_ASR_MODEL ||
      DEFAULT_NVIDIA_ASR_MODEL;
    this.apiKey = options?.apiKey || process.env.NVIDIA_API_KEY || "";
  }

  async transcribeAudio(params: {
    audioBuffer: Buffer | Uint8Array;
    mimeType: string;
    fileName: string;
  }): Promise<SttProviderResult> {
    if (!this.apiKey) {
      throw new SttServiceError(
        "STT_PROVIDER_ERROR",
        "Speech-to-text service is not configured on the server.",
        503
      );
    }

    const extHint =
      params.fileName?.split(".").pop() ||
      (params.mimeType?.includes("mp4")
        ? "mp4"
        : params.mimeType?.includes("ogg")
        ? "ogg"
        : "webm");

    // Ensure the audio buffer is a canonical 16 kHz, 16-bit mono Linear PCM WAV
    // so NVIDIA Triton ASR never fails with "Audio decoder exception" on WebM/MP4 recordings.
    const normalizedWavBuffer = await ensureCanonicalWav16kMono(
      params.audioBuffer,
      extHint
    );

    try {
      const { statusCode, rawText } = await postMultipartOverIpv4({
        url: this.endpoint,
        apiKey: this.apiKey,
        timeoutMs: STT_TIMEOUT_MS,
        file: {
          fieldName: "file",
          fileName: "recording.wav",
          mimeType: "audio/wav",
          buffer: normalizedWavBuffer,
        },
        fields: [{ name: "language", value: "en-US" }],
      });

      return parseProviderResponsePayload(
        statusCode,
        rawText,
        this.providerName,
        this.modelName
      );
    } catch (err) {
      if (err instanceof SttServiceError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new SttServiceError(
          "STT_PROVIDER_ERROR",
          "Speech-to-text request timed out. Please try again with a shorter recording.",
          504
        );
      }
      throw new SttServiceError(
        "STT_PROVIDER_ERROR",
        "Unable to reach the speech-to-text service. Please try again shortly.",
        502
      );
    }
  }
}

export class GroqWhisperSttProvider implements SpeechToTextProvider {
  public readonly providerName: SttProviderName = "groq";
  public readonly modelName: string;
  private readonly endpoint: string;
  private readonly apiKey: string;

  constructor(options?: {
    endpoint?: string;
    modelName?: string;
    apiKey?: string;
  }) {
    this.endpoint =
      options?.endpoint ||
      process.env.GROQ_STT_ENDPOINT ||
      DEFAULT_GROQ_STT_ENDPOINT;
    this.modelName =
      options?.modelName ||
      process.env.GROQ_STT_MODEL ||
      DEFAULT_GROQ_STT_MODEL;
    this.apiKey = options?.apiKey || process.env.GROQ_API_KEY || "";
  }

  async transcribeAudio(params: {
    audioBuffer: Buffer | Uint8Array;
    mimeType: string;
    fileName: string;
  }): Promise<SttProviderResult> {
    if (!this.apiKey) {
      throw new SttServiceError(
        "STT_PROVIDER_ERROR",
        "Groq speech-to-text provider is not configured on the server.",
        503
      );
    }

    const cleanMime = (params.mimeType || "audio/webm").split(";")[0].trim();

    try {
      const { statusCode, rawText } = await postMultipartOverIpv4({
        url: this.endpoint,
        apiKey: this.apiKey,
        timeoutMs: STT_TIMEOUT_MS,
        file: {
          fieldName: "file",
          fileName: params.fileName || "recording.webm",
          mimeType: cleanMime,
          buffer: Buffer.from(params.audioBuffer),
        },
        fields: [
          { name: "model", value: this.modelName },
          { name: "language", value: "en" },
          { name: "response_format", value: "verbose_json" },
        ],
      });

      return parseProviderResponsePayload(
        statusCode,
        rawText,
        this.providerName,
        this.modelName
      );
    } catch (err) {
      if (err instanceof SttServiceError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new SttServiceError(
          "STT_PROVIDER_ERROR",
          "Speech-to-text request timed out. Please try again.",
          504
        );
      }
      throw new SttServiceError(
        "STT_PROVIDER_ERROR",
        "Unable to reach the speech-to-text service.",
        502
      );
    }
  }
}

function parseProviderResponsePayload(
  statusCode: number,
  rawText: string,
  provider: SttProviderName,
  model: string
): SttProviderResult {
  if (statusCode === 429) {
    throw new SttServiceError(
      "QUOTA_EXHAUSTED",
      "Speech-to-text quota or rate limit reached. Please wait a moment or enter your transcript manually.",
      429
    );
  }

  if (statusCode === 401 || statusCode === 403) {
    throw new SttServiceError(
      "STT_PROVIDER_ERROR",
      "Speech-to-text provider authentication failed on the server.",
      502
    );
  }

  if (statusCode < 200 || statusCode >= 300) {
    let detail =
      "Speech-to-text provider rejected the audio format or request.";
    try {
      const parsedErr = JSON.parse(rawText);
      const msg =
        parsedErr?.detail ||
        parsedErr?.error?.message ||
        parsedErr?.message ||
        "";
      if (typeof msg === "string" && msg.length > 0 && msg.length < 240) {
        detail = `Transcription error: ${msg}`;
      }
    } catch {
      // keep sanitized message
    }
    throw new SttServiceError("STT_PROVIDER_ERROR", detail, 502);
  }

  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    const trimmed = rawText.trim();
    if (trimmed.length > 0 && !trimmed.startsWith("<")) {
      return {
        transcript: trimmed,
        provider,
        model,
      };
    }
    throw new SttServiceError(
      "STT_PROVIDER_ERROR",
      "Speech-to-text provider returned an invalid response format.",
      502
    );
  }

  const validated = providerTranscriptionResponseSchema.safeParse(json);
  if (!validated.success) {
    throw new SttServiceError(
      "STT_PROVIDER_ERROR",
      "No clear speech could be recognized from this audio recording. Please try speaking clearly or edit the transcript manually.",
      422
    );
  }

  const wordTimestamps: WordTimestamp[] | undefined = validated.data.words
    ?.map((w) => ({
      word: w.word,
      start: w.start ?? w.start_time ?? 0,
      end: w.end ?? w.end_time ?? 0,
    }))
    .filter((w) => Boolean(w.word));

  return {
    transcript: validated.data.text,
    provider,
    model,
    wordTimestamps:
      wordTimestamps && wordTimestamps.length > 0 ? wordTimestamps : undefined,
  };
}

/**
 * Factory returning the configured server-side SpeechToTextProvider.
 * Defaults to NVIDIA Parakeet CTC 1.1B ASR unless STT_PROVIDER=groq is set.
 */
export function getConfiguredSttProvider(): SpeechToTextProvider {
  const configured = (process.env.STT_PROVIDER || "").toLowerCase().trim();
  if (configured === "groq") {
    return new GroqWhisperSttProvider();
  }
  return new NvidiaParakeetSttProvider();
}
