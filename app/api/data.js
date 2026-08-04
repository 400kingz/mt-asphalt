// MT Asphalt — serverless dashboard persistence (Vercel Function + Vercel Blob).
//
//   GET /api/data  → return the full dashboard database blob
//   PUT /api/data  → store the full dashboard database blob
//
// This is the off-browser backup for the single-owner dashboard. The blob key is
// fixed per deployment; if multi-tenancy is ever needed, key it by account.
//
// AUTH REQUIRED on both methods: this blob holds customers, invoices, contracts
// and revenue, not just public marketing content — an unauthenticated GET here
// would hand the entire customer database to anyone (or anything) that requests
// it, including every visitor's browser if this were ever called from the public
// site. Callers must send `Authorization: Bearer <token>` from a token issued by
// POST /api/auth. (This SDK build only supports access: "public" for blobs —
// there is no private mode here — so the session-token check below is the real
// access control, not the blob's own obscurity.)
import { put, list } from "@vercel/blob";
import { isTokenValid } from "./_auth-helpers.js";

const BLOB_KEY = "data/dashboard-v1.json";

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const token = getBearerToken(req);
  if (!token || !(await isTokenValid(token))) {
    return res.status(401).json({ error: "authentication required" });
  }

  try {
    if (req.method === "GET") {
      const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
      if (!blobs || blobs.length === 0) return res.status(200).json(null);
      const r = await fetch(`${blobs[0].url}?t=${Date.now()}`); // bust edge cache
      if (!r.ok) throw new Error(`blob fetch failed: ${r.status}`);
      return res.status(200).json(await r.json());
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "object" && req.body ? req.body : {};
      if (!body.settings || typeof body.settings !== "object") {
        return res.status(400).json({ error: "invalid dashboard data" });
      }

      await put(BLOB_KEY, JSON.stringify(body), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    // Most common cause: Blob store not connected yet (missing BLOB_READ_WRITE_TOKEN)
    return res
      .status(500)
      .json({ error: "dashboard storage unavailable", detail: String(err?.message ?? err) });
  }
}
