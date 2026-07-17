// MT Asphalt — serverless lead inbox (Vercel Function + Vercel Blob).
//
//   POST /api/leads  → store an estimate request (one blob per lead: no write races)
//   GET  /api/leads  → newest-first list; the dashboard merges these on load
//
// Email notification: set RESEND_API_KEY (+ optionally NOTIFY_EMAIL / NOTIFY_FROM)
// in Vercel env vars and Michael gets an email for every new request. Without the
// key it silently skips — safe to deploy before Resend is set up.
import { put, list } from "@vercel/blob";

const MAX = (s, n) => String(s ?? "").slice(0, n);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "POST") {
      const b = typeof req.body === "object" && req.body ? req.body : {};
      if (!MAX(b.name, 120).trim() || !MAX(b.phone, 40).trim()) {
        return res.status(400).json({ error: "name and phone are required" });
      }

      // Server-authoritative shape — never trust client fields blindly.
      const lead = {
        id: `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name: MAX(b.name, 120).trim(),
        phone: MAX(b.phone, 40).trim(),
        email: MAX(b.email, 160).trim(),
        address: MAX(b.address, 200).trim(),
        city: MAX(b.city, 80).trim(),
        serviceInterest: MAX(b.serviceInterest, 160).trim() || "General inquiry",
        message: MAX(b.message, 2000).trim(),
        status: "new",
        source: "website",
        createdAt: new Date().toISOString(),
      };

      await put(`leads/${lead.id}.json`, JSON.stringify(lead), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      });

      await notifyMichael(lead); // no-op until RESEND_API_KEY is configured
      return res.status(201).json({ ok: true, id: lead.id });
    }

    if (req.method === "GET") {
      const { blobs } = await list({ prefix: "leads/", limit: 200 });
      const leads = await Promise.all(
        blobs.map(async (blob) => {
          try {
            const r = await fetch(`${blob.url}?t=${Date.now()}`); // bust edge cache
            return await r.json();
          } catch {
            return null;
          }
        })
      );
      const clean = leads
        .filter((l) => l && l.id)
        .sort((a, z) => String(z.createdAt).localeCompare(String(a.createdAt)));
      return res.status(200).json(clean);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    // Most common cause: Blob store not connected yet (missing BLOB_READ_WRITE_TOKEN)
    return res.status(500).json({ error: "lead storage unavailable", detail: String(err?.message ?? err) });
  }
}

async function notifyMichael(lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "MT Asphalt Website <onboarding@resend.dev>",
        to: [to],
        subject: `New estimate request — ${lead.name}${lead.city ? ` (${lead.city})` : ""}`,
        text: [
          `New free-estimate request from the MT Asphalt website:`,
          ``,
          `Name:     ${lead.name}`,
          `Phone:    ${lead.phone}`,
          `Email:    ${lead.email || "—"}`,
          `City:     ${lead.city || "—"}`,
          `Service:  ${lead.serviceInterest}`,
          ``,
          `Message:`,
          lead.message || "—",
          ``,
          `Open the dashboard → /dashboard/leads`,
        ].join("\n"),
      }),
    });
  } catch {
    /* email failure must never lose the lead */
  }
}
