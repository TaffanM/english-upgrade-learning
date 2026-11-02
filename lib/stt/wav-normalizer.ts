import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const FFMPEG_CANDIDATE_PATHS = [
  process.env.FFMPEG_PATH,
  "/opt/homebrew/bin/ffmpeg",
  "/usr/local/bin/ffmpeg",
  "/usr/bin/ffmpeg",
  "ffmpeg",
].filter((p): p is string => Boolean(p));

/**
 * Checks whether a buffer is already a canonical 44-byte header
 * 16 kHz, 16-bit mono Linear PCM RIFF/WAVE file that NVIDIA Triton ASR accepts directly.
 */
export function isCanonicalWav16kMonoPcm(buf: Buffer): boolean {
  if (buf.length < 44) return false;

  const riff = buf.subarray(0, 4).toString("ascii");
  const wave = buf.subarray(8, 12).toString("ascii");
  const fmt = buf.subarray(12, 16).toString("ascii");
  const dataTag = buf.subarray(36, 40).toString("ascii");

  if (riff !== "RIFF" || wave !== "WAVE" || fmt !== "fmt ") {
    return false;
  }

  const audioFormat = buf.readUInt16LE(20); // 1 = Linear PCM
  const numChannels = buf.readUInt16LE(22); // 1 = Mono
  const sampleRate = buf.readUInt32LE(24); // 16000 Hz
  const bitsPerSample = buf.readUInt16LE(34); // 16-bit

  return (
    audioFormat === 1 &&
    numChannels === 1 &&
    sampleRate === 16000 &&
    bitsPerSample === 16 &&
    dataTag === "data"
  );
}

async function resolveFfmpegBinary(): Promise<string | null> {
  for (const candidate of FFMPEG_CANDIDATE_PATHS) {
    if (candidate === "ffmpeg") {
      return candidate;
    }
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Converts any browser audio buffer (WebM/Opus, Ogg/Opus, MP4/AAC, or non-16kHz WAV)
 * into a canonical 44-byte header 16 kHz, 16-bit mono Linear PCM WAV buffer
 * required by NVIDIA Parakeet CTC 1.1B ASR (Triton audio decoder).
 */
export async function ensureCanonicalWav16kMono(
  inputBuffer: Buffer | Uint8Array,
  extHint = "webm"
): Promise<Buffer> {
  const buf = Buffer.from(inputBuffer);

  if (isCanonicalWav16kMonoPcm(buf)) {
    return buf;
  }

  const ffmpegBin = await resolveFfmpegBinary();
  if (!ffmpegBin) {
    return buf;
  }

  const safeExt = extHint.replace(/[^a-z0-9]/gi, "").toLowerCase() || "webm";
  const id = crypto.randomUUID();
  const tmpDir = os.tmpdir();
  const inPath = path.join(tmpDir, `stt-in-${id}.${safeExt}`);
  const outPath = path.join(tmpDir, `stt-out-${id}.wav`);

  try {
    await fs.writeFile(inPath, buf);
    await execFileAsync(
      ffmpegBin,
      [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        inPath,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        "-bitexact",
        "-f",
        "wav",
        outPath,
      ],
      { timeout: 15_000 }
    );

    const wavBuffer = await fs.readFile(outPath);
    if (wavBuffer.length >= 44) {
      return wavBuffer;
    }
    return buf;
  } catch {
    return buf;
  } finally {
    await fs.unlink(inPath).catch(() => {});
    await fs.unlink(outPath).catch(() => {});
  }
}
