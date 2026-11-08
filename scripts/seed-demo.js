// Demo data for the marker: one PT, Sam, with four clients who each show a
// different part of the app. Separate from Oli and Jack (scripts/seed-jack.js).
//
//   Priya  moving well on upper/lower, after a program change 3 weeks ago.
//          Chat with an unread message, check-ins, a private note.
//   Tom    full body, bench and squat stalled for the last few weeks.
//   Mia    hasn't trained in 10 days, so she's on the nudge list.
//   Ben    mid-workout right now ("Training now" on Sam's dashboard).
//   Chloe  invited, hasn't signed up yet.
//
// Dates are relative to when it runs, so run it close to when it'll be looked
// at. Run it next to a server that has already created the tables:
//   node scripts/seed-demo.js              (local ./data, or $DATA_DIR)
//   node scripts/fly-exec.js node /app/scripts/seed-demo.js
// It only writes once: if Sam's account exists it does nothing.
//
// Logins, public on purpose (this repo is public), all password demo1234:
//   PT:      sam@example.com
//   Clients: priya.demo@example.com, tom.demo@example.com,
//            mia.demo@example.com, ben.demo@example.com
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync } from "node:crypto";

const DATA = process.env.DATA_DIR ?? (process.env.FLY_APP_NAME ? "/data" : "./data");
const db = new DatabaseSync(`${DATA}/app.db`);
const PASSWORD = "demo1234";
const PT_EMAIL = "sam@example.com";

if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(PT_EMAIL)) {
  console.log(`Already seeded. Log in as ${PT_EMAIL}, password ${PASSWORD}.`);
  process.exit(0);
}

// Same format as hashPw in server.js.
const hashPw = (pw, salt = randomBytes(16).toString("hex")) => `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
const tok = () => randomBytes(12).toString("base64url");
const sql = (d) => d.toISOString().slice(0, 19).replace("T", " ");
const ago = (days, mins = 0) => new Date(Date.now() - days * 864e5 - mins * 6e4);

// Seeded so every run draws the same history.
let seed = 2026;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = (xs) => xs[Math.floor(rand() * xs.length)];

const user = (email, name, role) =>
  Number(db.prepare("INSERT INTO users (email, name, role, pass, created_at) VALUES (?,?,?,?,?)").run(email, name, role, hashPw(PASSWORD), sql(ago(90))).lastInsertRowid);

// day, name, sets, rep range, rest, starting weight, weight step
const UPPER_LOWER = [
  ["Upper", "Bench Press (Barbell)", 3, [6, 10], 150, 40, 2.5],
  ["Upper", "Seated Cable Row", 3, [8, 12], 120, 35, 2.5],
  ["Upper", "Overhead Press (Dumbbell)", 3, [8, 12], 90, 10, 1.25],
  ["Upper", "Lat Pulldown", 3, [10, 12], 90, 35, 2.5],
  ["Lower", "Back Squat", 3, [5, 8], 180, 55, 2.5],
  ["Lower", "Romanian Deadlift", 3, [8, 10], 150, 50, 2.5],
  ["Lower", "Walking Lunge (Dumbbell)", 3, [10, 12], 90, 10, 2],
  ["Lower", "Hip Thrust", 3, [10, 15], 90, 60, 5],
];
const BEGINNER = [
  ["Full body", "Goblet Squat", 3, [10, 12], 90, 12, 2],
  ["Full body", "Dumbbell Bench Press", 3, [8, 12], 90, 10, 2],
  ["Full body", "Lat Pulldown", 3, [10, 12], 90, 25, 2.5],
  ["Full body", "Plank (seconds)", 3, [30, 45], 60, null, 0],
];
const FULL_BODY = [
  ["A", "Back Squat", 3, [5, 5], 180, 90, 2.5],
  ["A", "Bench Press (Barbell)", 3, [5, 5], 180, 75, 2.5],
  ["A", "Barbell Row", 3, [6, 8], 120, 60, 2.5],
  ["B", "Deadlift", 2, [5, 5], 180, 120, 5],
  ["B", "Overhead Press (Barbell)", 3, [5, 8], 150, 45, 2.5],
  ["B", "Chin Up", 3, [5, 8], 120, 0, 2.5],
];
const PPL = [
  ["Push", "Bench Press (Barbell)", 3, [6, 10], 180, 50, 2.5],
  ["Push", "Overhead Press (Dumbbell)", 3, [8, 12], 120, 14, 2],
  ["Push", "Triceps Pushdown", 3, [10, 15], 60, 15, 2.5],
  ["Pull", "Lat Pulldown", 3, [8, 12], 120, 45, 2.5],
  ["Pull", "Barbell Row", 3, [6, 10], 150, 45, 2.5],
  ["Pull", "Bicep Curl (Dumbbell)", 3, [8, 12], 60, 10, 1],
  ["Legs", "Back Squat", 3, [5, 8], 180, 70, 2.5],
  ["Legs", "Leg Press", 3, [10, 15], 120, 100, 10],
  ["Legs", "Calf Raise", 3, [12, 20], 60, 30, 5],
];

const addEx = db.prepare("INSERT INTO exercises (program_id, day, position, name, sets, reps, notes, rest_seconds) VALUES (?,?,?,?,?,?,?,?)");
const addSession = db.prepare("INSERT INTO sessions (program_id, day, started_at, finished_at) VALUES (?,?,?,?)");
const addSet = db.prepare("INSERT INTO set_logs (exercise_id, set_no, reps, weight, logged_at, session_id) VALUES (?,?,?,?,?,?)");
const finish = db.prepare("UPDATE sessions SET finished_at = ? WHERE id = ?");

function program(pt, client, { title, name, email, plan, created, notes = {} }) {
  const id = Number(db.prepare(`INSERT INTO programs (pt_token, client_token, title, pt_name, client_name, client_email, pt_user_id, client_user_id, created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(tok(), tok(), title, "Sam", name, email, pt, client, sql(created)).lastInsertRowid);
  const exs = plan.map(([day, ex, sets, [lo, hi], rest, w, step], i) => ({
    id: Number(addEx.run(id, day, i, ex, sets, lo === hi ? `${lo}` : `${lo}-${hi}`, notes[ex] ?? "", rest).lastInsertRowid),
    name: ex, day, sets, lo, hi, step, w, r: lo,
  }));
  return { id, exs };
}

// Double progression: reps climb at a weight, the weight goes up once the top
// of the range is hit. Lifts in `stall` stop moving for the last `stallWeeks`.
// Training days are [days after Monday, day name].
function history(p, { from, to, days, skip = 0.08, stall = [], stallWeeks = 4 }) {
  const monday = new Date(from);
  monday.setHours(7, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const stallAt = to.getTime() - stallWeeks * 7 * 864e5;
  for (let week = 0; ; week++) {
    for (const [offset, day] of days) {
      const t = new Date(monday.getTime() + (week * 7 + offset) * 864e5 + Math.floor(rand() * 12) * 15 * 6e4);
      if (t < from) continue;
      if (t > to) return;
      if (rand() < skip) continue;
      session(p, day, t, (ex) => {
        if (stall.includes(ex.name) && t.getTime() > stallAt) {
          ex.peak ??= ex.r;
          ex.r = ex.peak - pick([0, 0, 1]);
        } else if (ex.r >= ex.hi) {
          if (ex.w !== null) { ex.w += ex.step; ex.r = ex.lo + (rand() < 0.6 ? 0 : 1); }
        } else ex.r = Math.max(ex.lo - 1, Math.min(ex.hi, ex.r + pick([0, 1, 1, 1, 2, -1])));
      });
    }
  }
}

// One workout. `progress` moves each lift on before its sets are logged.
// Leave `done` false for one that's still going.
function session(p, day, t, progress, { done = true, only } = {}) {
  const sid = Number(addSession.run(p.id, day, sql(t), null).lastInsertRowid);
  const at = new Date(t);
  for (const ex of p.exs.filter((e) => e.day === day).slice(0, only)) {
    progress(ex);
    for (let n = 1; n <= ex.sets; n++) {
      const reps = Math.max(ex.lo - 2, ex.r - (n === 1 ? 0 : Math.floor(rand() * (n + 1))));
      at.setTime(at.getTime() + (n === ex.sets ? 2 : 3) * 6e4 + Math.floor(rand() * 60) * 1e3);
      addSet.run(ex.id, n, reps, ex.w, sql(at), sid);
    }
  }
  if (done) finish.run(sql(new Date(at.getTime() + 5 * 6e4)), sid);
}

const chat = (pt, client, lines) => {
  const ins = db.prepare("INSERT INTO messages (pt_id, client_id, sender_id, body, call_secs, created_at) VALUES (?,?,?,?,?,?)");
  return lines.map(([who, when, body, call]) => Number(ins.run(pt, client, who, body ?? "", call ?? null, sql(when)).lastInsertRowid));
};
const read = (me, other, lastId) =>
  db.prepare("INSERT INTO reads (user_id, other_id, last_id) VALUES (?,?,?) ON CONFLICT DO UPDATE SET last_id = excluded.last_id").run(me, other, lastId);

// Same as DEFAULT_QUESTIONS in server.js, so these read like real check-ins.
const QUESTIONS = JSON.stringify([
  { text: "How's your energy been this week?", kind: "scale" },
  { text: "How are you sleeping?", kind: "scale" },
  { text: "How sore have you been?", kind: "scale" },
  { text: "Anything I should know?", kind: "text" },
]);
const checkin = (pt, client, when, answers) =>
  db.prepare("INSERT INTO checkins (pt_id, client_id, questions, answers, created_at) VALUES (?,?,?,?,?)").run(pt, client, QUESTIONS, JSON.stringify(answers), sql(when));
const note = (pt, email, body) =>
  db.prepare("INSERT INTO client_notes (pt_user_id, client_email, body, updated_at) VALUES (?,?,?,?)").run(pt, email, body, sql(ago(5)));

db.exec("BEGIN");
try {
  const sam = user(PT_EMAIL, "Sam", "pt");
  const priya = user("priya.demo@example.com", "Priya Shah", "client");
  const tom = user("tom.demo@example.com", "Tom Nguyen", "client");
  const mia = user("mia.demo@example.com", "Mia Roberts", "client");
  const ben = user("ben.demo@example.com", "Ben Carter", "client");

  // Sam's library.
  const tpl = db.prepare("INSERT INTO templates (pt_user_id, name, exercises, created_at) VALUES (?,?,?,?)");
  for (const [name, plan] of [["Beginner full body", BEGINNER], ["Upper / lower", UPPER_LOWER], ["Strength 5x5 A/B", FULL_BODY], ["Push / pull / legs", PPL]])
    tpl.run(sam, name, JSON.stringify(plan.map(([day, ex, sets, [lo, hi], rest]) => ({ day, name: ex, sets, reps: lo === hi ? `${lo}` : `${lo}-${hi}`, notes: "", rest }))), sql(ago(80)));

  // Priya: five weeks on the beginner program, then moved to upper/lower.
  const pb = program(sam, priya, { title: "Beginner full body", name: "Priya Shah", email: "priya.demo@example.com", plan: BEGINNER, created: ago(56) });
  history(pb, { from: ago(56), to: ago(22), days: [[0, "Full body"], [3, "Full body"]] });
  const pu = program(sam, priya, {
    title: "Upper / lower", name: "Priya Shah", email: "priya.demo@example.com", plan: UPPER_LOWER, created: ago(21),
    notes: { "Back Squat": "Box at parallel. Stop at RPE 8 while the knee settles.", "Hip Thrust": "Pause 1s at the top." },
  });
  db.prepare("UPDATE programs SET ended_at = ?, replaced_by = ? WHERE id = ?").run(sql(ago(21)), pu.id, pb.id);
  db.prepare("UPDATE programs SET change_note = ? WHERE id = ?").run("You've outgrown the beginner plan. Four days now, upper and lower. Squats stay light while the knee settles.", pu.id);
  history(pu, { from: ago(21), to: ago(1), days: [[0, "Upper"], [1, "Lower"], [3, "Upper"], [4, "Lower"]], skip: 0.05 });
  note(sam, "priya.demo@example.com", "Left knee niggle from netball (Sept). Squat to a box, cap at RPE 8. Goal: first chin up by Christmas. Trains before work, replies fast.");
  const pm = chat(sam, priya, [
    [sam, ago(21, -10), "New program's up. Have a look before Monday and shout if anything doesn't make sense."],
    [priya, ago(20), "Looks good! 4 days is a lot but I'll make it work"],
    [sam, ago(20, -30), "You'll be fine. Lower days are short."],
    [sam, ago(9), null, 754],
    [priya, ago(8), "Squats felt way better on the box, no knee pain at all"],
    [sam, ago(8, -20), "Great. Keep it there another two weeks then we'll take the box away."],
    [priya, ago(1, -40), "Hit 10 reps on bench at the new weight! go up next time?"],
  ]);
  read(sam, priya, pm.at(-2));
  read(priya, sam, pm.at(-1));
  checkin(sam, priya, ago(15), [4, 3, 3, "Busy week at work, sleep's been short."]);
  checkin(sam, priya, ago(8), [4, 4, 2, "Knee is fine on the box squats."]);
  checkin(sam, priya, ago(1), [5, 4, 3, ""]);

  // Tom: ten weeks of 5x5, bench and squat stuck for the last month.
  const pt = program(sam, tom, { title: "Strength 5x5 A/B", name: "Tom Nguyen", email: "tom.demo@example.com", plan: FULL_BODY, created: ago(72) });
  history(pt, { from: ago(72), to: ago(3), days: [[0, "A"], [2, "B"], [4, "A"]], skip: 0.12, stall: ["Bench Press (Barbell)", "Back Squat"] });
  note(sam, "tom.demo@example.com", "Wants a 100kg bench by end of year. Works nights, sleep is the limiter. Bench and squat have stalled: deload next week?");
  const tm = chat(sam, tom, [
    [tom, ago(10), "Bench stalled again. Same weight 3 weeks now"],
    [sam, ago(10, -45), "Seen it. How's sleep been on the night shifts?"],
    [tom, ago(9), "Pretty bad honestly, 5 hours maybe"],
    [sam, ago(9, -15), "That'll be most of it. Let's talk Friday about a deload."],
  ]);
  read(sam, tom, tm.at(-1));
  read(tom, sam, tm.at(-1));
  checkin(sam, tom, ago(4), [2, 2, 4, "Night shifts again this week. Felt flat on squats."]);

  // Mia: six weeks of push/pull/legs, then nothing for 10 days.
  const pmia = program(sam, mia, { title: "Push / pull / legs", name: "Mia Roberts", email: "mia.demo@example.com", plan: PPL, created: ago(52) });
  history(pmia, { from: ago(52), to: ago(10), days: [[0, "Push"], [2, "Pull"], [4, "Legs"]], skip: 0.15 });
  const mm = chat(sam, mia, [[mia, ago(12), "Away for a bit next week, will try to get to a gym"], [sam, ago(12, -60), "No worries, enjoy it!"]]);
  read(sam, mia, mm.at(-1));
  read(mia, sam, mm.at(-1));

  // Ben: four weeks of upper/lower, and in the gym right now.
  const pbn = program(sam, ben, { title: "Upper / lower", name: "Ben Carter", email: "ben.demo@example.com", plan: UPPER_LOWER.map((e) => e.with(5, Math.round((e[5] * 1.4) / e[6]) * e[6])), created: ago(30) });
  history(pbn, { from: ago(30), to: ago(2), days: [[0, "Upper"], [1, "Lower"], [3, "Upper"], [4, "Lower"]] });
  session(pbn, "Upper", ago(0, 25), (ex) => {}, { done: false, only: 2 });
  const bm = chat(sam, ben, [[ben, ago(3), "Can I swap lunges for split squats? Gym's packed at 6"], [sam, ago(3, -20), "Yep, same sets and reps."]]);
  read(sam, ben, bm.at(-1));
  read(ben, sam, bm.at(-1));

  // Chloe: invited yesterday, no account yet.
  program(sam, null, { title: "Beginner full body", name: "Chloe Martin", email: "chloe.demo@example.com", plan: BEGINNER, created: ago(1) });
  db.prepare("INSERT INTO invites (token, pt_user_id, name, email, created_at) VALUES (?,?,?,?,?)").run(tok(), sam, "Chloe Martin", "chloe.demo@example.com", sql(ago(1)));

  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}
console.log(`Seeded Sam's demo clients. Log in as ${PT_EMAIL} (PT) or priya.demo@example.com (client), password ${PASSWORD}.`);
