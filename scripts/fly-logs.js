// Follows the deployed app's logs, like `flyctl logs`, for machines where
// flyctl.exe won't run (Windows Smart App Control blocks it on my laptop).
// Uses Fly's logs API with the app token from mise.local.toml.
//
//   node scripts/fly-logs.js            everything
//   node scripts/fly-logs.js --app      only the app's own lines (who did what)
import { readFileSync } from "node:fs";

const APP = "comp4020-final-ohlai";
const token = process.env.FLY_API_TOKEN ?? readFileSync(new URL("../mise.local.toml", import.meta.url), "utf8").match(/FLY_API_TOKEN\s*=\s*"([^"]+)"/)?.[1];
if (!token) throw new Error("No FLY_API_TOKEN in the environment or mise.local.toml");
const onlyApp = process.argv.includes("--app");

let next = "";
for (;;) {
  try {
    const res = await fetch(`https://api.fly.io/api/v1/apps/${APP}/logs?next_token=${next}`, { headers: { authorization: token } });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const { data, meta } = await res.json();
    for (const { attributes: a } of data) {
      // The app's own lines start with an ISO timestamp; the rest is Fly's machine noise.
      if (onlyApp && !/^\d{4}-\d\d-\d\dT[\d:]+Z /.test(a.message)) continue;
      console.log(onlyApp ? a.message : `${a.timestamp.slice(11, 19)} ${a.message}`);
    }
    next = meta.next_token || next;
  } catch (err) {
    console.error("fetch failed, retrying:", err.message);
  }
  await new Promise((r) => setTimeout(r, 2000));
}
