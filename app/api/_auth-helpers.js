// MT Asphalt — server-side auth helpers for Vercel Functions.
// Shared by api/auth.js, api/data.js and api/change-password.js.

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";
import { put, list } from "@vercel/blob";

export const PASSWORD_KEY = "auth/dashboard-password.json";

const DEFAULT_SEED_PASSWORD = "CHANGEME";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// This SDK build only supports access: "public" (private throws). The blob
// store's hostname is never sent to the browser — these functions always
// proxy parsed content back to the client, never the blob URL itself — so an
// outside caller would need the exact (random, per-project) store hostname
// plus this exact key to reach it directly. That's a secondary layer; the
// real access control is the password/token checks below.
async function readBlobJson(key) {
  const { blobs } = await list({ prefix: key, limit: 1 });
  if (!blobs || blobs.length === 0) return null;
  const res = await fetch(`${blobs[0].url}?t=${Date.now()}`); // bust edge cache
  if (!res.ok) return null;
  return res.json();
}

/**
 * Hash a plain-text password with a fresh random salt.
 * Returns an object serialisable as JSON: { salt, hash }.
 */
export function hashPassword(password) {
  const salt = randomBytes(32);
  const hash = scryptSync(password, salt, 64);
  return { salt: salt.toString("base64"), hash: hash.toString("base64") };
}

/**
 * Verify a plain-text password against a stored { salt, hash } record.
 * Uses timing-safe comparison to avoid leaking password validity.
 */
export function verifyPassword(password, record) {
  if (!record || typeof record.salt !== "string" || typeof record.hash !== "string") {
    return false;
  }
  try {
    const salt = Buffer.from(record.salt, "base64");
    const expectedHash = Buffer.from(record.hash, "base64");
    const actualHash = scryptSync(password, salt, expectedHash.length);
    if (actualHash.length !== expectedHash.length) return false;
    return timingSafeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

/**
 * Load the stored password hash record from Vercel Blob.
 * Returns null if the record has not been created yet.
 */
export async function getPasswordRecord() {
  try {
    return await readBlobJson(PASSWORD_KEY);
  } catch {
    return null;
  }
}

/**
 * Write the password hash record to Vercel Blob.
 */
export async function setPasswordRecord(record) {
  await put(PASSWORD_KEY, JSON.stringify(record), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/**
 * Ensure a password hash record exists.
 * On first-ever use, seed it from DASHBOARD_PASSWORD or the literal default
 * CHANGEME. Logs a clear warning when the default is seeded.
 */
export async function ensurePasswordRecord() {
  let record = await getPasswordRecord();
  if (record) return record;

  const seed = process.env.DASHBOARD_PASSWORD || DEFAULT_SEED_PASSWORD;
  if (seed === DEFAULT_SEED_PASSWORD) {
    // eslint-disable-next-line no-console
    console.warn(
      `[mt-asphalt-auth] No stored password hash found and DASHBOARD_PASSWORD is not set. ` +
        `Seeding the dashboard password with the default "${DEFAULT_SEED_PASSWORD}". ` +
        `Change it immediately via Settings → Change Password.`
    );
  }

  record = hashPassword(seed);
  await setPasswordRecord(record);
  return record;
}

// Session tokens are stateless (self-verifying HMAC + expiry), not looked up
// in storage on every request. An earlier version stored active tokens as a
// JSON blob and re-read it on every /api/data call, but Vercel Blob's public
// CDN read-after-write consistency lag meant a token issued by /api/auth
// could still fail verification in /api/data seconds later, in production
// (confirmed via prod logs — a freshly-issued token verified fine locally but
// 401'd from the deployed function). A signed token needs no storage read to
// verify, so there's nothing to be stale.
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
 * Issue a new signed session token, valid for SESSION_TTL_MS.
 */
export function issueToken() {
  const expires = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Check whether a token is well-formed, correctly signed, and unexpired.
 */
export async function isTokenValid(token) {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiresStr, nonce, sig] = parts;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const expected = sign(`${expiresStr}.${nonce}`);
  let actual;
  try {
    actual = Buffer.from(sig, "hex");
  } catch {
    return false;
  }
  const expectedBuf = Buffer.from(expected, "hex");
  if (actual.length !== expectedBuf.length) return false;
  return timingSafeEqual(actual, expectedBuf);
}
