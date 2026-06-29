import Anthropic from "@anthropic-ai/sdk";
import type { AgentName } from "@/lib/types/database";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const CLAUDE_MODEL = "claude-sonnet-4-6";

export interface ClaudeResult<T> {
  data: T | null;
  tokensUsed: number;
  error?: string;
}

export async function callClaude<T>(
  prompt: string,
  options?: {
    maxTokens?: number;
    images?: string[];
    system?: string;
  }
): Promise<ClaudeResult<T>> {
  try {
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (options?.images?.length) {
      for (const url of options.images.slice(0, 5)) {
        content.push({
          type: "image",
          source: { type: "url", url },
        });
      }
    }

    content.push({ type: "text", text: prompt });

    const response = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: options?.maxTokens ?? 1000,
      system: options?.system,
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";
    const tokensUsed =
      (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { data: null, tokensUsed, error: "No JSON in response" };
    }

    const data = JSON.parse(jsonMatch[0]) as T;
    return { data, tokensUsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claude API error";
    return { data: null, tokensUsed: 0, error: message };
  }
}

export async function callClaudeText(
  prompt: string,
  options?: { maxTokens?: number; system?: string }
): Promise<ClaudeResult<string>> {
  try {
    const response = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: options?.maxTokens ?? 1000,
      system: options?.system,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";
    const tokensUsed =
      (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    return { data: text, tokensUsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claude API error";
    return { data: null, tokensUsed: 0, error: message };
  }
}

export async function logAgentAction(
  agent: AgentName,
  action: string,
  opts: {
    propertyId?: string;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    tokensUsed?: number;
    status: "success" | "error" | "pending";
  }
) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    await supabase.from("agent_logs").insert({
      agent,
      action,
      property_id: opts.propertyId ?? null,
      input: opts.input ?? null,
      output: opts.output ?? null,
      tokens_used: opts.tokensUsed ?? null,
      status: opts.status,
    });
  } catch {
    console.error(`Failed to log agent action: ${agent}/${action}`);
  }
}
