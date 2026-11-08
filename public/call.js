// Video call between a PT and their client. Any page that imports this rings
// when the other person calls. The server only passes the setup messages
// along (POST /api/call/:id out, "call" events on /api/events back); video and
// sound go straight between the two browsers.
// ponytail: free STUN only, no TURN relay, so some strict networks (some gym
// wifi, some carriers) won't connect. Add a TURN server to ICE if that bites.
import { el } from "/ui.js";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
let pc = null, stream = null, peer = null, offer = null, queued = [];

// Bento layout: the other person's video in its own tile, shown whole
// (nothing on top of it), your camera and the controls in tiles beside it.
const remote = el("video", { autoplay: true, playsInline: true, className: "them" });
const local = el("video", { autoplay: true, playsInline: true, muted: true, className: "self" });
const status = el("p", { className: "call-status", role: "status" });
const answer = el("button", { type: "button", className: "primary", textContent: "Answer" });
const end = el("button", { type: "button", className: "end", textContent: "End" });
const box = el("dialog", { className: "call", ariaLabel: "Video call" },
  el("div", { className: "tile them-tile" }, remote),
  el("div", { className: "call-side" },
    el("div", { className: "tile self-tile" }, local),
    el("div", { className: "tile call-panel" }, status, el("div", { className: "actions" }, answer, end))));
document.body.append(box);

const send = (signal, to = peer) => !to ? Promise.resolve({}) :
  fetch(`/api/call/${to.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ signal }) })
    .then((r) => r.json()).catch(() => ({}));

async function start() {
  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  local.srcObject = stream;
  pc = new RTCPeerConnection({ iceServers: ICE });
  for (const t of stream.getTracks()) pc.addTrack(t, stream);
  pc.onicecandidate = (e) => { if (e.candidate) send({ kind: "ice", candidate: e.candidate }); };
  pc.ontrack = (e) => { remote.srcObject = e.streams[0]; status.textContent = `On a call with ${peer?.name ?? ""}`; };
  pc.onconnectionstatechange = () => {
    if (pc?.connectionState === "failed") status.textContent = "Couldn't connect. One of your networks may block video calls.";
  };
}
async function flush() {
  for (const c of queued.splice(0)) await pc.addIceCandidate(c).catch(() => {});
}

function hangUp(tell) {
  if (!peer) return;
  if (tell) send({ kind: "end" });
  pc?.close();
  stream?.getTracks().forEach((t) => t.stop());
  pc = stream = peer = offer = null;
  queued = [];
  remote.srcObject = local.srcObject = null;
  if (box.open) box.close();
}

export async function call(id, name) {
  if (peer) return;
  peer = { id, name };
  answer.hidden = true;
  status.textContent = `Calling ${name}…`;
  box.showModal();
  try { await start(); } catch { status.textContent = "Allow the camera and microphone to call."; return; }
  await pc.setLocalDescription(await pc.createOffer());
  const { delivered } = await send({ kind: "offer", sdp: pc.localDescription });
  if (!delivered && peer) status.textContent = `${name} doesn't have the app open right now.`;
}

answer.onclick = async () => {
  answer.hidden = true;
  status.textContent = "Connecting…";
  try { await start(); } catch { status.textContent = "Allow the camera and microphone to answer."; return; }
  await pc.setRemoteDescription(offer);
  await flush();
  await pc.setLocalDescription(await pc.createAnswer());
  send({ kind: "answer", sdp: pc.localDescription });
};
end.onclick = () => { hangUp(true); };
box.onclose = () => { hangUp(true); }; // Esc closes the dialog: hang up too

async function onSignal({ from, signal }) {
  if (signal.kind === "offer") {
    if (peer) return; // already in a call
    peer = from;
    offer = signal.sdp;
    answer.hidden = false;
    status.textContent = `${from.name} is calling`;
    box.showModal();
    answer.focus();
    return;
  }
  // The caller's candidates can overtake its offer on the way here; keep them.
  if (signal.kind === "ice" && !peer) return void queued.push(signal.candidate);
  if (from.id !== peer?.id) return;
  if (signal.kind === "end") return hangUp(false);
  if (signal.kind === "answer" && pc) { await pc.setRemoteDescription(signal.sdp); await flush(); }
  // Candidates can arrive before the other side's offer/answer is set; hold them till it is.
  if (signal.kind === "ice") pc?.remoteDescription ? await pc.addIceCandidate(signal.candidate).catch(() => {}) : queued.push(signal.candidate);
}

new EventSource("/api/events").addEventListener("call", (e) => { onSignal(JSON.parse(e.data)); });
