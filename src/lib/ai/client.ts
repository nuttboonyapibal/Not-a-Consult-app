import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

// Sonnet drafts and reviews form fields; Opus writes the project summary.
// Both can be changed with environment variables.
export const MODELS = {
  assist: process.env.AI_MODEL_ASSIST ?? "claude-sonnet-5-5",
  summary: process.env.AI_MODEL_SUMMARY ?? "claude-opus-5-5",
};

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiError("ANTHROPIC_API_KEY is not set", 503);
  client ??= new Anthropic();
  return client;
}

/** What one call used, for the AI usage log. */
export interface AiUsage {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
}

export class AiError extends Error {
  constructor(
    message: string,
    public status = 500,
    public usage?: AiUsage,
  ) {
    super(message);
  }
}

export interface GenerateArgs<S extends z.ZodType> {
  model: string;
  system: string;
  prompt: string;
  schema: S;
  effort?: "low" | "medium" | "high";
}

/**
 * One structured call. The system prompt is cached (it is the same for every
 * request); the per-request context goes in the user message.
 */
export async function generate<S extends z.ZodType>({
  model,
  system,
  prompt,
  schema,
  effort = "medium",
}: GenerateArgs<S>): Promise<{ output: z.infer<S>; usage: AiUsage }> {
  try {
    const response = await getClient().beta.messages.parse({
      model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: prompt }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
    });
    const usage: AiUsage = {
      // The model that answered, which differs from the requested one after a fallback.
      model: response.model,
      // Cache writes cost a little more than plain input; they are counted as input here.
      input_tokens: response.usage.input_tokens + (response.usage.cache_creation_input_tokens ?? 0),
      output_tokens: response.usage.output_tokens,
      cache_read_tokens: response.usage.cache_read_input_tokens ?? 0,
    };
    if (response.stop_reason === "refusal") throw new AiError("The AI declined this request. Try rephrasing.", 422, usage);
    if (response.stop_reason === "max_tokens") throw new AiError("The AI response was too long. Try a smaller step.", 502, usage);
    if (response.parsed_output == null) throw new AiError("The AI returned an unexpected format. Please try again.", 502, usage);
    return { output: response.parsed_output as z.infer<S>, usage };
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("The Anthropic API key is invalid.", 503);
    if (e instanceof Anthropic.RateLimitError) throw new AiError("The AI is busy. Please try again in a minute.", 429);
    if (e instanceof Anthropic.APIError) throw new AiError(`AI error (${e.status}): ${e.message}`, 502);
    throw e;
  }
}
