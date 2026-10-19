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

async function program(pt?: string, client_email = `client-${unique()}@example.com`) {
  pt ??= await signupPT();
  const made = await api("/api/programs", {
    title: "Spec block", client_name: "Client", client_email,
    exercises: [{ day: "Day 1", name: "Squat", sets: 3, reps: "5" }],
  }, pt);
  expect(made.status).toBe(201);
  const { ptToken, clientToken } = await made.json();
  const client = await (await api(`/api/p/${clientToken}`)).json();
  return { pt, ptToken, clientToken, client, exercise_id: client.exercises[0].id };
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
  const body = { title: "x", client_name: "b", client_email: "b@x.com", exercises: [{ name: "Squat" }] };
  expect((await api("/api/programs", { ...body, exercises: [] }, await signupPT())).status).toBe(400);
  expect((await api("/api/programs", body)).status).toBe(401);
});

it("a PT's dashboard shows their own clients and nobody else's", async () => {
  const a = await program();
  const b = await signupPT("Other PT");
  const mine = await (await api("/api/dash", undefined, a.pt)).json();
  expect(mine.clients.map((c: { pt_token: string }) => c.pt_token)).toContain(a.ptToken);
  const theirs = await (await api("/api/dash", undefined, b)).json();
  expect(theirs.clients).toEqual([]);
  expect((await api("/api/dash")).status).toBe(401);
  // Another PT can't take over a program that's already on a dashboard.
  expect((await api(`/api/p/${a.ptToken}/claim`, {}, b)).status).toBe(409);
});

it("a client sets a password from their link, then only their own PT can message them", async () => {
  const email = `client-${unique()}@example.com`;
  const { pt, clientToken } = await program(undefined, email);
  expect((await api(`/api/p/${clientToken}/claim`, { password: "short" })).status).toBe(400);
  const claimed = await api(`/api/p/${clientToken}/claim`, { password: "password123" });
  expect(claimed.status).toBe(200);
  const client = cookieOf(claimed);
  const { program: p } = await claimed.json();

  // and can log in with it later
  expect((await api("/api/login", { email, password: "password123" })).status).toBe(200);
  expect((await api("/api/login", { email, password: "wrong-password" })).status).toBe(401);

  expect((await api(`/api/chat/${p.pt_user_id}`, { body: "Is the squat heavy enough?" }, client)).status).toBe(201);
  const thread = await (await api(`/api/chat/${p.client_user_id}`, undefined, pt)).json();
  expect(thread.messages.map((m: { body: string }) => m.body)).toEqual(["Is the squat heavy enough?"]);

  const stranger = await signupPT("Stranger");
  expect((await api(`/api/chat/${p.client_user_id}`, undefined, stranger)).status).toBe(404);
  expect((await api(`/api/chat/${p.client_user_id}`)).status).toBe(404);
  // Nothing a client sees gives away the PT link.
  const me = await (await api("/api/me", undefined, client)).text();
  expect(me).not.toContain("pt_token");
});
