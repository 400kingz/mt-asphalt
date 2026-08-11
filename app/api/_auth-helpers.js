// MT Asphalt — server-side auth helpers for Vercel Functions.
// Shared by api/auth/google-login.js, api/auth/google-callback.js,
// api/auth/me.js and api/data.js.

import { randomBytes, timingSafeEqual, createHmac } from "crypto";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Michael's account always has access, regardless of how ADMIN_EMAILS is
// configured — this keeps the owner from ever being locked out of his own
// dashboard by a env var typo or an unset var on a fresh deploy. Additional
// admins are added via the ADMIN_EMAILS env var (comma-separated), not by
// editing this file.
const BASE_ADMIN_EMAILS = ["mtasphalt72@gmail.com"];

function sessionSecret() {
  // Local dev without the env var still works, with a fixed (not secret)
  // key — fine since nothing sensitive is at stake outside production, and
  // production has SESSION_SECRET set via Vercel env vars.
  return process.env.SESSION_SECRET || "local-dev-only-not-secret";
}

function sign(payload) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

/**
 * Whether an email is allowed to sign in to the dashboard. Case- and
 * whitespace-insensitive. Combines the hardcoded owner email with any extra
 * addresses in ADMIN_EMAILS (comma-separated).
 */
export function isAdminEmail(email) {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const extra = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...BASE_ADMIN_EMAILS, ...extra]).has(normalized);
}

// Session tokens are stateless (self-verifying HMAC + expiry + the signed-in
// email), not looked up in storage on every request. An earlier version
// stored active tokens as a JSON blob and re-read it on every /api/data
// call, but Vercel Blob's public CDN read-after-write consistency lag meant
// a token issued moments earlier could still fail verification in
// production (confirmed via prod logs). A signed token needs no storage
// read to verify, so there's nothing to be stale.

/**
 * Issue a new signed session token for an already-verified admin email,
 * valid for SESSION_TTL_MS.
 */
export function issueToken(email) {
  const expires = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const emailB64 = Buffer.from(email, "utf8").toString("base64url");
  const payload = `${expires}.${emailB64}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify a token's signature and expiry, returning its payload
 * ({ email, expires }) if valid or null otherwise.
 */
export function verifyToken(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [expiresStr, emailB64, nonce, sig] = parts;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  const payload = `${expiresStr}.${emailB64}.${nonce}`;
  const expected = sign(payload);
  let actual, expectedBuf;
  try {
    actual = Buffer.from(sig, "hex");
    expectedBuf = Buffer.from(expected, "hex");
  } catch {
    return null;
  }
  if (actual.length !== expectedBuf.length || !timingSafeEqual(actual, expectedBuf)) {
    return null;
  }

  let email;
  try {
    email = Buffer.from(emailB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  return { email, expires };
}

/**
 * Check whether a token is well-formed, correctly signed, and unexpired.
 */
export function isTokenValid(token) {
  return verifyToken(token) !== null;
}

/* ---------------- OAuth CSRF-state cookie + tiny cookie helpers ---------------- */

const STATE_COOKIE = "mta_oauth_state";

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  });
  return out;
}

// `Secure` cookies are silently dropped by browsers over plain HTTP, which
// is exactly what local `vercel dev` uses on http://localhost — detect the
// scheme from the forwarded-proto header (set by Vercel's proxy in every
// real deployment) instead of hardcoding it.
function isHttps(req) {
  return String(req.headers["x-forwarded-proto"] || "").includes("https");
}

export function setStateCookie(req, res, state) {
  const secure = isHttps(req) ? " Secure;" : "";
  res.setHeader(
    "Set-Cookie",
    `${STATE_COOKIE}=${encodeURIComponent(state)}; HttpOnly;${secure} SameSite=Lax; Max-Age=300; Path=/`
  );
}

export function clearStateCookie(req, res) {
  const secure = isHttps(req) ? " Secure;" : "";
  res.setHeader("Set-Cookie", `${STATE_COOKIE}=; HttpOnly;${secure} SameSite=Lax; Max-Age=0; Path=/`);
}

export function readStateCookie(req) {
  return parseCookies(req)[STATE_COOKIE] || "";
}

export function randomState() {
  return randomBytes(24).toString("hex");
}
