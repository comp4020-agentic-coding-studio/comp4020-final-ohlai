import { expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const api = (path: string, body?: unknown) =>
  fetch(new URL(path, baseUrl), body === undefined ? {} : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

async function program() {
  const made = await api("/api/programs", {
    title: "Spec block", pt_name: "PT", client_name: "Client", client_email: "client@example.com",
    exercises: [{ day: "Day 1", name: "Squat", sets: 3, reps: "5" }],
  });
  expect(made.status).toBe(201);
  const { ptToken, clientToken } = await made.json();
  const client = await (await api(`/api/p/${clientToken}`)).json();
  return { ptToken, clientToken, client, exercise_id: client.exercises[0].id };
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

it("rejects a program with no exercises", async () => {
  const res = await api("/api/programs", { title: "x", pt_name: "a", client_name: "b", client_email: "b@x.com", exercises: [] });
  expect(res.status).toBe(400);
});
