// MT Asphalt — who am I (Vercel Function).
//
//   GET /api/auth/me  → { email } for the signed-in admin, from the session
//                        token already issued by google-callback.js
//
// Lets the dashboard show "Signed in as ..." without decoding the (signed,
// tamper-evident) session token on the client.

import { verifyToken } from "../_auth-helpers.js";

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const session = verifyToken(getBearerToken(req));
  if (!session) return res.status(401).json({ error: "authentication required" });

  return res.status(200).json({ email: session.email });
}
