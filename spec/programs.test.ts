import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
// `as` is a login cookie; without one the request is anonymous, like a link.
const api = (path: string, body?: unknown, as = "") =>
  fetch(new URL(path, baseUrl), {
    headers: { cookie: as, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }),
  });
const cookieOf = (res: Response) => res.headers.get("set-cookie")?.split(";")[0] ?? "";
const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function signupPT(name = "PT") {
  const res = await api("/api/signup", { name, email: `pt-${unique()}@example.com`, password: "password123" });
  expect(res.status).toBe(201);
  return cookieOf(res);
}

// A client onboarded the way the app does it: a saved program, then Onboard client.
async function program(pt?: string, client_email = `client-${unique()}@example.com`) {
  pt ??= await signupPT();
  const saved = await api("/api/templates", { name: "Spec block", exercises: [{ day: "Day 1", name: "Squat", sets: 3, reps: "5" }] }, pt);
  const made = await api(`/api/templates/${(await saved.json()).id}/assign`, { client_name: "Client", client_email }, pt);
  expect(made.status).toBe(201);
  const { ptToken, clientToken, invite } = await made.json();
  const client = await (await api(`/api/p/${clientToken}`)).json();
  return { pt, ptToken, clientToken, invite, client, exercise_id: client.exercises[0].id };
}

// The client signs up from their invite. Returns the response and their login cookie.
async function join(invite: string, body: object = { password: "password123" }) {
  const res = await api(`/api/invite/${invite}`, body);
  return { res, cookie: cookieOf(res) };
}
// Who a signed-up client is and which PT they have.
async function whoAmI(cookie: string) {
  const me = await (await api("/api/me", undefined, cookie)).json();
  return { client_user_id: me.me.id, pt_user_id: me.pts[0]?.id, me };
}

it("a client logs sets in a workout, the PT sees them and cannot log", async () => {
  const { ptToken, clientToken, client, exercise_id } = await program();
  expect(client.role).toBe("client");
  expect(client.client_token).toBeUndefined(); // the client link never leaks the PT link

  expect((await api(`/api/p/${clientToken}/log`, { exercise_id, set_no: 1, reps: 5 })).status).toBe(409); // no workout started
  expect((await api(`/api/p/${clientToken}/start`, { day: "Day 1" })).status).toBe(201);
  expect((await api(`/api/p/${clientToken}/log`, { exercise_id, set_no: 1, reps: 5, weight: 100 })).status).toBe(201);
  expect((await api(`/api/p/${ptToken}/log`, { exercise_id, set_no: 2, reps: 5 })).status).toBe(403);

  const pt = await (await api(`/api/p/${ptToken}`)).json();
  expect(pt.role).toBe("pt");
  expect(pt.logs).toMatchObject([{ set_no: 1, reps: 5, weight: 100 }]);
});

it("removing a set closes the gap, and finishing saves the workout", async () => {
  const { clientToken, exercise_id } = await program();
  await api(`/api/p/${clientToken}/start`, { day: "Day 1" });
  for (const set_no of [1, 2, 3]) await api(`/api/p/${clientToken}/log`, { exercise_id, set_no, reps: set_no, weight: 50 });

  const after = await (await api(`/api/p/${clientToken}/remove`, { exercise_id, set_no: 2 })).json();
  expect(after.logs.map((l: { set_no: number; reps: number }) => [l.set_no, l.reps])).toEqual([[1, 1], [2, 3]]);

  const done = await (await api(`/api/p/${clientToken}/finish`, {})).json();
  expect(done.open_session).toBeNull();
  expect(done.sessions[0].finished_at).toBeTruthy();
  expect(done.logs).toHaveLength(2); // still there after finishing
});

it("rejects a program with no exercises, or from someone not logged in as a PT", async () => {
  const body = { name: "x", exercises: [{ name: "Squat" }] };
  expect((await api("/api/templates", { ...body, exercises: [] }, await signupPT())).status).toBe(400);
  expect((await api("/api/templates", body)).status).toBe(401);
});

it("an invite is to the app: the client signs up, can fix the name and email, and it only works once", async () => {
  const { pt, invite } = await program();
  const page = await api(`/join/${invite}`);
  expect(page.status).toBe(200);
  expect(await page.text()).toContain("Sign up");
  expect(await (await api(`/api/invite/${invite}`)).json()).toMatchObject({ name: "Client", pt_name: "PT", program: "Spec block" });
  expect((await api("/api/invite/nope")).status).toBe(404);

  const email = `fixed-${unique()}@example.com`;
  expect((await join(invite, { name: "Ana", email: "not-an-email", password: "password123" })).res.status).toBe(400);
  expect((await join(invite, { name: "Ana", email, password: "short" })).res.status).toBe(400);
  const { res, cookie } = await join(invite, { name: "Ana", email, password: "password123" });
  expect(res.status).toBe(200);
  expect((await whoAmI(cookie)).me.programs.map((p: { title: string }) => p.title)).toEqual(["Spec block"]);
  expect((await api("/api/login", { email, password: "password123" })).status).toBe(200);
  const dash = await (await api("/api/dash", undefined, pt)).json();
  expect(dash.clients.map((c: { client_name: string }) => c.client_name)).toContain("Ana");
  // Once used, the invite just says so (the page sends them to log in) and can't sign up again.
  expect(await (await api(`/api/invite/${invite}`)).json()).toEqual({ used: true });
  expect((await join(invite)).res.status).toBe(409);
});

it("changing a client's program keeps every logged set, and waits if they're mid-workout", async () => {
  const { pt, clientToken, invite, exercise_id } = await program();
  const { cookie: client } = await join(invite);
  const old = (await (await api(`/api/p/${clientToken}`)).json()).program;
  const { id: template_id } = await (await api("/api/templates", { name: "Block 2", exercises: [{ day: "Day A", name: "Deadlift", sets: 3, reps: "5" }] }, pt)).json();
  const other = await signupPT("Other PT");
  expect((await api(`/api/programs/${old.id}/change`, { template_id }, other)).status).toBe(404);

  // Mid-workout: queued, nothing moves yet.
  await api(`/api/p/${clientToken}/start`, { day: "Day 1" });
  await api(`/api/p/${clientToken}/log`, { exercise_id, set_no: 1, reps: 5, weight: 100 });
  const queued = await api(`/api/programs/${old.id}/change`, { template_id, note: "New block, go easy on the deadlifts." }, pt);
  expect(queued.status).toBe(202);
  let dash = await (await api("/api/dash", undefined, pt)).json();
  expect(dash.clients.find((c: { program_id: number }) => c.program_id === old.id).pending).toMatchObject({ title: "Block 2" });

  // Finishing the workout makes the change. The old program and its set stay.
  const finished = await (await api(`/api/p/${clientToken}/finish`, {})).json();
  expect(finished.ended).toBe(true);
  expect(finished.logs).toMatchObject([{ set_no: 1, reps: 5, weight: 100 }]);
  expect((await api(`/api/p/${clientToken}/start`, { day: "Day 1" })).status).toBe(409);
  const mine = await (await api("/api/me", undefined, client)).json();
  expect(mine.programs).toMatchObject([{ title: "Block 2", change_note: "New block, go easy on the deadlifts." }]);
  expect(JSON.stringify(mine)).not.toContain("pt_token");

  dash = await (await api("/api/dash", undefined, pt)).json();
  expect(dash.clients.map((c: { title: string }) => c.title)).toEqual(["Block 2"]);
  expect(dash.clients[0].last_workout).toBeTruthy(); // their history counts
  const me = await (await api("/api/me", undefined, client)).json();
  expect(me.programs.map((p: { title: string }) => p.title)).toEqual(["Block 2"]);
  expect(me.workouts).toHaveLength(1);
});

it("changing the program before the client signs up: the same invite gets them the new one", async () => {
  const { pt, clientToken, invite } = await program();
  const old = (await (await api(`/api/p/${clientToken}`)).json()).program;
  const { id: template_id } = await (await api("/api/templates", { name: "Block 2", exercises: [{ name: "Row" }] }, pt)).json();
  expect((await api(`/api/programs/${old.id}/change`, { template_id }, pt)).status).toBe(200);
  expect((await (await api(`/api/invite/${invite}`)).json()).program).toBe("Block 2");
  const { res, cookie } = await join(invite);
  expect(res.status).toBe(200);
  expect((await whoAmI(cookie)).me.programs.map((p: { title: string }) => p.title)).toEqual(["Block 2"]);
});

it("duplicating a program makes a separate copy", async () => {
  const pt = await signupPT();
  const { id } = await (await api("/api/templates", { name: "PPL", exercises: [{ day: "Push", name: "Bench" }] }, pt)).json();
  expect((await api(`/api/templates/${id}/duplicate`, {}, await signupPT())).status).toBe(404);
  const { id: copy } = await (await api(`/api/templates/${id}/duplicate`, {}, pt)).json();
  await api(`/api/templates/${copy}`, { name: "PPL v2" }, pt);
  const { templates } = await (await api("/api/templates", undefined, pt)).json();
  expect(templates.map((t: { name: string }) => t.name)).toEqual(["PPL", "PPL v2"]);
});

it("a PT's dashboard shows their own clients and nobody else's", async () => {
  const a = await program();
  const b = await signupPT("Other PT");
  const mine = await (await api("/api/dash", undefined, a.pt)).json();
  expect(mine.clients.map((c: { pt_token: string }) => c.pt_token)).toContain(a.ptToken);
  const theirs = await (await api("/api/dash", undefined, b)).json();
  expect(theirs.clients).toEqual([]);
  expect((await api("/api/dash")).status).toBe(401);
  // Another PT can't change their program.
  expect((await api(`/api/programs/${mine.clients[0].program_id}/change`, { template_id: 1 }, b)).status).toBe(404);
});

it("a client signs up from their invite, then only their own PT can message them", async () => {
  const email = `client-${unique()}@example.com`;
  const { pt, invite } = await program(undefined, email);
  const { res, cookie: client } = await join(invite);
  expect(res.status).toBe(200);
  const p = await whoAmI(client);

  // and can log in with it later
  expect((await api("/api/login", { email, password: "password123" })).status).toBe(200);
  expect((await api("/api/login", { email, password: "wrong-password" })).status).toBe(401);

  expect((await api(`/api/chat/${p.pt_user_id}`, { body: "Is the squat heavy enough?" }, client)).status).toBe(201);
  const thread = await (await api(`/api/chat/${p.client_user_id}`, undefined, pt)).json();
  expect(thread.messages.map((m: { body: string }) => m.body)).toEqual(["Is the squat heavy enough?"]);

  const stranger = await signupPT("Stranger");
  expect((await api(`/api/chat/${p.client_user_id}`, undefined, stranger)).status).toBe(404);
  expect((await api(`/api/chat/${p.client_user_id}`)).status).toBe(404);
  // A video call can only be set up between the paired PT and client.
  expect((await api(`/api/call/${p.pt_user_id}`, { signal: { kind: "end" } }, client)).status).toBe(200);
  expect((await api(`/api/call/${p.client_user_id}`, { signal: { kind: "end" } }, pt)).status).toBe(200);
  expect((await api(`/api/call/${p.client_user_id}`, { signal: { kind: "end" } }, stranger)).status).toBe(404);
  expect((await api(`/api/call/${p.client_user_id}`, { signal: { kind: "end" } })).status).toBe(404);
  expect((await api(`/api/call/${p.pt_user_id}`, { signal: { kind: "nope" } }, client)).status).toBe(400);
  // Nothing a client sees gives away the PT link.
  const me = await (await api("/api/me", undefined, client)).text();
  expect(me).not.toContain("pt_token");
});

it("templates belong to the PT who saved them", async () => {
  const pt = await signupPT();
  const other = await signupPT("Other PT");
  const saved = await api("/api/templates", { name: "PPL", exercises: [{ day: "Push", name: "Bench", sets: 3, reps: "8" }] }, pt);
  expect(saved.status).toBe(201);
  const { id } = await saved.json();
  const mine = await (await api("/api/templates", undefined, pt)).json();
  expect(mine.templates).toMatchObject([{ id, name: "PPL", exercises: [{ name: "Bench" }] }]);
  expect((await (await api("/api/templates", undefined, other)).json()).templates).toEqual([]);
  expect((await api(`/api/templates/${id}/delete`, {}, other)).status).toBe(404);
  // Editing replaces the exercises; another PT can't.
  const edit = { name: "PPL v2", exercises: [{ day: "Push", name: "Incline Bench", sets: 4, reps: "6-8" }] };
  expect((await api(`/api/templates/${id}`, edit, other)).status).toBe(404);
  expect((await api(`/api/templates/${id}`, edit, pt)).status).toBe(200);
  const edited = await (await api("/api/templates", undefined, pt)).json();
  expect(edited.templates).toMatchObject([{ id, name: "PPL v2", exercises: [{ name: "Incline Bench", sets: 4 }] }]);
  expect((await api("/api/templates")).status).toBe(401);
  // Assigning gives the client their own copy; editing the library program after
  // doesn't change it, and another PT can't assign it.
  const assign = { client_name: "Ana", client_email: `ana-${unique()}@example.com` };
  expect((await api(`/api/templates/${id}/assign`, assign, other)).status).toBe(404);
  expect((await api(`/api/templates/${id}/assign`, { client_name: "Ana" }, pt)).status).toBe(400);
  const assigned = await api(`/api/templates/${id}/assign`, assign, pt);
  expect(assigned.status).toBe(201);
  const { clientToken } = await assigned.json();
  await api(`/api/templates/${id}`, { name: "PPL v3", exercises: [{ day: "Legs", name: "Squat" }] }, pt);
  const copy = await (await api(`/api/p/${clientToken}`)).json();
  expect(copy.program).toMatchObject({ title: "PPL v2", client_name: "Ana" });
  expect(copy.exercises.map((e: { name: string }) => e.name)).toEqual(["Incline Bench"]);
  const clients = await (await api("/api/clients", undefined, pt)).json();
  expect(clients.clients).toEqual([{ name: "Ana", email: assign.client_email }]);
  expect((await (await api("/api/clients", undefined, other)).json()).clients).toEqual([]);

  expect((await api(`/api/templates/${id}/delete`, {}, pt)).status).toBe(200);
});

it("a nudge sends the PT's own message to their quiet clients' chats and nobody else's", async () => {
  const { pt, invite } = await program();
  const { cookie: client } = await join(invite);
  const p = await whoAmI(client);
  const stranger = await signupPT("Stranger");

  expect((await api("/api/nudge/message", { message: "" }, pt)).status).toBe(400);
  expect((await api("/api/nudge/message", { message: "Oi {name}, where are you?" }, pt)).status).toBe(200);
  const preview = await (await api("/api/nudge", undefined, pt)).json();
  expect(preview.clients.map((c: { id: number }) => c.id)).toEqual([p.client_user_id]);
  expect((await (await api("/api/nudge", undefined, stranger)).json()).clients).toEqual([]);
  expect((await api("/api/nudge", {}, client)).status).toBe(401);

  // Nobody ticked, or only someone who isn't theirs: nothing goes out.
  expect((await api("/api/nudge", { ids: [] }, pt)).status).toBe(400);
  expect((await api("/api/nudge", { ids: [999999] }, pt)).status).toBe(400);
  expect((await api("/api/nudge", { ids: [p.client_user_id] }, pt)).status).toBe(201);
  const chat = await (await api(`/api/chat/${p.pt_user_id}`, undefined, client)).json();
  expect(chat.messages.at(-1)).toMatchObject({ sender_id: p.pt_user_id, body: expect.stringMatching(/^Oi \S+, where are you\?$/) });
});

it("a client's check-in reaches their own PT and nobody else, and shows in the inbox list", async () => {
  const { pt, invite } = await program();
  const { cookie: client } = await join(invite);
  const p = await whoAmI(client);

  expect((await api("/api/checkins", { questions: [{ text: "Knee pain?", kind: "scale" }, { text: "Notes", kind: "text" }] }, pt)).status).toBe(200);
  const form = await (await api(`/api/checkin/${p.pt_user_id}`, undefined, client)).json();
  expect(form.questions.map((q: { text: string }) => q.text)).toEqual(["Knee pain?", "Notes"]);
  expect((await api(`/api/checkin/${p.pt_user_id}`, { answers: [null, ""] }, client)).status).toBe(400);
  expect((await api(`/api/checkin/${p.pt_user_id}`, { answers: [2, "Sore after legs"] }, client)).status).toBe(201);

  const seen = await (await api("/api/checkins", undefined, pt)).json();
  expect(seen.checkins).toMatchObject([{ client_id: p.client_user_id, answers: [2, "Sore after legs"] }]);
  const stranger = await signupPT("Stranger");
  expect((await (await api("/api/checkins", undefined, stranger)).json()).checkins).toEqual([]);
  expect((await api(`/api/checkin/${(await (await api("/api/me", undefined, stranger)).json()).me.id}`, { answers: [1] }, client)).status).toBe(404);
  expect((await api("/api/checkins", undefined, client)).status).toBe(401);

  const inbox = await (await api("/api/inbox", undefined, pt)).json();
  expect(inbox.threads.map((t: { id: number }) => t.id)).toEqual([p.client_user_id]);
  expect((await (await api("/api/inbox", undefined, stranger)).json()).threads).toEqual([]);
});

it("serves every script the pages load", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const scripts = new Set<string>();
  for (const f of readdirSync("public").filter((f) => /\.(html|js)$/.test(f)))
    for (const m of readFileSync(`public/${f}`, "utf8").matchAll(/["'](\/[\w-]+\.js)["']/g)) scripts.add(m[1]);
  expect(scripts.size).toBeGreaterThan(3);
  for (const s of scripts) expect((await fetch(new URL(s, baseUrl))).status, s).toBe(200);
  expect((await fetch(new URL("/server.js", baseUrl))).status).toBe(404); // only public/
});

it("private notes are on the client, shared by their programs, and only their PT sees them", async () => {
  const pt = await signupPT();
  const email = `notes-${unique()}@example.com`;
  const a = await program(pt, email);
  const b = await program(pt, email.toUpperCase()); // same client, second program
  const secret = "Left knee: no deep squats. Wants a 100kg squat by March.";
  expect((await api("/api/notes", { email, body: secret }, pt)).status).toBe(200);

  const dash = await (await api("/api/dash", undefined, pt)).json();
  const notes = dash.clients.filter((c: { pt_token: string }) => [a.ptToken, b.ptToken].includes(c.pt_token)).map((c: { note: string }) => c.note);
  expect(notes).toEqual([secret, secret]);

  const stranger = await signupPT("Stranger");
  expect((await api("/api/notes", { email, body: "mine now" }, stranger)).status).toBe(404);
  expect((await api("/api/notes", { email, body: "x" })).status).toBe(401);
  const { cookie: client } = await join(a.invite);
  expect((await api("/api/notes", { email, body: "x" }, client)).status).toBe(401);
  // Nothing the client, their link, the PT link or another PT gets has the note.
  for (const [path, as] of [[`/api/p/${a.clientToken}`, ""], [`/api/p/${a.ptToken}`, ""], ["/api/me", client], ["/api/dash", stranger]])
    expect(await (await api(path, undefined, as)).text()).not.toContain("Left knee");
});

it("exports a PT's own clients' sets as CSV, never another PT's or a token", async () => {
  const pt = await signupPT();
  const { ptToken, clientToken, exercise_id } = await program(pt, `csv-${unique()}@example.com`);
  const other = await program(pt);
  await api(`/api/p/${clientToken}/start`, { day: "Day 1" });
  await api(`/api/p/${clientToken}/log`, { exercise_id, set_no: 1, reps: 5, weight: 100 });
  await api(`/api/p/${other.clientToken}/start`, { day: "Day 1" });
  await api(`/api/p/${other.clientToken}/log`, { exercise_id: other.exercise_id, set_no: 1, reps: 3, weight: 60 });
  const email = (await (await api(`/api/p/${ptToken}`)).json()).program.client_email;
  const rows = async (path: string, as = pt) => (await (await api(path, undefined, as)).text()).trim().split("\r\n");

  const all = await api("/api/export.csv", undefined, pt);
  expect(all.headers.get("content-type")).toMatch(/text\/csv/);
  const lines = (await all.text()).trim().split("\r\n");
  expect(lines[0]).toContain('"client","email","program","day","exercise","target_sets","rep_range","date","time","set","reps","weight_kg"');
  expect(lines).toHaveLength(3);
  const one = await rows(`/api/export.csv?client=${encodeURIComponent(email)}`);
  expect(one).toHaveLength(2);
  expect(one[1]).toMatch(/"Squat","3","5",.*"1","5","100"$/);
  expect(await rows("/api/export.csv?from=2000-01-01&to=2000-01-02")).toHaveLength(1); // header only

  for (const t of [ptToken, clientToken, other.ptToken, other.clientToken]) expect(lines.join("\n")).not.toContain(t);
  expect(await rows("/api/export.csv", await signupPT("Stranger"))).toHaveLength(1);
  expect((await api("/api/export.csv")).status).toBe(401);
});

it("the client dashboard sums progress over every lift, counting reps climbing at one weight", async () => {
  const { invite, clientToken, exercise_id } = await program();
  const { cookie } = await join(invite);
  // Same weight, one more rep each time: no heavier, but still progress.
  for (const reps of [5, 6, 7]) {
    await api(`/api/p/${clientToken}/start`, { day: "Day 1" });
    await api(`/api/p/${clientToken}/log`, { exercise_id, set_no: 1, reps, weight: 100 });
    await api(`/api/p/${clientToken}/finish`, {});
  }
  const gains = (await whoAmI(cookie)).me.progress.map((p: { gain: number }) => p.gain);
  expect(gains).toHaveLength(3);
  expect(gains[0]).toBe(0);
  expect(gains[1]).toBeGreaterThan(0);
  expect(gains[2]).toBeGreaterThan(gains[1]);
});
