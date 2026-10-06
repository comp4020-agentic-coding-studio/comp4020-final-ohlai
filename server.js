import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const DATA = process.env.DATA_DIR ?? (process.env.FLY_APP_NAME ? "/data" : "./data");
mkdirSync(DATA, { recursive: true });
const db = new DatabaseSync(`${DATA}/app.db`);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY,
    pt_token TEXT UNIQUE NOT NULL,
    client_token TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    pt_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    position INTEGER NOT NULL,
    name TEXT NOT NULL,
    sets INTEGER NOT NULL,
    reps TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS set_logs (
    id INTEGER PRIMARY KEY,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_no INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight REAL,
    logged_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
// Added after the first deploy; SQLite has no ADD COLUMN IF NOT EXISTS.
if (!db.prepare("SELECT 1 FROM pragma_table_info('exercises') WHERE name = 'rest_seconds'").get())
  db.exec("ALTER TABLE exercises ADD COLUMN rest_seconds INTEGER NOT NULL DEFAULT 90");

// A session is one workout: the client picks a day, logs sets, then finishes
// it. Sets logged before sessions existed have no session_id.
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT
  );
`);
if (!db.prepare("SELECT 1 FROM pragma_table_info('set_logs') WHERE name = 'session_id'").get())
  db.exec("ALTER TABLE set_logs ADD COLUMN session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE");

const page = (f) => readFileSync(new URL(`./public/${f}`, import.meta.url));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const token = () => randomBytes(12).toString("base64url");

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": `${type}; charset=utf-8` });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error("too large");
  }
  return JSON.parse(raw);
}

const str = (v, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

function createProgram(body) {
  const title = str(body.title), pt = str(body.pt_name), client = str(body.client_name);
  const email = str(body.client_email);
  const exercises = Array.isArray(body.exercises) ? body.exercises : [];
  if (!title || !pt || !client || !email || !/^\S+@\S+\.\S+$/.test(email)) return null;
  const clean = exercises
    .map((e) => ({
      day: str(e.day, 60) ?? "Day 1",
      name: str(e.name),
      sets: Math.min(Math.max(parseInt(e.sets) || 0, 1), 20),
      reps: str(String(e.reps ?? ""), 20) ?? "10",
      notes: str(e.notes, 500) ?? "",
      rest: Math.min(Math.max(parseInt(e.rest) || 90, 0), 600),
    }))
    .filter((e) => e.name);
  if (!clean.length) return null;

  const ptToken = token(), clientToken = token();
  db.exec("BEGIN");
  try {
    const { lastInsertRowid: id } = db
      .prepare("INSERT INTO programs (pt_token, client_token, title, pt_name, client_name, client_email) VALUES (?,?,?,?,?,?)")
      .run(ptToken, clientToken, title, pt, client, email);
    const ins = db.prepare("INSERT INTO exercises (program_id, day, position, name, sets, reps, notes, rest_seconds) VALUES (?,?,?,?,?,?,?,?)");
    clean.forEach((e, i) => ins.run(id, e.day, i, e.name, e.sets, e.reps, e.notes, e.rest));
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return { ptToken, clientToken };
}

// Either token opens the program; which one tells us who is looking.
function findProgram(tok) {
  const p = db.prepare("SELECT * FROM programs WHERE client_token = ? OR pt_token = ?").get(tok, tok);
  if (!p) return null;
  const role = p.pt_token === tok ? "pt" : "client";
  const exercises = db.prepare("SELECT * FROM exercises WHERE program_id = ? ORDER BY position").all(p.id);
  const logs = db
    .prepare("SELECT l.* FROM set_logs l JOIN exercises e ON e.id = l.exercise_id WHERE e.program_id = ? ORDER BY l.logged_at, l.id")
    .all(p.id);
  const sessions = db.prepare("SELECT * FROM sessions WHERE program_id = ? ORDER BY started_at, id").all(p.id);
  return {
    role,
    program: { id: p.id, title: p.title, pt_name: p.pt_name, client_name: p.client_name, client_email: p.client_email, created_at: p.created_at },
    client_token: role === "pt" ? p.client_token : undefined,
    exercises,
    logs,
    sessions,
    open_session: sessions.find((x) => !x.finished_at) ?? null,
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const path = url.pathname;
  try {
    if (req.method === "GET" && path === "/") return send(res, 200, page("index.html"), "text/html");
    if (req.method === "GET" && (path === "/readme" || path === "/readme/")) {
      // ponytail: README served verbatim in <pre>; render markdown properly if it starts to matter
      const md = esc(readFileSync(new URL("./README.md", import.meta.url), "utf8"));
      return send(res, 200, page("readme.html").toString().replace("@README@", md), "text/html");
    }
    if (req.method === "GET" && /^\/p\/[\w-]+$/.test(path)) return send(res, 200, page("program.html"), "text/html");
    if (req.method === "GET" && path === "/style.css") return send(res, 200, page("style.css"), "text/css");
    if (req.method === "GET" && /^\/fonts\/[\w-]+\.woff2$/.test(path)) {
      res.writeHead(200, { "content-type": "font/woff2", "cache-control": "public, max-age=31536000, immutable" });
      return res.end(page(path.slice(1)));
    }
    if (req.method === "GET" && path === "/view.js") return send(res, 200, page("view.js"), "text/javascript");

    if (req.method === "POST" && path === "/api/programs") {
      const made = createProgram(await readJson(req));
      return made ? send(res, 201, made) : send(res, 400, { error: "Need a title, both names, a valid email and at least one exercise." });
    }

    const m = path.match(/^\/api\/p\/([\w-]+)(?:\/(log|unlog|remove|start|finish|discard))?$/);
    if (m) {
      const found = findProgram(m[1]);
      if (!found) return send(res, 404, { error: "No program at this link." });
      if (req.method === "GET" && !m[2]) return send(res, 200, found);
      if (req.method === "POST" && m[2]) {
        if (found.role !== "client") return send(res, 403, { error: "Only the client logs sets." });
        const b = await readJson(req);
        const open = found.open_session;
        const fresh = (status = 200) => send(res, status, findProgram(m[1]));

        if (m[2] === "start") {
          if (open) return send(res, 409, { error: "Finish or discard the workout you've already started." });
          if (!found.exercises.some((e) => e.day === b.day)) return send(res, 400, { error: "No such workout." });
          db.prepare("INSERT INTO sessions (program_id, day) VALUES (?, ?)").run(found.program.id, b.day);
          return fresh(201);
        }
        if (!open) return send(res, 409, { error: "Start a workout first." });

        if (m[2] === "finish") {
          // An empty workout isn't worth keeping.
          if (found.logs.some((l) => l.session_id === open.id))
            db.prepare("UPDATE sessions SET finished_at = datetime('now') WHERE id = ?").run(open.id);
          else db.prepare("DELETE FROM sessions WHERE id = ?").run(open.id);
          return fresh();
        }
        if (m[2] === "discard") {
          db.prepare("DELETE FROM set_logs WHERE session_id = ?").run(open.id);
          db.prepare("DELETE FROM sessions WHERE id = ?").run(open.id);
          return fresh();
        }
        if (m[2] === "unlog") {
          const log = found.logs.find((l) => l.id === Number(b.id) && l.session_id === open.id);
          if (!log) return send(res, 404, { error: "No such set." });
          db.prepare("DELETE FROM set_logs WHERE id = ?").run(log.id);
          return fresh();
        }

        const ex = found.exercises.find((e) => e.id === Number(b.exercise_id));
        const setNo = parseInt(b.set_no);
        if (!ex || !(setNo >= 1)) return send(res, 400, { error: "Bad set." });

        if (m[2] === "remove") {
          // Drop the set and close the gap, so set 3 becomes set 2.
          db.exec("BEGIN");
          db.prepare("DELETE FROM set_logs WHERE session_id = ? AND exercise_id = ? AND set_no = ?").run(open.id, ex.id, setNo);
          db.prepare("UPDATE set_logs SET set_no = set_no - 1 WHERE session_id = ? AND exercise_id = ? AND set_no > ?").run(open.id, ex.id, setNo);
          db.exec("COMMIT");
          return fresh();
        }

        const reps = parseInt(b.reps);
        const weight = b.weight === "" || b.weight == null ? null : Number(b.weight);
        if (!(reps >= 0) || (weight !== null && !Number.isFinite(weight))) return send(res, 400, { error: "Bad set." });
        db.prepare("DELETE FROM set_logs WHERE session_id = ? AND exercise_id = ? AND set_no = ?").run(open.id, ex.id, setNo);
        db.prepare("INSERT INTO set_logs (exercise_id, set_no, reps, weight, session_id) VALUES (?,?,?,?,?)").run(ex.id, setNo, reps, weight, open.id);
        return fresh(201);
      }
    }
    send(res, 404, "Not found", "text/plain");
  } catch (err) {
    console.error(err);
    send(res, 400, { error: "Bad request." });
  }
});

const port = Number(process.env.PORT ?? 8080);
server.listen(port, "0.0.0.0", () => console.log(`listening on :${port}`));
