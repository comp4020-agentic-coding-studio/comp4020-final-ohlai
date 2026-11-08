import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { trend, scorer, summed } from "./public/progress.js";

const DATA = process.env.DATA_DIR ?? (process.env.FLY_APP_NAME ? "/data" : "./data");
const UPLOADS = `${DATA}/uploads`;
mkdirSync(UPLOADS, { recursive: true });
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
const hasColumn = (table, col) => db.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).get(col);
if (!hasColumn("exercises", "rest_seconds"))
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
if (!hasColumn("set_logs", "session_id"))
  db.exec("ALTER TABLE set_logs ADD COLUMN session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE");

// Accounts (docs/adr/0003-accounts-and-chat.md). Clients sign up from an
// invite (the invites table below); a program's link is only used inside the app.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('pt', 'client')),
    pass TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS logins (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    pt_id INTEGER NOT NULL REFERENCES users(id),
    client_id INTEGER NOT NULL REFERENCES users(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL DEFAULT '',
    image TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS reads (
    user_id INTEGER NOT NULL,
    other_id INTEGER NOT NULL,
    last_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, other_id)
  );
`);
for (const col of ["pt_user_id", "client_user_id"])
  if (!hasColumn("programs", col)) db.exec(`ALTER TABLE programs ADD COLUMN ${col} INTEGER REFERENCES users(id)`);

// Who did what, kept for good: flyctl logs only holds the last little while.
// docs/adr/0002-who-can-do-what.md says why it looks like this.
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    at TEXT NOT NULL,
    program_id INTEGER,
    role TEXT,
    who TEXT,
    action TEXT NOT NULL,
    status INTEGER NOT NULL,
    line TEXT NOT NULL
  );
`);
// Templates and weekly check-ins. A template is a copy, never linked to the
// programs started from it, so editing one can't change a client's program.
// Check-in questions are the PT's own (users.checkin_questions, JSON), and each
// check-in keeps the questions it was answered against.
db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY,
    pt_user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    exercises TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY,
    pt_id INTEGER NOT NULL REFERENCES users(id),
    client_id INTEGER NOT NULL REFERENCES users(id),
    questions TEXT NOT NULL,
    answers TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
// An invite is to the app, not to a program: who invited whom. Programs are
// tied to the client by email until they sign up, then by their account.
db.exec(`
  CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    pt_user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    used_at TEXT
  );
`);
// Changing a client's program ends the old one (kept, with its sets) and
// starts a new copy. If they're mid-workout the change waits in pending_change
// (JSON: title, exercises, note) until they finish. change_note is the PT's
// note to the client about the new program.
for (const [col, type] of [["ended_at", "TEXT"], ["replaced_by", "INTEGER"], ["pending_change", "TEXT"], ["change_note", "TEXT"]])
  if (!hasColumn("programs", col)) db.exec(`ALTER TABLE programs ADD COLUMN ${col} ${type}`);
// A PT's private notes on a client: one free-text note per PT and client email,
// so every program that client has with the PT shows the same note. Only ever
// sent to that PT (on /api/dash), never to a link or a client login.
db.exec(`
  CREATE TABLE IF NOT EXISTS client_notes (
    pt_user_id INTEGER NOT NULL REFERENCES users(id),
    client_email TEXT NOT NULL COLLATE NOCASE,
    body TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (pt_user_id, client_email)
  );
`);
if (!hasColumn("users", "checkin_questions")) db.exec("ALTER TABLE users ADD COLUMN checkin_questions TEXT");
if (!hasColumn("users", "show_training")) db.exec("ALTER TABLE users ADD COLUMN show_training INTEGER NOT NULL DEFAULT 1");
const DEFAULT_QUESTIONS = [
  { text: "How's your energy been this week?", kind: "scale" },
  { text: "How are you sleeping?", kind: "scale" },
  { text: "How sore have you been?", kind: "scale" },
  { text: "Anything I should know?", kind: "text" },
];
const questionsOf = (ptId) =>
  JSON.parse(db.prepare("SELECT checkin_questions q FROM users WHERE id = ?").get(ptId)?.q ?? "null") ?? DEFAULT_QUESTIONS;
const checkinRow = (c) => ({ id: c.id, client_id: c.client_id, at: c.created_at, questions: JSON.parse(c.questions), answers: JSON.parse(c.answers) });
const lastCheckin = (pt, client) =>
  (c => c ? checkinRow(c) : null)(db.prepare("SELECT * FROM checkins WHERE pt_id = ? AND client_id = ? ORDER BY id DESC").get(pt, client));

const insertEvent = db.prepare("INSERT INTO events (at, program_id, role, who, action, status, line) VALUES (?,?,?,?,?,?,?)");

// One readable line per event, e.g. `client "Jack" p3 logged Squat set 1: 5 x 100kg`.
// Names, never tokens or passwords. `who` comes from asProgram (someone on a
// link, shown with the program id) or asUser (someone logged in, user id).
function audit(who, action, status, detail) {
  const at = new Date().toISOString().slice(0, 19) + "Z";
  const actor = who === SERVER ? "server"
    : who ? `${who.role} ${JSON.stringify(who.name)} ${who.program_id ? `p${who.program_id}` : `u${who.user_id}`}` : "unknown visitor";
  const line = `${at} ${actor} ${status >= 400 ? `DENIED ${action} (${status} ${detail})` : detail}`;
  console.log(line);
  insertEvent.run(at, who?.program_id ?? null, who?.role ?? null, who?.name ?? null, action, status, line);
}
const SERVER = { role: "server" };
const asProgram = (found) =>
  found && { role: found.role, name: found.role === "pt" ? found.program.pt_name : found.program.client_name, program_id: found.program.id };
const asUser = (u) => u && { role: u.role, name: u.name, user_id: u.id };

// Live updates over server-sent events. A browser on a program link hears
// about that program; a logged-in browser hears about its programs and chats.
// ponytail: subscribers live in memory, fine on one Fly machine; a second
// machine needs a shared bus (or SQLite polling) behind push().
// Connecting, leaving and every update sent are logged, so the logs show who
// was watching when something changed.
const subs = new Set();
function stream(req, res, who, sub) {
  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
  res.write(": open\n\n");
  const s = { res, ...sub };
  const room = sub.programId ? `p${sub.programId}` : `u${sub.userId}`;
  const watching = () => [...subs].filter((x) => x.programId === sub.programId && x.userId === sub.userId).length;
  subs.add(s);
  audit(who, "connect", 200, `connected to live updates (${watching()} watching ${room}, ${subs.size} connected in all)`);
  const beat = setInterval(() => res.write(": beat\n\n"), 25000); // Fly's proxy drops idle connections
  req.on("close", () => {
    clearInterval(beat);
    subs.delete(s);
    audit(who, "disconnect", 200, `left live updates (${watching()} watching ${room}, ${subs.size} connected in all)`);
  });
}
function push(type, { programId = null, users = [] }) {
  const msg = `data: ${JSON.stringify({ type, programId })}\n\n`;
  let sent = 0;
  for (const s of subs) if ((programId && s.programId === programId) || users.includes(s.userId)) { s.res.write(msg); sent++; }
  const about = type !== "program" ? `${type} between u${users[0]} and u${users[1]}` : `program p${programId}`;
  audit(SERVER, "broadcast", 200, `sent ${type} update for ${about} to ${sent} connection${sent === 1 ? "" : "s"}`);
}

const page = (f) => readFileSync(new URL(`./public/${f}`, import.meta.url));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const token = () => randomBytes(12).toString("base64url");
const utc = (t) => new Date(t.replace(" ", "T") + "Z");

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "content-type": `${type}; charset=utf-8` });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
}

async function readRaw(req, max) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) throw new Error("too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
const readJson = async (req) => JSON.parse((await readRaw(req, 100_000)).toString() || "{}");

const str = (v, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const EMAIL = /^\S+@\S+\.\S+$/;

// Passwords: scrypt from node:crypto, salted per user.
// ponytail: no login rate limit; add one per email if anyone starts guessing.
const hashPw = (pw, salt = randomBytes(16).toString("hex")) => `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
function pwOk(pw, stored) {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(Buffer.from(hash, "hex"), scryptSync(String(pw), salt, 64));
}

function currentUser(req) {
  const sid = /(?:^|;\s*)sid=([\w-]+)/.exec(req.headers.cookie ?? "")?.[1];
  if (!sid) return null;
  return db.prepare("SELECT u.id, u.email, u.name, u.role, u.show_training FROM logins l JOIN users u ON u.id = l.user_id WHERE l.token = ?").get(sid) ?? null;
}
function startLogin(res, user) {
  const t = token();
  db.prepare("INSERT INTO logins (token, user_id) VALUES (?, ?)").run(t, user.id);
  const secure = process.env.FLY_APP_NAME ? "; Secure" : "";
  res.setHeader("set-cookie", `sid=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${90 * 86400}${secure}`);
}
function addUser(name, email, role, password) {
  const { lastInsertRowid: id } = db.prepare("INSERT INTO users (email, name, role, pass) VALUES (?,?,?,?)").run(email, name, role, hashPw(password));
  return { id: Number(id), email, name, role };
}

// A PT and a client can message each other once a program links both accounts.
const paired = (pt, client) => !!db.prepare("SELECT 1 FROM programs WHERE pt_user_id = ? AND client_user_id = ?").get(pt, client);
function unread(me, other) {
  const last = db.prepare("SELECT last_id FROM reads WHERE user_id = ? AND other_id = ?").get(me, other)?.last_id ?? 0;
  return db.prepare("SELECT count(*) n FROM messages WHERE ((pt_id = ? AND client_id = ?) OR (pt_id = ? AND client_id = ?)) AND sender_id = ? AND id > ?")
    .get(me, other, other, me, other, last).n;
}

// The exercises a PT typed, trimmed and capped. Programs and templates share it.
const cleanExercises = (exercises) =>
  (Array.isArray(exercises) ? exercises : [])
    .map((e) => ({
      day: str(e.day, 60) ?? "Day 1",
      name: str(e.name),
      sets: Math.min(Math.max(parseInt(e.sets) || 0, 1), 20),
      reps: str(String(e.reps ?? ""), 20) ?? "10",
      notes: str(e.notes, 500) ?? "",
      rest: Math.min(Math.max(parseInt(e.rest) || 90, 0), 600),
    }))
    .filter((e) => e.name);

function createProgram(body, pt) {
  const title = str(body.title), client = str(body.client_name);
  const email = str(body.client_email);
  if (!title || !client || !email || !EMAIL.test(email)) return null;
  const clean = cleanExercises(body.exercises);
  if (!clean.length) return null;

  const ptToken = token(), clientToken = token();
  db.exec("BEGIN");
  try {
    const { lastInsertRowid: id } = db
      .prepare("INSERT INTO programs (pt_token, client_token, title, pt_name, client_name, client_email, pt_user_id) VALUES (?,?,?,?,?,?,?)")
      .run(ptToken, clientToken, title, pt.name, client, email, pt.id);
    const ins = db.prepare("INSERT INTO exercises (program_id, day, position, name, sets, reps, notes, rest_seconds) VALUES (?,?,?,?,?,?,?,?)");
    clean.forEach((e, i) => ins.run(id, e.day, i, e.name, e.sets, e.reps, e.notes, e.rest));
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return { ptToken, clientToken };
}

// Swap a client onto a new program: a fresh copy for the same client, and the
// old one ends. Nothing is deleted, so every logged set stays where it was.
function applyChange(old, change) {
  const pt = db.prepare("SELECT id, name FROM users WHERE id = ?").get(old.pt_user_id);
  const made = createProgram({ title: change.title, client_name: old.client_name, client_email: old.client_email, exercises: change.exercises }, pt);
  const next = db.prepare("SELECT id FROM programs WHERE pt_token = ?").get(made.ptToken).id;
  db.prepare("UPDATE programs SET client_user_id = ?, change_note = ? WHERE id = ?").run(old.client_user_id, change.note, next);
  db.prepare("UPDATE programs SET ended_at = datetime('now'), replaced_by = ?, pending_change = NULL WHERE id = ?").run(next, old.id);
  audit(SERVER, "change", 200, `moved ${JSON.stringify(old.client_name)} from p${old.id} to p${next} ${JSON.stringify(change.title)}`);
  push("program", { programId: old.id, users: [old.pt_user_id, old.client_user_id].filter(Boolean) });
  return next;
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
    program: {
      id: p.id, title: p.title, pt_name: p.pt_name, client_name: p.client_name, client_email: p.client_email, created_at: p.created_at,
      pt_user_id: p.pt_user_id, client_user_id: p.client_user_id,
    },
    client_token: role === "pt" ? p.client_token : undefined,
    ended: !!p.ended_at,
    change_note: p.change_note,
    pending: p.pending_change && (({ title, note }) => ({ title, note }))(JSON.parse(p.pending_change)),
    claimed: !!(role === "pt" ? p.pt_user_id : p.client_user_id),
    exercises,
    logs,
    sessions,
    open_session: sessions.find((x) => !x.finished_at) ?? null,
  };
}

// One client's row on the PT dashboard: when they last trained, what they've
// done in the last 7 days against the program, and which lifts are moving.
function dashRow(p) {
  const f = findProgram(p.pt_token);
  const done = f.sessions.filter((s) => s.finished_at);
  // Last workout counts their earlier programs too, so changing someone's
  // program doesn't make them look like they've never trained.
  const before = p.client_user_id && db.prepare(`SELECT max(s.started_at) t FROM sessions s JOIN programs o ON o.id = s.program_id
    WHERE o.pt_user_id = ? AND o.client_user_id = ? AND o.ended_at IS NOT NULL AND s.finished_at IS NOT NULL`).get(p.pt_user_id, p.client_user_id).t;
  const last = done.at(-1)?.started_at ?? f.logs.at(-1)?.logged_at ?? before ?? null;
  const weekAgo = Date.now() - 7 * 864e5;
  const hidden = !!p.client_user_id && !db.prepare("SELECT show_training FROM users WHERE id = ?").get(p.client_user_id).show_training;
  const bySession = (exId) => {
    const m = new Map();
    for (const l of f.logs.filter((l) => l.exercise_id === exId)) {
      const k = l.session_id ?? l.logged_at.slice(0, 10);
      m.set(k, [...(m.get(k) ?? []), l]);
    }
    return [...m.values()];
  };
  return {
    program_id: f.program.id,
    title: f.program.title,
    pt_token: p.pt_token,
    client_name: f.program.client_name,
    client_email: f.program.client_email,
    client_user_id: p.client_user_id,
    pending: f.pending,
    // dashRow is only for the PT's own dashboard, so the private note can go here.
    note: db.prepare("SELECT body FROM client_notes WHERE pt_user_id = ? AND client_email = ?").get(p.pt_user_id, p.client_email)?.body ?? "",
    last_workout: last,
    // The client can hide "Training now"; the PT is told it's hidden, not just shown nothing.
    training_hidden: hidden,
    in_progress: hidden ? null : f.open_session?.day ?? null,
    days: [...new Set(f.exercises.map((e) => e.day))],
    week: done.filter((s) => utc(s.started_at) >= weekAgo).map((s) => ({ day: s.day, at: s.started_at })),
    recent: done.slice(-5).reverse().map((s) => ({ day: s.day, at: s.started_at, sets: f.logs.filter((l) => l.session_id === s.id).length })),
    lifts: f.exercises.map((e) => ({ id: e.id, name: e.name, day: e.day, status: trend(e.reps, bySession(e.id)) })),
    unread: p.client_user_id ? unread(p.pt_user_id, p.client_user_id) : 0,
    checkin: p.client_user_id ? lastCheckin(p.pt_user_id, p.client_user_id) : null,
  };
}

// Images people send in chat. Checked by their first bytes, not by what the
// browser says they are.
const IMAGE_TYPES = [
  ["jpg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["png", (b) => b.subarray(0, 4).toString("hex") === "89504e47"],
  ["gif", (b) => b.subarray(0, 3).toString() === "GIF"],
  ["webp", (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP"],
];
const MIME = { jpg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };

const PAGES = {
  "/": "landing.html", "/login": "login.html", "/dash": "dash.html", "/me": "me.html", "/settings": "settings.html", "/workouts": "workouts.html",
  "/inbox": "inbox.html", "/checkins": "checkins.html", "/programs": "templates.html", "/programs/new": "new.html",
};
// Any top-level script in public/ is served, so a new one can't be forgotten here.
// The name pattern keeps it to files directly in public/, never a path out of it.
const STATIC_TYPE = (path) => (path === "/style.css" ? "text/css" : /^\/[\w-]+\.js$/.test(path) ? "text/javascript" : null);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const path = url.pathname;
  try {
    if (req.method === "GET" && PAGES[path]) return send(res, 200, page(PAGES[path]), "text/html");
    if (req.method === "GET" && STATIC_TYPE(path) && existsSync(new URL(`./public${path}`, import.meta.url)))
      return send(res, 200, page(path.slice(1)), STATIC_TYPE(path));
    if (req.method === "GET" && (path === "/readme" || path === "/readme/")) {
      // ponytail: README served verbatim in <pre>; render markdown properly if it starts to matter
      const md = esc(readFileSync(new URL("./README.md", import.meta.url), "utf8"));
      return send(res, 200, page("readme.html").toString().replace("@README@", md), "text/html");
    }
    if (req.method === "GET" && /^\/p\/[\w-]+$/.test(path)) return send(res, 200, page("program.html"), "text/html");
    if (req.method === "GET" && /^\/join\/[\w-]+$/.test(path)) return send(res, 200, page("join.html"), "text/html");
    if (req.method === "GET" && /^\/chat\/\d+$/.test(path)) return send(res, 200, page("chat.html"), "text/html");
    if (req.method === "GET" && /^\/checkin\/\d+$/.test(path)) return send(res, 200, page("checkin.html"), "text/html");
    if (req.method === "GET" && /^\/fonts\/[\w-]+\.woff2$/.test(path)) {
      res.writeHead(200, { "content-type": "font/woff2", "cache-control": "public, max-age=31536000, immutable" });
      return res.end(page(path.slice(1)));
    }

    const me = currentUser(req);

    // ---------- accounts ----------
    if (req.method === "POST" && path === "/api/signup") {
      const b = await readJson(req);
      const name = str(b.name, 80), email = str(b.email);
      if (!name || !email || !EMAIL.test(email)) return send(res, 400, { error: "Need your name and a valid email." });
      if (String(b.password ?? "").length < 8) return send(res, 400, { error: "Pick a password of at least 8 characters." });
      if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
        audit(null, "signup", 409, "email already has an account");
        return send(res, 409, { error: "That email already has an account. Log in instead." });
      }
      const u = addUser(name, email, "pt", b.password);
      startLogin(res, u);
      audit(asUser(u), "signup", 201, "signed up as a PT");
      return send(res, 201, { role: u.role, next: "/dash" });
    }
    if (req.method === "POST" && path === "/api/login") {
      const b = await readJson(req);
      const u = db.prepare("SELECT * FROM users WHERE email = ?").get(String(b.email ?? "").trim());
      if (!u || !pwOk(b.password ?? "", u.pass)) {
        audit(null, "login", 401, "wrong email or password");
        return send(res, 401, { error: "Wrong email or password." });
      }
      startLogin(res, u);
      audit(asUser(u), "login", 200, "logged in");
      return send(res, 200, { role: u.role, next: u.role === "pt" ? "/dash" : "/me" });
    }
    if (req.method === "POST" && path === "/api/logout") {
      const sid = /(?:^|;\s*)sid=([\w-]+)/.exec(req.headers.cookie ?? "")?.[1];
      if (sid) db.prepare("DELETE FROM logins WHERE token = ?").run(sid);
      if (me) audit(asUser(me), "logout", 200, "logged out");
      res.setHeader("set-cookie", "sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
      return send(res, 200, {});
    }
    if (req.method === "GET" && path === "/api/me") {
      if (!me) return send(res, 401, { error: "Not logged in." });
      if (me.role === "pt") return send(res, 200, { me });
      // Ended programs still count for history, but only current ones get day buttons.
      const programs = db
        .prepare("SELECT title, client_token, pt_name, pt_user_id, ended_at, change_note FROM programs WHERE client_user_id = ? ORDER BY id DESC")
        .all(me.id);
      const pts = [...new Map(programs.filter((p) => p.pt_user_id).map((p) => [p.pt_user_id, p.pt_name])).entries()]
        .map(([id, name]) => ({ id, name, unread: unread(me.id, id), checked_in: lastCheckin(id, me.id)?.at ?? null }));
      // The client's dashboard: each program's days, and every finished workout with its sets.
      const workouts = [], scored = [];
      for (const p of programs) {
        const f = findProgram(p.client_token);
        const names = new Map(f.exercises.map((e) => [e.id, e.name]));
        const score = new Map(f.exercises.map((e) => [e.id, scorer(e.reps, f.logs.filter((l) => l.exercise_id === e.id))]));
        p.days = [...new Set(f.exercises.map((e) => e.day))].map((d) => ({ day: d, exercises: f.exercises.filter((e) => e.day === d).map((e) => e.name) }));
        p.open = f.open_session?.day ?? null;
        for (const s of f.sessions.filter((s) => s.finished_at)) {
          const logs = f.logs.filter((l) => l.session_id === s.id);
          workouts.push({ id: s.id, day: s.day, title: p.title, client_token: p.client_token, started_at: s.started_at, finished_at: s.finished_at,
            sets: logs.map((l) => ({ exercise: names.get(l.exercise_id), set_no: l.set_no, reps: l.reps, weight: l.weight })) });
          const best = {};
          for (const l of logs) best[l.exercise_id] = Math.max(best[l.exercise_id] ?? -Infinity, score.get(l.exercise_id)(l));
          scored.push({ at: s.started_at, best });
        }
      }
      workouts.sort((a, b) => b.started_at.localeCompare(a.started_at));
      // The client's progress over every lift, one point per workout (public/progress.js).
      const progress = summed(scored.sort((a, b) => a.at.localeCompare(b.at)));
      const current = programs.filter((p) => !p.ended_at).map(({ ended_at, ...p }) => p);
      return send(res, 200, { me, programs: current, pts, workouts, progress });
    }
    if (req.method === "POST" && path === "/api/me/training") {
      if (me?.role !== "client") return send(res, 401, { error: "Log in as a client to change this." });
      const show = (await readJson(req)).show === false ? 0 : 1;
      db.prepare("UPDATE users SET show_training = ? WHERE id = ?").run(show, me.id);
      audit(asUser(me), "training", 200, show ? "now shows PT when training" : "now hides training from PT");
      const pts = db.prepare("SELECT DISTINCT pt_user_id FROM programs WHERE client_user_id = ? AND pt_user_id IS NOT NULL").all(me.id);
      for (const { pt_user_id } of pts) push("training", { users: [pt_user_id, me.id] });
      return send(res, 200, { show_training: show });
    }
    if (req.method === "GET" && path === "/api/events") {
      if (!me) return send(res, 401, { error: "Not logged in." });
      return stream(req, res, asUser(me), { userId: me.id });
    }

    // ---------- PT dashboard ----------
    if (req.method === "GET" && path === "/api/dash") {
      if (me?.role !== "pt") return send(res, 401, { error: "Log in as a PT to see your dashboard." });
      if (!url.searchParams.has("refresh")) audit(asUser(me), "dash", 200, "opened dashboard");
      const rows = db.prepare("SELECT * FROM programs WHERE pt_user_id = ? AND ended_at IS NULL ORDER BY id").all(me.id).map(dashRow);
      // Whoever has gone longest without training comes first.
      rows.sort((a, b) => (a.last_workout ?? "").localeCompare(b.last_workout ?? ""));
      return send(res, 200, { me, clients: rows });
    }

    // ---------- private notes: the PT's own note on one of their clients ----------
    if (req.method === "POST" && path === "/api/notes") {
      if (me?.role !== "pt") {
        audit(asUser(me), "notes", 401, "not logged in as a PT");
        return send(res, 401, { error: "Log in as a PT to keep notes." });
      }
      const b = await readJson(req);
      const email = str(b.email), body = typeof b.body === "string" ? b.body.slice(0, 10_000) : null;
      const p = email && db.prepare("SELECT client_name FROM programs WHERE pt_user_id = ? AND client_email = ? COLLATE NOCASE").get(me.id, email);
      if (!p || body === null) {
        audit(asUser(me), "notes", 404, "no such client");
        return send(res, 404, { error: "That's not one of your clients." });
      }
      db.prepare(`INSERT INTO client_notes (pt_user_id, client_email, body) VALUES (?,?,?)
        ON CONFLICT (pt_user_id, client_email) DO UPDATE SET body = excluded.body, updated_at = datetime('now')`).run(me.id, email, body);
      // The note's text stays out of the log; it's private.
      audit(asUser(me), "notes", 200, `edited private notes on ${JSON.stringify(p.client_name)} (${body.length} chars)`);
      return send(res, 200, { note: body });
    }

    // ---------- CSV export: one row per logged set, the PT's own clients only ----------
    // ?client=<email> for one client (all their programs), ?from/?to as YYYY-MM-DD,
    // ?tz=<minutes east of UTC> from the browser so dates are the PT's local day.
    if (req.method === "GET" && path === "/api/export.csv") {
      if (me?.role !== "pt") {
        audit(asUser(me), "export", 401, "not logged in as a PT");
        return send(res, 401, { error: "Log in as a PT to export." });
      }
      const q = url.searchParams;
      const client = str(q.get("client")), day = (k) => (/^\d{4}-\d{2}-\d{2}$/.test(q.get(k) ?? "") ? q.get(k) : null);
      const from = day("from"), to = day("to");
      const tz = `${Math.max(-840, Math.min(840, Math.trunc(Number(q.get("tz")) || 0)))} minutes`;
      const rows = db.prepare(`
        SELECT p.client_name, p.client_email, p.title, e.day, e.name, e.sets, e.reps rep_range,
               datetime(l.logged_at, ?) at, l.set_no, l.reps, l.weight
        FROM set_logs l JOIN exercises e ON e.id = l.exercise_id JOIN programs p ON p.id = e.program_id
        WHERE p.pt_user_id = ? AND (? IS NULL OR p.client_email = ? COLLATE NOCASE)
          AND (? IS NULL OR date(datetime(l.logged_at, ?)) >= ?) AND (? IS NULL OR date(datetime(l.logged_at, ?)) <= ?)
        ORDER BY p.client_name COLLATE NOCASE, at, l.id`).all(tz, me.id, client, client, from, tz, from, to, tz, to);
      // Quote every cell; a leading = + - @ would run as a formula in Excel, so it gets a '.
      const cell = (v) => `"${String(v ?? "").replace(/^[=+\-@]/, "'$&").replace(/"/g, '""')}"`;
      const csv = [["client", "email", "program", "day", "exercise", "target_sets", "rep_range", "date", "time", "set", "reps", "weight_kg"],
        ...rows.map((r) => [r.client_name, r.client_email, r.title, r.day, r.name, r.sets, r.rep_range, r.at.slice(0, 10), r.at.slice(11, 16), r.set_no, r.reps, r.weight])]
        .map((r) => r.map(cell).join(",")).join("\r\n");
      const who = client ? rows[0]?.client_name ?? client : "all clients";
      const name = `sets-${(client ? who : "all").replace(/[^\w-]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
      audit(asUser(me), "export", 200, `exported ${rows.length} sets for ${client ? JSON.stringify(who) : who}${from || to ? ` (${from ?? "start"} to ${to ?? "today"})` : ""}`);
      res.writeHead(200, { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` });
      return res.end("﻿" + csv + "\r\n"); // the BOM makes Excel read names as UTF-8
    }

    // ---------- inbox: every conversation a PT has, newest first ----------
    if (req.method === "GET" && path === "/api/inbox") {
      if (me?.role !== "pt") return send(res, 401, { error: "Log in as a PT to see your inbox." });
      const people = db.prepare(`
        SELECT u.id, u.name, (SELECT group_concat(title, ', ') FROM programs WHERE pt_user_id = ? AND client_user_id = u.id AND ended_at IS NULL) titles
        FROM users u WHERE u.id IN (SELECT client_user_id FROM programs WHERE pt_user_id = ?)`).all(me.id, me.id);
      const lastMsg = db.prepare("SELECT sender_id, body, image, created_at FROM messages WHERE pt_id = ? AND client_id = ? ORDER BY id DESC");
      const threads = people.map((u) => ({ ...u, last: lastMsg.get(me.id, u.id) ?? null, unread: unread(me.id, u.id) }));
      threads.sort((a, b) => (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""));
      return send(res, 200, { me, threads });
    }

    // ---------- the PT's program library ----------
    // Stored in the templates table (its name from before programs were written
    // without a client). Assigning makes the client their own copy, so editing
    // a library program never changes what a client already has.
    if (req.method === "GET" && path === "/api/clients") {
      if (me?.role !== "pt") return send(res, 401, { error: "Log in as a PT." });
      const clients = db.prepare("SELECT client_name name, client_email email, min(id) first FROM programs WHERE pt_user_id = ? GROUP BY client_email COLLATE NOCASE ORDER BY client_name").all(me.id);
      return send(res, 200, { clients: clients.map(({ name, email }) => ({ name, email })) });
    }
    const tm = path.match(/^\/api\/templates(?:\/(\d+)(\/delete|\/assign|\/duplicate)?)?$/);
    if (tm) {
      if (me?.role !== "pt") return send(res, 401, { error: "Log in as a PT to see your programs." });
      if (req.method === "GET" && !tm[1]) {
        const rows = db.prepare("SELECT * FROM templates WHERE pt_user_id = ? ORDER BY name COLLATE NOCASE").all(me.id);
        return send(res, 200, { templates: rows.map((t) => ({ id: t.id, name: t.name, created_at: t.created_at, exercises: JSON.parse(t.exercises) })) });
      }
      if (req.method === "POST" && !tm[1]) {
        const b = await readJson(req);
        const name = str(b.name, 80), exercises = cleanExercises(b.exercises);
        if (!name || !exercises.length) return send(res, 400, { error: "Give the program a name and at least one exercise." });
        const { lastInsertRowid: id } = db.prepare("INSERT INTO templates (pt_user_id, name, exercises) VALUES (?,?,?)").run(me.id, name, JSON.stringify(exercises));
        audit(asUser(me), "template", 201, `saved template ${JSON.stringify(name)}`);
        return send(res, 201, { id: Number(id) });
      }
      const t = db.prepare("SELECT * FROM templates WHERE id = ? AND pt_user_id = ?").get(Number(tm[1]), me.id);
      if (!t) {
        audit(asUser(me), "template", 404, "no such template");
        return send(res, 404, { error: "No program there." });
      }
      if (req.method === "POST" && tm[2] === "/assign") {
        const b = await readJson(req);
        const made = createProgram({ title: t.name, client_name: b.client_name, client_email: b.client_email, exercises: JSON.parse(t.exercises) }, me);
        if (!made) return send(res, 400, { error: "Need the client's name and a valid email." });
        const found = findProgram(made.ptToken);
        const invite = token();
        db.prepare("INSERT INTO invites (token, pt_user_id, name, email) VALUES (?,?,?,?)").run(invite, me.id, found.program.client_name, found.program.client_email);
        audit(asProgram(found), "create", 201, `onboarded ${JSON.stringify(found.program.client_name)} with program ${JSON.stringify(t.name)} and made an invite`);
        push("program", { programId: found.program.id, users: [me.id] });
        return send(res, 201, { ...made, invite });
      }
      if (req.method === "POST" && tm[2] === "/duplicate") {
        const name = `${t.name} (copy)`.slice(0, 80);
        const { lastInsertRowid: id } = db.prepare("INSERT INTO templates (pt_user_id, name, exercises) VALUES (?,?,?)").run(me.id, name, t.exercises);
        audit(asUser(me), "template", 201, `duplicated template ${JSON.stringify(t.name)}`);
        return send(res, 201, { id: Number(id) });
      }
      if (req.method === "POST" && tm[2] === "/delete") {
        db.prepare("DELETE FROM templates WHERE id = ?").run(t.id);
        audit(asUser(me), "template", 200, `deleted template ${JSON.stringify(t.name)}`);
        return send(res, 200, {});
      }
      // Rename, or edit: exercises are only replaced when the body sends them.
      if (req.method === "POST") {
        const b = await readJson(req);
        const name = str(b.name, 80);
        if (!name) return send(res, 400, { error: "Give the program a name." });
        const exercises = b.exercises === undefined ? null : cleanExercises(b.exercises);
        if (exercises && !exercises.length) return send(res, 400, { error: "A program needs at least one exercise." });
        db.prepare("UPDATE templates SET name = ?, exercises = COALESCE(?, exercises) WHERE id = ?").run(name, exercises && JSON.stringify(exercises), t.id);
        audit(asUser(me), "template", 200, exercises ? `edited template ${JSON.stringify(name)}`
          : `renamed template ${JSON.stringify(t.name)} to ${JSON.stringify(name)}`);
        return send(res, 200, {});
      }
    }

    // ---------- invites (/join) ----------
    // Signing up makes (or logs into) the client's account and links every
    // program this PT has for the invite's email, whatever they are by then.
    const inv = path.match(/^\/api\/invite\/([\w-]+)$/);
    if (inv) {
      const i = db.prepare("SELECT i.*, u.name pt_name FROM invites i JOIN users u ON u.id = i.pt_user_id WHERE i.token = ?").get(inv[1]);
      if (!i) {
        audit(asUser(me), "invite", 404, "no such invite");
        return send(res, 404, { error: "This invite link doesn't work. Ask your PT to send it again." });
      }
      if (req.method === "GET") {
        if (i.used_at) return send(res, 200, { used: true });
        const prog = db.prepare("SELECT title FROM programs WHERE pt_user_id = ? AND client_email = ? COLLATE NOCASE AND ended_at IS NULL ORDER BY id DESC").get(i.pt_user_id, i.email);
        return send(res, 200, { name: i.name, email: i.email, pt_name: i.pt_name, program: prog?.title ?? null });
      }
      if (req.method === "POST") {
        const b = await readJson(req);
        const fail = (status, error) => (audit(null, "join", status, error), send(res, status, { error }));
        if (i.used_at) return fail(409, "This invite has been used. Log in instead.");
        const name = str(b.name, 80) ?? i.name, email = str(b.email) ?? i.email;
        if (!EMAIL.test(email)) return fail(400, "Need a valid email.");
        let u = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if (u) {
          if (u.role !== "client" || !pwOk(b.password ?? "", u.pass)) return fail(403, `Wrong password for ${email}.`);
        } else {
          if (String(b.password ?? "").length < 8) return fail(400, "Pick a password of at least 8 characters.");
          u = addUser(name, email, "client", b.password);
        }
        db.prepare("UPDATE programs SET client_user_id = ?, client_name = ?, client_email = ? WHERE pt_user_id = ? AND client_email = ? COLLATE NOCASE AND client_user_id IS NULL")
          .run(u.id, name, email, i.pt_user_id, i.email);
        db.prepare("UPDATE invites SET used_at = datetime('now') WHERE id = ?").run(i.id);
        startLogin(res, u);
        audit(asUser(u), "join", 200, `signed up from ${JSON.stringify(i.pt_name)}'s invite`);
        push("program", { users: [i.pt_user_id] });
        return send(res, 200, { next: "/me" });
      }
    }

    // ---------- changing a client's program (dashboard side panel) ----------
    const chm = path.match(/^\/api\/programs\/(\d+)\/change$/);
    if (req.method === "POST" && chm) {
      if (me?.role !== "pt") return send(res, 401, { error: "Log in as a PT." });
      const p = db.prepare("SELECT * FROM programs WHERE id = ? AND pt_user_id = ? AND ended_at IS NULL").get(Number(chm[1]), me.id);
      const b = await readJson(req);
      const t = db.prepare("SELECT * FROM templates WHERE id = ? AND pt_user_id = ?").get(Number(b.template_id), me.id);
      if (!p || !t) {
        audit(asUser(me), "change", 404, p ? "no such template" : "no such client program");
        return send(res, 404, { error: p ? "Pick one of your programs." : "No such client." });
      }
      const change = { title: t.name, exercises: JSON.parse(t.exercises), note: str(b.note, 1000) };
      // Mid-workout: wait until they finish, so the workout they're in isn't pulled out from under them.
      if (db.prepare("SELECT 1 FROM sessions WHERE program_id = ? AND finished_at IS NULL").get(p.id)) {
        db.prepare("UPDATE programs SET pending_change = ? WHERE id = ?").run(JSON.stringify(change), p.id);
        audit(asUser(me), "change", 202, `queued ${JSON.stringify(t.name)} for ${JSON.stringify(p.client_name)} after their workout`);
        push("program", { programId: p.id, users: [p.pt_user_id, p.client_user_id].filter(Boolean) });
        return send(res, 202, { queued: true });
      }
      return send(res, 200, { queued: false, program_id: applyChange(p, change) });
    }

    // ---------- weekly check-ins ----------
    // The PT's side: their questions, and every check-in from their clients.
    if (path === "/api/checkins") {
      if (me?.role !== "pt") return send(res, 401, { error: "Log in as a PT to see check-ins." });
      if (req.method === "GET") {
        const clients = db.prepare("SELECT DISTINCT u.id, u.name FROM users u JOIN programs p ON p.client_user_id = u.id WHERE p.pt_user_id = ? ORDER BY u.name").all(me.id);
        const checkins = db.prepare("SELECT * FROM checkins WHERE pt_id = ? ORDER BY id DESC LIMIT 200").all(me.id).map(checkinRow);
        return send(res, 200, { me, questions: questionsOf(me.id), clients, checkins });
      }
      if (req.method === "POST") {
        const raw = (await readJson(req)).questions;
        const qs = (Array.isArray(raw) ? raw : [])
          .map((q) => ({ text: str(q?.text, 200), kind: q?.kind === "text" ? "text" : "scale" }))
          .filter((q) => q.text);
        if (!qs.length || qs.length > 8) return send(res, 400, { error: "Write between 1 and 8 questions." });
        db.prepare("UPDATE users SET checkin_questions = ? WHERE id = ?").run(JSON.stringify(qs), me.id);
        audit(asUser(me), "checkin", 200, `set ${qs.length} check-in questions`);
        return send(res, 200, { questions: qs });
      }
    }
    // The client's side: their PT's questions, and sending answers.
    const ck = path.match(/^\/api\/checkin\/(\d+)$/);
    if (ck) {
      const pt = Number(ck[1]);
      if (me?.role !== "client" || !paired(pt, me.id)) {
        audit(asUser(me), "checkin", 404, "no check-in with that PT");
        return send(res, 404, { error: "No check-in with that PT." });
      }
      const ptName = db.prepare("SELECT name FROM users WHERE id = ?").get(pt).name;
      if (req.method === "GET") return send(res, 200, { me, pt: { id: pt, name: ptName }, questions: questionsOf(pt), last: lastCheckin(pt, me.id) });
      if (req.method === "POST") {
        const questions = questionsOf(pt);
        const raw = (await readJson(req)).answers;
        const answers = questions.map((q, i) => {
          const a = Array.isArray(raw) ? raw[i] : null;
          return q.kind === "scale" ? (Number.isInteger(a) && a >= 1 && a <= 5 ? a : null) : (str(a, 2000) ?? "");
        });
        if (answers.every((a) => a === null || a === "")) return send(res, 400, { error: "Answer at least one question." });
        db.prepare("INSERT INTO checkins (pt_id, client_id, questions, answers) VALUES (?,?,?,?)").run(pt, me.id, JSON.stringify(questions), JSON.stringify(answers));
        audit(asUser(me), "checkin", 201, `sent a check-in to ${JSON.stringify(ptName)}`);
        push("checkin", { users: [pt, me.id] });
        return send(res, 201, {});
      }
    }

    // ---------- chat ----------
    const cm = path.match(/^\/api\/chat\/(\d+)(\/image)?$/);
    if (cm) {
      const other = Number(cm[1]);
      const [pt, client] = me?.role === "pt" ? [me.id, other] : [other, me?.id];
      if (!me || !paired(pt, client)) {
        audit(asUser(me), "chat", 404, "no conversation with that person");
        return send(res, 404, { error: "No conversation with that person." });
      }
      const otherUser = db.prepare("SELECT id, name, role FROM users WHERE id = ?").get(other);
      if (req.method === "GET" && !cm[2]) {
        const messages = db
          .prepare("SELECT id, sender_id, body, image, created_at FROM messages WHERE pt_id = ? AND client_id = ? ORDER BY id")
          .all(pt, client);
        if (messages.length)
          db.prepare("INSERT INTO reads (user_id, other_id, last_id) VALUES (?,?,?) ON CONFLICT DO UPDATE SET last_id = excluded.last_id")
            .run(me.id, other, messages.at(-1).id);
        return send(res, 200, { me, other: otherUser, messages });
      }
      if (req.method === "POST") {
        let body = "", image = null;
        if (cm[2]) {
          const buf = await readRaw(req, 5_000_000);
          const ext = IMAGE_TYPES.find(([, is]) => buf.length > 12 && is(buf))?.[0];
          if (!ext) return send(res, 400, { error: "That isn't a photo we can show." });
          image = `${token()}.${ext}`;
          writeFileSync(`${UPLOADS}/${image}`, buf);
        } else {
          body = str((await readJson(req)).body, 2000);
          if (!body) return send(res, 400, { error: "Type a message first." });
        }
        db.prepare("INSERT INTO messages (pt_id, client_id, sender_id, body, image) VALUES (?,?,?,?,?)").run(pt, client, me.id, body ?? "", image);
        audit(asUser(me), "message", 201, `sent ${image ? "a photo" : "a message"} to ${JSON.stringify(otherUser.name)}`);
        push("chat", { users: [pt, client] });
        return send(res, 201, {});
      }
    }
    const im = path.match(/^\/api\/img\/([\w-]+\.(?:jpg|png|gif|webp))$/);
    if (req.method === "GET" && im) {
      const ok = me && db.prepare("SELECT 1 FROM messages WHERE image = ? AND (pt_id = ? OR client_id = ?)").get(im[1], me.id, me.id);
      if (!ok) return send(res, 404, "Not found", "text/plain");
      res.writeHead(200, { "content-type": MIME[im[1].split(".").pop()], "cache-control": "private, max-age=31536000, immutable" });
      return res.end(readFileSync(`${UPLOADS}/${im[1]}`));
    }

    const m = path.match(/^\/api\/p\/([\w-]+)(?:\/(log|unlog|remove|start|finish|discard|events))?$/);
    if (m) {
      const found = findProgram(m[1]);
      const action = m[2] ?? "open";
      const who = () => asProgram(found);
      const deny = (status, error) => (audit(who(), action, status, error), send(res, status, { error }));
      if (!found) return deny(404, "No program at this link.");
      if (req.method === "GET" && m[2] === "events") return stream(req, res, asProgram(found), { programId: found.program.id });
      if (req.method === "GET" && !m[2]) {
        // A refetch after a live update is already covered by the broadcast line.
        if (!url.searchParams.has("refresh")) audit(asProgram(found), "open", 200, "opened program");
        return send(res, 200, found);
      }
      if (req.method === "POST" && m[2]) {
        const b = await readJson(req);
        const p = found.program;
        const done = (detail, status = 200) => {
          audit(who(), action, status, detail);
          push("program", { programId: p.id, users: [p.pt_user_id, p.client_user_id].filter(Boolean) });
          return send(res, status, findProgram(m[1]));
        };

        if (found.role !== "client") return deny(403, "Only the client logs sets.");
        const open = found.open_session;
        const exName = (id) => found.exercises.find((e) => e.id === id)?.name ?? `exercise ${id}`;

        // A change the PT queued while this workout was going happens once it's over.
        const pending = () => {
          const raw = db.prepare("SELECT pending_change FROM programs WHERE id = ?").get(p.id).pending_change;
          if (raw) applyChange(p, JSON.parse(raw));
        };

        if (m[2] === "start") {
          if (found.ended) return deny(409, "This program has ended.");
          if (open) return deny(409, "Finish or discard the workout you've already started.");
          if (!found.exercises.some((e) => e.day === b.day)) return deny(400, "No such workout.");
          db.prepare("INSERT INTO sessions (program_id, day) VALUES (?, ?)").run(p.id, b.day);
          return done(`started ${JSON.stringify(b.day)}`, 201);
        }
        if (!open) return deny(409, "Start a workout first.");

        if (m[2] === "finish") {
          // An empty workout isn't worth keeping.
          const sets = found.logs.filter((l) => l.session_id === open.id).length;
          if (sets) db.prepare("UPDATE sessions SET finished_at = datetime('now') WHERE id = ?").run(open.id);
          else db.prepare("DELETE FROM sessions WHERE id = ?").run(open.id);
          pending();
          return done(sets ? `finished ${JSON.stringify(open.day)} with ${sets} sets` : `finished ${JSON.stringify(open.day)} empty, so it was dropped`);
        }
        if (m[2] === "discard") {
          db.prepare("DELETE FROM set_logs WHERE session_id = ?").run(open.id);
          db.prepare("DELETE FROM sessions WHERE id = ?").run(open.id);
          pending();
          return done(`discarded ${JSON.stringify(open.day)}`);
        }
        if (m[2] === "unlog") {
          const log = found.logs.find((l) => l.id === Number(b.id) && l.session_id === open.id);
          if (!log) return deny(404, "No such set.");
          db.prepare("DELETE FROM set_logs WHERE id = ?").run(log.id);
          return done(`unticked ${exName(log.exercise_id)} set ${log.set_no}`);
        }

        const ex = found.exercises.find((e) => e.id === Number(b.exercise_id));
        const setNo = parseInt(b.set_no);
        if (!ex || !(setNo >= 1)) return deny(400, "Bad set.");

        if (m[2] === "remove") {
          // Drop the set and close the gap, so set 3 becomes set 2.
          db.exec("BEGIN");
          db.prepare("DELETE FROM set_logs WHERE session_id = ? AND exercise_id = ? AND set_no = ?").run(open.id, ex.id, setNo);
          db.prepare("UPDATE set_logs SET set_no = set_no - 1 WHERE session_id = ? AND exercise_id = ? AND set_no > ?").run(open.id, ex.id, setNo);
          db.exec("COMMIT");
          return done(`removed ${ex.name} set ${setNo}`);
        }

        const reps = parseInt(b.reps);
        const weight = b.weight === "" || b.weight == null ? null : Number(b.weight);
        if (!(reps >= 0) || (weight !== null && !Number.isFinite(weight))) return deny(400, "Bad set.");
        db.prepare("DELETE FROM set_logs WHERE session_id = ? AND exercise_id = ? AND set_no = ?").run(open.id, ex.id, setNo);
        db.prepare("INSERT INTO set_logs (exercise_id, set_no, reps, weight, session_id) VALUES (?,?,?,?,?)").run(ex.id, setNo, reps, weight, open.id);
        return done(`logged ${ex.name} set ${setNo}: ${reps}${weight === null ? " reps" : ` x ${weight}kg`}`, 201);
      }
    }
    send(res, 404, "Not found", "text/plain");
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(res, 400, { error: "Bad request." });
  }
});

const port = Number(process.env.PORT ?? 8080);
server.listen(port, "0.0.0.0", () => console.log(`listening on :${port}`));
