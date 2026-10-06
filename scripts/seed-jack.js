// Demo data: Jack, ten weeks into a push/pull/legs program, following double
// progression the way people actually do. Reps creep up at one weight, the
// weight goes up once the top set reaches the top of the range, and reps drop
// back near the bottom. Some days go backwards, some sessions get skipped.
//
// Run it next to a server that has already created the tables:
//   node scripts/seed-jack.js              (local ./data)
//   flyctl ssh console -C "node /app/scripts/seed-jack.js"
// It does nothing if Jack's program already exists.
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";

const DATA = process.env.DATA_DIR ?? (process.env.FLY_APP_NAME ? "/data" : "./data");
const db = new DatabaseSync(`${DATA}/app.db`);
const host = process.env.FLY_APP_NAME ? `https://${process.env.FLY_APP_NAME}.fly.dev` : "http://localhost:8080";
const TITLE = "Jack's push / pull / legs";

const existing = db.prepare("SELECT pt_token, client_token FROM programs WHERE title = ?").get(TITLE);
if (existing) {
  console.log(`Already seeded.\nPT:     ${host}/p/${existing.pt_token}\nClient: ${host}/p/${existing.client_token}`);
  process.exit(0);
}

// Seeded so every run draws the same history.
let seed = 4020;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = (xs) => xs[Math.floor(rand() * xs.length)];

// day, name, sets, rep range, rest, starting weight, weight step
const PLAN = [
  ["Push", "Bench Press (Barbell)", 3, [6, 10], 180, 60, 2.5],
  ["Push", "Overhead Press (Dumbbell)", 3, [8, 12], 120, 17.5, 2.5],
  ["Push", "Lateral Raise (Cable)", 3, [12, 15], 60, 5, 1.25],
  ["Push", "Triceps Pushdown", 3, [10, 15], 60, 20, 2.5],
  ["Pull", "Lat Pulldown", 3, [8, 12], 120, 50, 2.5],
  ["Pull", "Barbell Row", 3, [6, 10], 150, 55, 2.5],
  ["Pull", "Bicep Curl (Dumbbell)", 3, [8, 12], 60, 12.5, 1.25],
  ["Legs", "Back Squat", 3, [5, 8], 180, 80, 2.5],
  ["Legs", "Romanian Deadlift", 3, [8, 12], 150, 70, 2.5],
  ["Legs", "Leg Press", 3, [10, 15], 120, 140, 10],
  ["Legs", "Calf Raise", 3, [12, 20], 60, 40, 5],
];

const sql = (d) => d.toISOString().slice(0, 19).replace("T", " ");
const tok = () => randomBytes(12).toString("base64url");

db.exec("BEGIN");
const { lastInsertRowid: programId } = db
  .prepare("INSERT INTO programs (pt_token, client_token, title, pt_name, client_name, client_email, created_at) VALUES (?,?,?,?,?,?,?)")
  .run(tok(), tok(), TITLE, "Oli", "Jack", "jack@example.com", sql(new Date(Date.now() - 72 * 864e5)));
const addEx = db.prepare("INSERT INTO exercises (program_id, day, position, name, sets, reps, notes, rest_seconds) VALUES (?,?,?,?,?,?,?,?)");
const exs = PLAN.map(([day, name, sets, [lo, hi], rest, w, step], i) => ({
  id: addEx.run(programId, day, i, name, sets, `${lo}-${hi}`, "", rest).lastInsertRowid,
  day, sets, lo, hi, step, w, r: lo + (rand() < 0.5 ? 0 : 1),
}));

const addSession = db.prepare("INSERT INTO sessions (program_id, day, started_at, finished_at) VALUES (?,?,?,?)");
const addSet = db.prepare("INSERT INTO set_logs (exercise_id, set_no, reps, weight, logged_at, session_id) VALUES (?,?,?,?,?,?)");

// Mon push, Wed pull, Fri legs for ten weeks, finishing before today.
const start = new Date();
start.setHours(17, 30, 0, 0);
start.setDate(start.getDate() - 70);
for (let week = 0; week < 10; week++) {
  for (const [offset, day] of [[0, "Push"], [2, "Pull"], [4, "Legs"]]) {
    if (rand() < 0.1) continue; // missed one
    const t = new Date(start.getTime() + (week * 7 + offset) * 864e5 + Math.floor(rand() * 90) * 6e4);
    if (t > Date.now() - 36e5) continue;
    const begun = new Date(t);
    const sessionId = addSession.run(programId, day, sql(begun), sql(begun)).lastInsertRowid;

    for (const ex of exs.filter((e) => e.day === day)) {
      // Hit the top of the range last time: go up a weight, reps back near the bottom.
      if (ex.r >= ex.hi) {
        ex.w += ex.step;
        ex.r = ex.lo + (rand() < 0.6 ? 0 : 1);
      } else {
        ex.r += pick([0, 1, 1, 1, 2, -1]); // mostly up a rep, sometimes flat, now and then a bad day
        ex.r = Math.max(ex.lo - 1, Math.min(ex.r, ex.hi));
      }
      for (let n = 1; n <= ex.sets; n++) {
        const reps = Math.max(ex.lo - 2, ex.r - (n === 1 ? 0 : Math.floor(rand() * (n + 1))));
        t.setTime(t.getTime() + (ex.sets === n ? 2 : 3) * 6e4 + Math.floor(rand() * 60) * 1e3);
        addSet.run(ex.id, n, reps, ex.w, sql(t), sessionId);
      }
    }
    db.prepare("UPDATE sessions SET finished_at = ? WHERE id = ?").run(sql(new Date(t.getTime() + 5 * 6e4)), sessionId);
  }
}
db.exec("COMMIT");

const p = db.prepare("SELECT pt_token, client_token FROM programs WHERE id = ?").get(programId);
console.log(`Seeded Jack.\nPT:     ${host}/p/${p.pt_token}\nClient: ${host}/p/${p.client_token}`);
