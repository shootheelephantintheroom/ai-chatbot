import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Anthropic client. The API key is read from the environment and
 * never reaches the browser — this module must only be imported by route
 * handlers / server code.
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CHAT_MODEL = "claude-sonnet-4-6";
