// A QR code for the invite link, made here so the invite token never leaves the
// browser and the app keeps no dependencies (docs/adr/0001-stack.md).
// Byte mode, error correction level M (15% damage), versions 1 to 10, which is
// up to 213 bytes: an invite URL is about 60. Follows ISO/IEC 18004.
// ponytail: versions 1-10 at level M only; extend the two tables to go bigger.

const EC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]; // level M, by version
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

// GF(256) multiply, modulo x^8 + x^4 + x^3 + x^2 + 1.
function mul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

// Reed-Solomon error correction bytes for one block.
function ecc(data, degree) {
  const gen = new Array(degree).fill(0);
  gen[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      gen[j] = mul(gen[j], root);
      if (j + 1 < degree) gen[j] ^= gen[j + 1];
    }
    root = mul(root, 2);
  }
  const rem = new Array(degree).fill(0);
  for (const b of data) {
    const f = b ^ rem.shift();
    rem.push(0);
    gen.forEach((g, i) => { rem[i] ^= mul(g, f); });
  }
  return rem;
}

// Modules left for data and error correction once the fixed patterns are placed.
function rawModules(v) {
  let n = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const a = Math.floor(v / 7) + 2;
    n -= (25 * a - 10) * a - 55;
    if (v >= 7) n -= 36;
  }
  return n;
}

function alignments(v) {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2, size = v * 4 + 17;
  const step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
  const pos = [6];
  for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
  return pos;
}

// Returns the QR code as rows of booleans, true = dark. No quiet zone.
export function qr(text, forceMask = -1) {
  const bytes = [...new TextEncoder().encode(text)];
  let v = 1;
  const dataCap = (v) => Math.floor(rawModules(v) / 8) - EC_PER_BLOCK[v] * BLOCKS[v];
  while (v <= 10 && 4 + (v < 10 ? 8 : 16) + bytes.length * 8 > dataCap(v) * 8) v++;
  if (v > 10) throw new Error("Too long for a QR code here");

  // Data bits: byte mode, length, the bytes, terminator, then pad bytes.
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4);
  put(bytes.length, v < 10 ? 8 : 16);
  for (const b of bytes) put(b, 8);
  const cap = dataCap(v) * 8;
  put(0, Math.min(4, cap - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));

  // Split into blocks, add error correction, interleave.
  const total = Math.floor(rawModules(v) / 8), nb = BLOCKS[v], ec = EC_PER_BLOCK[v];
  const short = nb - (total % nb), shortLen = Math.floor(total / nb);
  const blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const d = data.slice(k, k + shortLen - ec + (i < short ? 0 : 1));
    k += d.length;
    const e = ecc(d, ec);
    if (i < short) d.push(0);
    blocks.push(d.concat(e));
  }
  const codewords = [];
  for (let i = 0; i < blocks[0].length; i++)
    blocks.forEach((b, j) => { if (i !== shortLen - ec || j >= short) codewords.push(b[i]); });

  // Fixed patterns.
  const size = v * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { m[y][x] = dark; fixed[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]])
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
    }
  const al = alignments(v), last = al.length - 1;
  al.forEach((cx, i) => al.forEach((cy, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
      set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  const drawFormat = (mask) => {
    const d = (0 << 3) | mask; // level M is 00
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const f = ((d << 10) | r) ^ 0x5412, bit = (i) => ((f >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat(0); // reserves the area; drawn for real once the mask is picked
  if (v >= 7) {
    let r = v;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const f = (v << 12) | r;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3), b = Math.floor(i / 3), dark = ((f >>> i) & 1) === 1;
      set(a, b, dark); set(b, a, dark);
    }
  }

  // Codewords in the zigzag, two columns at a time from the bottom right.
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if (!fixed[y][x] && i < codewords.length * 8) {
        m[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
        i++;
      }
    }
  }

  const MASKS = [
    (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0, (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const applyMask = (k) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
      if (!fixed[y][x] && MASKS[k](x, y)) m[y][x] = !m[y][x];
  };
  // Try each mask and keep the one the standard scores easiest to scan.
  let best = forceMask, bestScore = Infinity;
  if (best < 0) for (let k = 0; k < 8; k++) {
    applyMask(k); drawFormat(k);
    const s = penalty(m);
    if (s < bestScore) { best = k; bestScore = s; }
    applyMask(k); // XOR again undoes it
  }
  applyMask(best); drawFormat(best);
  return m;
}

// The standard's four penalty rules: long runs, 2x2 blocks, finder look-alikes, dark/light balance.
function penalty(m) {
  const size = m.length;
  let score = 0, dark = 0;
  const lines = [];
  for (let a = 0; a < size; a++) {
    lines.push(m[a].map((b) => (b ? 1 : 0)).join(""));
    lines.push(m.map((r) => (r[a] ? 1 : 0)).join(""));
  }
  for (const line of lines) {
    for (const run of line.match(/0{5,}|1{5,}/g) ?? []) score += run.length - 2;
    const padded = `0000${line}0000`;
    for (let i = 0; i + 11 <= padded.length; i++) {
      const s = padded.slice(i, i + 11);
      if (s === "10111010000" || s === "00001011101") score += 40;
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (m[y][x]) dark++;
    if (x < size - 1 && y < size - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) score += 3;
  }
  return score + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
}

// An SVG with a 4-module quiet zone. Colours come from CSS (.qr in style.css).
export function qrSvg(text) {
  const m = qr(text), n = m.length + 8;
  let d = "";
  m.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
  return `<svg class="qr" viewBox="0 0 ${n} ${n}" role="img" aria-label="QR code for the invite link" shape-rendering="crispEdges"><rect width="${n}" height="${n}" class="qr-bg"/><path d="${d}"/></svg>`;
}
