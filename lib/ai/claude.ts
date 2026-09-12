import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { isLiveAiConfigured } from "@/lib/config";
import { parseModelFeedback, type ModelFeedback } from "@/lib/domain/schema";
import type { Task } from "@/lib/domain/types";
import { buildModelPayload, FEEDBACK_JSON_SCHEMA, FEEDBACK_SYSTEM_INSTRUCTION } from "./prompt";
import { validateModelFeedback } from "./validate";

export { isLiveAiConfigured };

export async function generateLiveFeedback(input: {
  task: Task;
  answerText: string;
  question?: string;
  signal?: AbortSignal;
}): Promise<{ ok: true; data: ModelFeedback } | { ok: false; reason: string }> {
  if (!isLiveAiConfigured()) {
    return { ok: false, reason: "not_configured" };
  }
  const model = process.env.ANTHROPIC_MODEL!;
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 20_000,
    maxRetries: 0,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  if (input.signal) {
    input.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  try {
    const response = await client.messages.create(
      {
        model,
        max_tokens: 1024,
        system: FEEDBACK_SYSTEM_INSTRUCTION,
        messages: [
          {
            role: "user",
            content: JSON.stringify(buildModelPayload(input.task, input.answerText, input.question)),
          },
        ],
        output_config: {
          format: jsonSchemaOutputFormat(FEEDBACK_JSON_SCHEMA),
        },
      },
      { signal: controller.signal },
    );
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    const json = JSON.parse(text) as unknown;
    const parsed = parseModelFeedback(json);
    if (!parsed.ok) return { ok: false, reason: "schema" };
    const semantic = validateModelFeedback(parsed.data, input.answerText, input.task.rubric);
    if (!semantic.ok) return { ok: false, reason: semantic.reason };
    return { ok: true, data: semantic.data };
  } catch {
    return { ok: false, reason: "provider" };
  } finally {
    clearTimeout(timer);
  }
}
