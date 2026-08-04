// MT Asphalt — dashboard password gate (Vercel Function).
//
//   POST /api/auth  → verify password and return a session token
//
// WHY THIS EXISTS: the previous client-only gate accepted any non-empty string,
// so anyone reading the JS bundle (or guessing /dashboard) could see every
// customer, invoice, and revenue number. The real password hash now lives only
// on the server in Vercel Blob at auth/dashboard-password.json.
//
// On the very first request the hash is seeded from DASHBOARD_PASSWORD (or the
// literal default "CHANGEME" if the env var is missing), then stored in Blob.
// After that the env var is only a convenient way to set the initial password;
// changes are made from Settings → Change Password.
//
// Session tokens are signed (HMAC + expiry) via issueToken(), not looked up in
// storage — see the comment above issueToken() in _auth-helpers.js for why.

import { ensurePasswordRecord, verifyPassword, issueToken } from "./_auth-helpers.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const password = typeof body.password === "string" ? body.password : "";

  try {
    const record = await ensurePasswordRecord();

    if (!verifyPassword(password, record)) {
      return res.status(401).json({ error: "invalid password" });
    }

    return res.status(200).json({ token: issueToken() });
  } catch (err) {
    // Most common cause: Blob store not connected yet (missing BLOB_READ_WRITE_TOKEN)
    // eslint-disable-next-line no-console
    console.error("[mt-asphalt-auth] auth error:", err?.message ?? err);
    return res.status(500).json({ error: "auth unavailable", detail: String(err?.message ?? err) });
  }
}
