// MT Asphalt — dashboard password change endpoint (Vercel Function).
//
//   POST /api/change-password  → change the dashboard password
//
// Requires a currently-valid session token AND the current password. Returns a
// generic 401 for any verification failure so we don't leak whether the token
// or the password was wrong.

import { ensurePasswordRecord, verifyPassword, setPasswordRecord, hashPassword, isTokenValid } from "./_auth-helpers.js";

const MIN_PASSWORD_LENGTH = 6;
const GENERIC_UNAUTHORIZED = "Current password is incorrect. Please try again.";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const token = typeof body.token === "string" ? body.token : "";
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  try {
    const [tokenOk, record] = await Promise.all([
      isTokenValid(token),
      ensurePasswordRecord(),
    ]);

    if (!tokenOk || !verifyPassword(currentPassword, record)) {
      return res.status(401).json({ error: GENERIC_UNAUTHORIZED });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }

    await setPasswordRecord(hashPassword(newPassword));
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Most common cause: Blob store not connected yet (missing BLOB_READ_WRITE_TOKEN)
    // eslint-disable-next-line no-console
    console.error("[mt-asphalt-auth] change-password error:", err?.message ?? err);
    return res.status(500).json({ error: "password change unavailable", detail: String(err?.message ?? err) });
  }
}
