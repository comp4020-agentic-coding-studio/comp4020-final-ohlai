// Runs one command on the deployed machine, like `flyctl ssh console -C`, for
// machines where flyctl.exe won't run (Windows Smart App Control blocks it on
// my laptop). Uses Fly's Machines API exec with the app token from
// mise.local.toml, the same way scripts/fly-logs.js reads the logs.
//
//   node scripts/fly-exec.js node /app/scripts/seed-jack.js
import { readFileSync } from "node:fs";

const APP = "comp4020-final-ohlai";
const token = process.env.FLY_API_TOKEN ?? readFileSync(new URL("../mise.local.toml", import.meta.url), "utf8").match(/FLY_API_TOKEN\s*=\s*"([^"]+)"/)?.[1];
if (!token) throw new Error("No FLY_API_TOKEN in the environment or mise.local.toml");
const command = process.argv.slice(2);
if (!command.length) throw new Error("Say what to run, e.g. node scripts/fly-exec.js node /app/scripts/seed-jack.js");

const fly = async (path, body) => {
  const res = await fetch(`https://api.machines.dev/v1/apps/${APP}${path}`, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${token.replace(/^Bearer /, "")}`, "content-type": "application/json" },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
};

// One machine on purpose (--ha=false), so the started one is the app.
const machine = (await fly("/machines")).find((m) => m.state === "started");
if (!machine) throw new Error("No started machine. Open the site once to wake it, then try again.");
const out = await fly(`/machines/${machine.id}/exec`, { command, timeout: 60 });
process.stdout.write(out.stdout ?? "");
process.stderr.write(out.stderr ?? "");
process.exitCode = out.exit_code ?? 0;
