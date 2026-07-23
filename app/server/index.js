// MT Asphalt — backend tier.
// Dependency-free Node HTTP server: a small REST API over a JSON datastore,
// plus static serving of the built front-end (app/dist). The React app can
// run fully client-side (localStorage) OR against this server by setting
// VITE_API_URL at build/dev time — same data shape either way.
//
//   node server/index.js            → http://localhost:8787
//   PORT=9000 node server/index.js  → custom port
//
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data.json");
const DIST_DIR = path.join(__dirname, "..", "dist");
const PORT = process.env.PORT || 8787;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return null;
  }
}
function writeDb(obj) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
}

function send(res, code, body, type = "application/json") {
  res.writeHead(code, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  if (method === "OPTIONS") return send(res, 204, "");

  // --- API ---
  if (p === "/api/health") return send(res, 200, { ok: true, ts: Date.now() });

  if (p === "/api/db") {
    if (method === "GET") {
      const db = readDb();
      return send(res, 200, db ?? {});
    }
    if (method === "PUT" || method === "POST") {
      const body = await readBody(req);
      writeDb(body);
      return send(res, 200, { ok: true, savedAt: new Date().toISOString() });
    }
    return send(res, 405, { error: "method not allowed" });
  }

  // Per-collection read (handy for integrations): /api/jobs, /api/invoices, ...
  const m = p.match(/^\/api\/([a-z]+)$/);
  if (m && method === "GET") {
    const db = readDb() ?? {};
    const key = m[1];
    if (key in db) return send(res, 200, db[key]);
    return send(res, 404, { error: `unknown collection '${key}'` });
  }

  // --- static (serve built SPA) ---
  if (method === "GET") {
    let file = path.join(DIST_DIR, p === "/" ? "index.html" : decodeURIComponent(p));
    if (!file.startsWith(DIST_DIR)) return send(res, 403, { error: "forbidden" });
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const ext = path.extname(file);
      return send(res, 200, fs.readFileSync(file), MIME[ext] || "application/octet-stream");
    }
    // SPA fallback
    const index = path.join(DIST_DIR, "index.html");
    if (fs.existsSync(index)) return send(res, 200, fs.readFileSync(index), MIME[".html"]);
    return send(res, 404, { error: "not built — run `npm run build` first, or use `npm run dev`" });
  }

  send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`\n  MT Asphalt API + app  →  http://localhost:${PORT}`);
  console.log(`  REST:  GET/PUT /api/db   ·   GET /api/health   ·   GET /api/<collection>`);
  console.log(`  Data:  ${DATA_FILE}\n`);
});
