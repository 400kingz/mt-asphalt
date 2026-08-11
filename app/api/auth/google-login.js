// MT Asphalt — start the Google OAuth sign-in flow (Vercel Function).
//
//   GET /api/auth/google-login  → redirect to Google's consent screen
//
// Replaces the old shared dashboard password: only Google accounts on the
// admin allowlist (see isAdminEmail in ../_auth-helpers.js) can get past
// google-callback.js. See MICHAEL_GUIDE.md for how to create the Google
// OAuth client this depends on.

import { randomState, setStateCookie } from "../_auth-helpers.js";

function redirectUri(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}/api/auth/google-callback`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    return res.end(
      "Google sign-in isn't configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET " +
        "in your environment — see MICHAEL_GUIDE.md for the Google Cloud Console steps."
    );
  }

  const state = randomState();
  setStateCookie(req, res, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });

  res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  res.end();
}
