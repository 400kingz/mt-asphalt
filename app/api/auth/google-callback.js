// MT Asphalt — Google OAuth callback (Vercel Function).
//
//   GET /api/auth/google-callback  → exchange the code, check the admin
//                                     allowlist, and hand the SPA a session
//
// Only emails on the allowlist (isAdminEmail in ../_auth-helpers.js) get a
// session token; everyone else is bounced back to the login screen with an
// `authError` flag the UI turns into a plain-English message.
//
// The token is handed back in the URL *fragment* (`#auth=...`), not a query
// string — fragments are never sent to the server or logged by proxies, and
// AdminLayout picks it up client-side and moves it into sessionStorage.

import { readStateCookie, clearStateCookie, isAdminEmail, issueToken } from "../_auth-helpers.js";

function redirectUri(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}/api/auth/google-callback`;
}

function bounce(res, error) {
  res.writeHead(302, { Location: `/dashboard?authError=${error}` });
  res.end();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const { code, state, error: oauthError } = req.query;
  const expectedState = readStateCookie(req);
  clearStateCookie(req, res);

  if (oauthError) return bounce(res, "denied");
  if (!code || !state || state !== expectedState) return bounce(res, "state");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return bounce(res, "config");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      console.error("[mt-asphalt-auth] token exchange failed:", tokenRes.status, await tokenRes.text());
      return bounce(res, "exchange");
    }
    const tokens = await tokenRes.json();

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) return bounce(res, "userinfo");
    const profile = await userRes.json();

    if (!profile.email || !profile.email_verified) return bounce(res, "unverified");
    if (!isAdminEmail(profile.email)) return bounce(res, "forbidden");

    const token = issueToken(profile.email);
    res.writeHead(302, { Location: `/dashboard#auth=${encodeURIComponent(token)}` });
    res.end();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[mt-asphalt-auth] google callback error:", err?.message ?? err);
    return bounce(res, "server");
  }
}
