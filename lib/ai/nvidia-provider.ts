import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import {
  AiChatMessage,
  AiEvaluationProvider,
  AiReviewServiceError,
} from "./types";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore if unsupported in edge runtime
}

export const NVIDIA_NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";
export const DEFAULT_NVIDIA_MODEL = "google/diffusiongemma-26b-a4b-it";
export const DEFAULT_NVIDIA_FALLBACK_MODELS = [
  "nvidia/nemotron-3.5-bolt-e4b",
];

/**
 * When fallback models are available, bound the primary model attempt so a stalled
 * NVCF function queue (such as openai/gpt-oss-20b returning 504 on NVCF) fails over
 * quickly instead of holding the browser request until a 504 Gateway Timeout.
 */
const PRIMARY_ATTEMPT_WITH_FALLBACK_TIMEOUT_MS = 5_500;
const FALLBACK_ATTEMPT_TIMEOUT_MS = 22_000;
const SINGLE_MODEL_TIMEOUT_MS = 30_000;
const UNHEALTHY_MODEL_COOLDOWN_MS = 15 * 60 * 1000;

const unhealthyModelUntil = new Map<string, number>();

interface ChatCompletionPayload {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
  detail?: string;
}

function postJsonOverIpv4(params: {
  url: string;
  apiKey: string;
  body: Record<string, unknown>;
  timeoutMs: number;
}): Promise<{ statusCode: number; rawBody: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(params.url);
    const isHttps = parsedUrl.protocol === "https:";
    const transport = isHttps ? https : http;
    const payload = Buffer.from(JSON.stringify(params.body), "utf8");

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
          "Content-Type": "application/json",
          "Content-Length": payload.length,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 502,
            rawBody: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );

    req.setTimeout(params.timeoutMs, () => {
      const timeoutErr = new Error(
        `Request timed out after ${params.timeoutMs}ms`
      );
      timeoutErr.name = "TimeoutError";
      req.destroy(timeoutErr);
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

export class NvidiaNimEvaluationProvider implements AiEvaluationProvider {
  public readonly modelName: string;
  private readonly fallbackModels: string[];
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options?: {
    apiKey?: string;
    modelName?: string;
    fallbackModels?: string[];
    baseUrl?: string;
  }) {
    this.apiKey = options?.apiKey || process.env.NVIDIA_API_KEY || "";
    this.modelName =
      options?.modelName || process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL;
    this.baseUrl = (
      options?.baseUrl ||
      process.env.NVIDIA_BASE_URL ||
      NVIDIA_NIM_BASE_URL
    ).replace(/\/+$/, "");

    const envFallbacks = (process.env.NVIDIA_FALLBACK_MODELS || "")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    const rawFallbacks =
      options?.fallbackModels ??
      (envFallbacks.length > 0 ? envFallbacks : DEFAULT_NVIDIA_FALLBACK_MODELS);

    this.fallbackModels = rawFallbacks.filter((m) => m !== this.modelName);
  }

  private getOrderedCandidateModels(): string[] {
    const now = Date.now();
    const allCandidates = [this.modelName, ...this.fallbackModels];
    const healthy: string[] = [];
    const coolingDown: string[] = [];

    for (const candidate of allCandidates) {
      const cooldownExpiry = unhealthyModelUntil.get(candidate) ?? 0;
      if (cooldownExpiry > now) {
        coolingDown.push(candidate);
      } else {
        if (cooldownExpiry > 0) {
          unhealthyModelUntil.delete(candidate);
        }
        healthy.push(candidate);
      }
    }

    return [...healthy, ...coolingDown];
  }

  async generateEvaluation(messages: AiChatMessage[]): Promise<{
    rawContent: string;
    modelName: string;
  }> {
    if (!this.apiKey) {
      throw new AiReviewServiceError(
        "PROVIDER_ERROR",
        "AI Tutor evaluation service is not configured on the server.",
        503
      );
    }

    const candidates = this.getOrderedCandidateModels();
    const endpoint = `${this.baseUrl}/chat/completions`;
    let lastError: AiReviewServiceError | null = null;

    for (let idx = 0; idx < candidates.length; idx++) {
      const candidateModel = candidates[idx];
      const hasRemainingFallbacks = idx < candidates.length - 1;
      const timeoutMs =
        candidates.length === 1
          ? SINGLE_MODEL_TIMEOUT_MS
          : idx === 0 && candidateModel === this.modelName
          ? PRIMARY_ATTEMPT_WITH_FALLBACK_TIMEOUT_MS
          : FALLBACK_ATTEMPT_TIMEOUT_MS;

      try {
        const { statusCode, rawBody } = await postJsonOverIpv4({
          url: endpoint,
          apiKey: this.apiKey,
          timeoutMs,
          body: {
            model: candidateModel,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            temperature: 0.2,
            top_p: 0.9,
            max_tokens: 2048,
          },
        });

        if (statusCode === 401 || statusCode === 403) {
          throw new AiReviewServiceError(
            "PROVIDER_ERROR",
            "AI evaluation provider credentials could not be verified on the server.",
            502
          );
        }

        if (statusCode === 429) {
          throw new AiReviewServiceError(
            "QUOTA_EXHAUSTED",
            "AI evaluation provider rate limit or quota reached. Please wait a minute and try again.",
            429
          );
        }

        if (
          statusCode === 404 ||
          statusCode === 408 ||
          statusCode === 410 ||
          statusCode >= 500
        ) {
          unhealthyModelUntil.set(
            candidateModel,
            Date.now() + UNHEALTHY_MODEL_COOLDOWN_MS
          );
          lastError =
            statusCode === 408 || statusCode === 504
              ? new AiReviewServiceError(
                  "PROVIDER_TIMEOUT",
                  "The AI evaluation service timed out. Please try again.",
                  504
                )
              : new AiReviewServiceError(
                  "PROVIDER_ERROR",
                  "The AI evaluation service encountered an upstream error. Please try again shortly.",
                  502
                );
          if (hasRemainingFallbacks) {
            continue;
          }
          throw lastError;
        }

        if (statusCode < 200 || statusCode >= 300) {
          throw new AiReviewServiceError(
            "PROVIDER_ERROR",
            "The AI evaluation service rejected the request.",
            502
          );
        }

        let parsed: ChatCompletionPayload;
        try {
          parsed = JSON.parse(rawBody) as ChatCompletionPayload;
        } catch {
          throw new AiReviewServiceError(
            "INVALID_MODEL_OUTPUT",
            "The AI tutor returned an invalid response payload.",
            502
          );
        }

        const message = parsed.choices?.[0]?.message;
        const content =
          message?.content?.trim() || message?.reasoning_content?.trim() || "";

        if (!content) {
          unhealthyModelUntil.set(
            candidateModel,
            Date.now() + UNHEALTHY_MODEL_COOLDOWN_MS
          );
          lastError = new AiReviewServiceError(
            "INVALID_MODEL_OUTPUT",
            "The AI tutor returned an empty evaluation response. Please try again.",
            502
          );
          if (hasRemainingFallbacks) {
            continue;
          }
          throw lastError;
        }

        return {
          rawContent: content,
          modelName: parsed.model || candidateModel,
        };
      } catch (err) {
        if (err instanceof AiReviewServiceError) {
          if (
            err.code === "QUOTA_EXHAUSTED" ||
            err.statusCode === 503 ||
            !hasRemainingFallbacks
          ) {
            throw err;
          }
          lastError = err;
          continue;
        }

        const isTimeout =
          err instanceof Error &&
          (err.name === "TimeoutError" ||
            err.name === "AbortError" ||
            err.message.toLowerCase().includes("timed out"));

        unhealthyModelUntil.set(
          candidateModel,
          Date.now() + UNHEALTHY_MODEL_COOLDOWN_MS
        );

        lastError = isTimeout
          ? new AiReviewServiceError(
              "PROVIDER_TIMEOUT",
              "The AI evaluation timed out while generating feedback. Please try again.",
              504
            )
          : new AiReviewServiceError(
              "PROVIDER_ERROR",
              "Unable to connect to the AI evaluation service. Please try again shortly.",
              502
            );

        if (hasRemainingFallbacks) {
          continue;
        }
        throw lastError;
      }
    }

    throw (
      lastError ||
      new AiReviewServiceError(
        "PROVIDER_ERROR",
        "Unable to generate AI evaluation at this time.",
        502
      )
    );
  }
}

export function getConfiguredAiEvaluationProvider(): AiEvaluationProvider {
  return new NvidiaNimEvaluationProvider();
}
