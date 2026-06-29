// Real model call to the Anthropic Messages API. Used in production.
// Bulk pass uses Haiku for cost; promote the shortlist to Sonnet if you want
// richer reasons. The key never leaves the server (read from env).

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export function makeAnthropicCaller(model) {
  const chosen = model || "claude-haiku-4-5-20251001";
  return async function callModel(systemPrompt, userContent) {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: chosen,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error("Anthropic call failed: " + res.status + " " + detail);
    }
    const data = await res.json();
    return (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  };
}
