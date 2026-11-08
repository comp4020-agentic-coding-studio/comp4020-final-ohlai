// Video call between a PT and their client. Any page that imports this rings
// when the other person calls. The server only passes the setup messages
// along (POST /api/call/:id out, "call" events on /api/events back); video and
// sound go straight between the two browsers.
// ponytail: free STUN only, no TURN relay, so some strict networks (some gym
// wifi, some carriers) won't connect. Add a TURN server to ICE if that bites.
import { el } from "/ui.js";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];
let pc = null, stream = null, peer = null, offer = null, queued = [];
let caller = false, connectedAt = 0; // the caller posts the "called for x min" stamp

// Floating cards, no backplate: the other person's video, your camera and the
// controls each in their own card. Nothing sits on top of their video.
const remote = el("video", { autoplay: true, playsInline: true, className: "them" });
const local = el("video", { autoplay: true, playsInline: true, muted: true, className: "self" });
const status = el("p", { className: "call-status", role: "status" });
const answer = el("button", { type: "button", className: "primary", textContent: "Answer" });
const end = el("button", { type: "button", className: "end", textContent: "End" });
const themCard = el("div", { className: "callcard" }, remote);
const selfCard = el("div", { className: "callcard" }, local);
const box = el("dialog", { className: "call", ariaLabel: "Video call" },
  themCard,
  el("div", { className: "call-side" },
    selfCard,
    el("div", { className: "callcard call-panel" }, status, el("div", { className: "actions" }, answer, end))));

// Each card takes the exact shape of its video (a phone held upright is tall,
// a laptop camera is wide), as big as fits, so the video fills it edge to edge.
function fit(video, card, maxW, maxH, [dw, dh]) {
  const w = video.videoWidth || dw, h = video.videoHeight || dh;
  const s = Math.min(maxW / w, maxH / h);
  card.style.width = `${Math.round(w * s)}px`;
  card.style.height = `${Math.round(h * s)}px`;
}
function layout() {
  const W = innerWidth, H = innerHeight;
  if (W < 700) { // phone: their video on top, your camera and the controls below
    fit(remote, themCard, W - 24, H * 0.62, [3, 4]);
    fit(local, selfCard, (W - 36) * 0.4, H * 0.26, [3, 4]);
  } else {
    fit(remote, themCard, W - 48 - 262, H - 48, [16, 9]);
    fit(local, selfCard, 250, H * 0.4, [16, 9]);
  }
}
for (const v of [remote, local]) v.addEventListener("resize", layout); // fires when the video's size is known or changes
addEventListener("resize", layout);
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
  pc.ontrack = (e) => {
    remote.srcObject = e.streams[0];
    status.textContent = `On a call with ${peer?.name ?? ""}`;
    connectedAt ||= Date.now();
  };
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
  // Only calls that connected get a stamp, and only from the caller, so there's one per call.
  if (caller && connectedAt) {
    fetch(`/api/chat/${peer.id}`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ call_secs: Math.round((Date.now() - connectedAt) / 1000) }) });
  }
  caller = false; connectedAt = 0;
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
  caller = true;
  answer.hidden = true;
  status.textContent = `Calling ${name}…`;
  layout();
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
    layout();
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
