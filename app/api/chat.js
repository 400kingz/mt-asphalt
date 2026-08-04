// MT Asphalt — AI proxy (Vercel Function).
//
//   POST /api/chat  → forwards a chat completion to whichever provider is configured
//
// WHY THIS EXISTS: the API key must never reach the browser. Calling the model
// directly from React would ship the key in the JS bundle, where anyone who opens
// devtools on the public site can read it and spend money on it. The key lives here,
// server-side, and the browser only ever talks to this endpoint.
//
// PROVIDER-AGNOSTIC. Anything speaking the OpenAI chat-completions shape works:
//
//   AI_API_KEY    required   the provider key
//   AI_BASE_URL   optional   default https://api.deepseek.com
//   AI_MODEL      optional   default deepseek-v4-flash
//
//   DeepSeek direct  →  AI_BASE_URL=https://api.deepseek.com        AI_MODEL=deepseek-v4-flash
//   OpenCode Go      →  AI_BASE_URL=https://opencode.ai/zen/v1      AI_MODEL=deepseek-v4-pro
//
// With no key set this returns 503 with { configured: false }. The assistant detects
// that and falls back to its built-in scripted flow, so the dashboard still works.

const DEFAULT_BASE = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";

const MAX_MESSAGES = 40;
const MAX_CHARS = 60_000;
const TIMEOUT_MS = 45_000;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const key = process.env.AI_API_KEY;
  if (!key) {
    // Not an error condition — the assistant has a no-API fallback path.
    return res.status(503).json({
      configured: false,
      error:
        "No AI key configured. Set AI_API_KEY in the Vercel project (or app/.env.local for local dev).",
    });
  }

  const base = (process.env.AI_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const messages = Array.isArray(body.messages) ? body.messages : null;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "messages[] is required" });
  }
  if (messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: `too many messages (max ${MAX_MESSAGES})` });
  }

  // Normalise and bound the payload. Never forward arbitrary client fields to the
  // provider, and never let a runaway client rack up a bill on a giant prompt.
  let total = 0;
  const clean = [];
  for (const m of messages) {
    const role = m && typeof m.role === "string" ? m.role : null;
    const content = m && typeof m.content === "string" ? m.content : null;
    if (!role || !content) continue;
    if (!["system", "user", "assistant"].includes(role)) continue;
    total += content.length;
    if (total > MAX_CHARS) {
      return res.status(413).json({ error: "conversation too long — start a new one" });
    }
    clean.push({ role, content });
  }
  if (clean.length === 0) {
    return res.status(400).json({ error: "no valid messages" });
  }

  const payload = {
    model,
    messages: clean,
    temperature: typeof body.temperature === "number" ? body.temperature : 0.2,
    max_tokens: Math.min(Number(body.max_tokens) || 1200, 4000),
  };
  // JSON mode: the provider requires the word "json" somewhere in the prompt.
  if (body.json === true) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      // Surface the status so the client can distinguish "out of credit" from
      // "bad request", but never echo anything that could contain the key.
      return res.status(502).json({
        error: "model provider error",
        status: upstream.status,
        detail: text.slice(0, 400),
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "provider returned invalid JSON" });
    }

    const content = data?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({
      configured: true,
      content,
      model: data?.model ?? model,
      usage: data?.usage ?? null,
    });
  } catch (err) {
    const aborted = err?.name === "AbortError";
    return res.status(aborted ? 504 : 502).json({
      error: aborted ? "model request timed out" : "could not reach model provider",
    });
  } finally {
    clearTimeout(timer);
  }
}
