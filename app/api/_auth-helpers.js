// MT Asphalt — server-side auth helpers for Vercel Functions.
// Shared by api/auth.js and api/change-password.js.

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { get, put } from "@vercel/blob";

export const PASSWORD_KEY = "auth/dashboard-password.json";
export const SESSIONS_KEY = "auth/sessions.json";

const DEFAULT_SEED_PASSWORD = "CHANGEME";

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
    const blob = await get(PASSWORD_KEY, { access: "private", useCache: false });
    if (!blob) return null;
    return await blob.json();
  } catch {
    return null;
  }
}

/**
 * Write the password hash record to Vercel Blob.
 */
export async function setPasswordRecord(record) {
  await put(PASSWORD_KEY, JSON.stringify(record), {
    access: "private",
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

/**
 * Load the active session list from Vercel Blob.
 */
async function getSessions() {
  try {
    const blob = await get(SESSIONS_KEY, { access: "private", useCache: false });
    if (!blob) return { tokens: [] };
    const data = await blob.json();
    if (!data || !Array.isArray(data.tokens)) return { tokens: [] };
    return data;
  } catch {
    return { tokens: [] };
  }
}

/**
 * Persist the session list to Vercel Blob.
 */
async function setSessions(data) {
  await put(SESSIONS_KEY, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/**
 * Store a newly issued session token so it can be validated later.
 */
export async function addSession(token) {
  const sessions = await getSessions();
  // Keep the list bounded: drop the oldest sessions when it grows too large.
  const tokens = sessions.tokens.slice(-99);
  tokens.push({ token, createdAt: new Date().toISOString() });
  await setSessions({ tokens });
  return token;
}

/**
 * Check whether a token is currently in the active session list.
 */
export async function isTokenValid(token) {
  const sessions = await getSessions();
  return sessions.tokens.some((t) => t && t.token === token);
}
