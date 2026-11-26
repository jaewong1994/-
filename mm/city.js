// Pages작업본/mm/city.js
import { session as session2, esc as esc2, go as go2, say as say2, events as events2, button as button2, classroom } from "./school.js";

// Pages작업본/mm/followup.js
import { back, button, esc, events, fileLink, go, say, session } from "./school.js";
async function followup(op, data = {}) {
  const result = await session().rpc("mm_followup", { op, data });
  if (result.error) throw Error(result.error.message);
  return result.data;
}

// Pages작업본/mm/art/roof-sign.js
function signFrame(o, scale) {
  const { rx, ry, height } = o.design;
  const left = -rx * 0.92, back2 = -ry * 0.94;
  return { x: o.sx + (left - back2) * scale, y: o.sy + ((left + back2) / 2 - height - 40) * scale, w: rx * 1.83 * scale, h: 15.5 * scale, scale };
}
function onSign(o, scale, x, y) {
  if (!o) return false;
  const f = signFrame(o, scale), u = x - f.x, v = y - f.y - u * 0.5;
  return u >= -scale && u <= f.w + scale && v >= -scale * 1.6 && v <= f.h + scale * 2;
}
function drawSign(c, o, scale, time, lines) {
  const f = signFrame(o, scale), w = f.w / scale, h = f.h / scale;
  c.save();
  c.translate(f.x, f.y);
  c.transform(scale, scale * 0.5, 0, scale, 0, 0);
  for (const x2 of [2, w - 3]) {
    c.fillStyle = "#425556";
    c.fillRect(x2, h - 0.5, 1.3, 3.3);
  }
  c.fillStyle = "#4d6059";
  c.fillRect(-0.65, -0.8, w + 1.3, h + 1.4);
  c.fillStyle = "#142b2a";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#a5b5a1";
  c.fillRect(-0.5, -0.8, w + 0.8, 0.65);
  c.beginPath();
  c.rect(1, 0.7, w - 2, h - 1.4);
  c.clip();
  c.font = 'bold 10.5px "Gmarket Sans", sans-serif';
  c.textAlign = "left";
  c.textBaseline = "middle";
  const words = lines.join("     ◆     ") + "     ◆     ", length = c.measureText(words).width;
  const x = 1 - time * 13 % length;
  c.fillStyle = "#ffdc83";
  c.fillText(words, x, h * 0.55);
  c.fillText(words, x + length, h * 0.55);
  c.restore();
}

// Pages작업본/mm/art/city-buildings.js
var specs = {
  "crown-tower": [[14, 11, 14], [11, 9, 41], [8, 7, 17], [4, 4, 10]],
  "terraced-tower": [[16, 11, 15], [13, 10, 19], [10, 8, 16], [7, 7, 12]],
  "glass-blade": [[15, 8, 9], [12, 6, 47], [9, 4, 8]],
  "garden-slab": [[16, 11, 11], [13, 10, 12], [11, 8, 12], [8, 7, 9]],
  "deco-hall": [[16, 10, 9], [13, 9, 14], [8, 6, 8]],
  "quay-house": [[11, 8, 12], [10, 7, 3]],
  "arcade": [[18, 9, 10], [13, 7, 5]],
  "glasshouse": [[18, 10, 4], [15, 8, 6]],
  "platform": [[20, 7, 4], [17, 5, 5]],
  "terrace-row": [[17, 8, 12], [16, 7, 4]]
};
var materials = {
  blue: ["#668997", "#365d70", "#bfd2cd", "#b4d6d4"],
  stone: ["#b8b399", "#858779", "#e1d9b9", "#5a7778"],
  jade: ["#7e9c91", "#526e6a", "#c3cbb1", "#b8d3bb"],
  brick: ["#bd8c72", "#936c61", "#dab992", "#5c7072"]
};
var cached = /* @__PURE__ */ new Map();
function bitmap(name) {
  const cv = document.createElement("canvas");
  cv.width = 66;
  cv.height = 112;
  const c = cv.getContext("2d");
  c.translate(33, 110);
  const poly = (color, points) => {
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y)));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  };
  const rect2 = (color, x, y, w, h) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const glass = ["glass-blade", "crown-tower", "glasshouse"].includes(name);
  const [sun, dark, cap, win] = materials[glass ? "blue" : name === "terraced-tower" || name === "deco-hall" ? "stone" : name === "garden-slab" || name === "platform" ? "jade" : "brick"];
  const levels = specs[name];
  let top = -12;
  for (const [i, [a, b, h]] of levels.entries()) {
    const f = top + (a + b) * 0.36, l = [-a, top + (b - a) * 0.36], r = [b, top + (a - b) * 0.36], back2 = [b - a, top - (a + b) * 0.36];
    poly(sun, [[0, f], l, [l[0], l[1] - h], [0, f - h]]);
    poly(dark, [[0, f], r, [r[0], r[1] - h], [0, f - h]]);
    for (let z = 3; z < h - 1; z += glass ? 4 : 5) for (const sign of [-1, 1]) {
      const len = sign === -1 ? a : b, roofGarden = name === "garden-slab";
      if (roofGarden || glass && i > 0) {
        poly(sign < 0 ? win : "#88a7a4", [[sign, f - z - 0.5], [sign * (len - 1), f - (len - 1) * 0.72 - z], [sign * (len - 1), f - (len - 1) * 0.72 - z - 1], [sign, f - z - 1.5]]);
      } else for (let q = 2; q < len - 1; q += 4) rect2(sign < 0 ? win : "#405b60", sign * q, f - q * 0.72 - z - 1, 2, 2);
    }
    poly(name === "glasshouse" ? "#a9c8c3" : cap, [[0, f - h], [l[0], l[1] - h], [back2[0], back2[1] - h], [r[0], r[1] - h]]);
    if (name === "garden-slab" || name === "terraced-tower") {
      for (let q = 2; q < a - 1; q += 4) {
        rect2("#5b815d", -q, f - q * 0.72 - h - 2, 3, 2);
        rect2("#95aa70", -q, f - q * 0.72 - h - 3, 2, 1);
      }
    }
    if (i === 0 && ["terrace-row", "arcade", "quay-house"].includes(name)) for (let q = 2; q < a - 1; q += 4) {
      rect2(q % 3 ? "#ead8ae" : "#ac6655", -q, f - q * 0.72 - 5, 4, 2);
      rect2("#444d49", -q + 1, f - q * 0.72 - 3, 2, 3);
    }
    top -= h;
  }
  if (name === "crown-tower") {
    rect2("#536b71", -1, top - 12, 2, 13);
    rect2("#dda872", -1, top - 13, 1, 2);
  } else if (name === "glasshouse" || name === "platform") for (let q = -11; q < 10; q += 4) rect2("#e6e4cd", q, top - 3 - Math.abs(q) * 0.27, 1, 4);
  else {
    rect2("#939686", -4, top - 3, 5, 3);
    rect2("#d3d0b6", -4, top - 4, 5, 1);
  }
  return { cv, native: levels[0][0] + levels[0][1], height: 14 + levels.reduce((n, l) => n + l[2], 0) };
}
function buildingHeight(name) {
  return specs[name] ? (14 + specs[name].reduce((n, l) => n + l[2], 0)) / (specs[name][0][0] + specs[name][0][1]) : null;
}
function drawBuilding(c, name, x, y, width, flip) {
  if (!Object.hasOwn(specs, name)) return false;
  if (!cached.has(name)) cached.set(name, bitmap(name));
  const { cv, native: native2 } = cached.get(name), s = width / native2;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(flip ? -s : s, s);
  c.drawImage(cv, -33, -110);
  c.restore();
  return true;
}

// Pages작업본/mm/art/city-art.js
var base = "/mm/art/assets/pixel-city/";
var tiles = await (await fetch(base + "sprites.json")).json();
var sheet = new Image();
sheet.src = base + "sprites.png";
await sheet.decode();
function tileHeight(name) {
  return buildingHeight(name) ?? (tiles[name] ? tiles[name][3] / tiles[name][2] : 1.08);
}
function tile(c, name, x, y, width, flip = false) {
  if (drawBuilding(c, name, x, y, width, flip)) return;
  if (["linden", "plane", "flowering", "bench", "kiosk", "court-yard", "fountain", "metro"].includes(name)) {
    streetObject(c, name, x, y, width);
    return;
  }
  const r = tiles[name];
  if (!r) return;
  const [sx, sy, w, h] = r, dw = Math.max(1, Math.round(width)), dh = Math.round(dw * h / w);
  c.save();
  c.translate(Math.round(x), Math.round(y));
  if (flip) c.scale(-1, 1);
  c.imageSmoothingEnabled = false;
  c.drawImage(sheet, sx, sy, w, h, -Math.floor(dw / 2), -dh, dw, dh);
  c.restore();
}
function shape(c, color, points) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fill();
}
function line(c, color, width, points) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.stroke();
}
function streetObject(c, name, x, y, w) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(w / 22, w / 22);
  const rect2 = (color, a, b, width, height) => {
    c.fillStyle = color;
    c.fillRect(a, b, width, height);
  };
  if (name === "linden" || name === "plane" || name === "flowering") {
    const pink = name === "flowering", tints = pink ? ["#8d6178", "#be8197", "#dfa8b5", "#f5d1cd"] : name === "plane" ? ["#486a58", "#5b8563", "#77a06f", "#99b783"] : ["#4c694a", "#668c55", "#87aa62", "#a7c17b"];
    rect2("#685c4c", -1, -10, 2, 10);
    line(c, "#736453", 1, [[-3, -9], [0, -5], [3, -10]]);
    for (const [a, b, r] of [[3, -10, 5], [-4, -11, 6], [5, -14, 5], [-2, -16, 6], [1, -18, 4]]) {
      rect2(tints[0], a - r + 1, b - r + 2, 2 * r - 1, 2 * r - 3);
      rect2(tints[1], a - r, b - r + 2, r * 2 - 1, r + 2);
      rect2(tints[2], a - r + 1, b - r + 1, r + 2, r - 1);
      rect2(tints[3], a - r + 2, b - r + 1, 3, 2);
    }
  } else if (name === "bench") {
    shape(c, "#a9ac8e", [[-8, -1], [0, -5], [9, -1], [0, 3]]);
    line(c, "#6b634f", 2, [[-5, -4], [4, -8]]);
    line(c, "#a47b50", 2, [[-5, -6], [4, -10]]);
    rect2("#5d6458", -4, -4, 1, 4);
    rect2("#5d6458", 4, -8, 1, 4);
  } else if (name === "court-yard") {
    shape(c, "#a68268", [[-12, -3], [0, -9], [12, -3], [0, 3]]);
    line(c, "#e8d9b5", 0.8, [[-10, -3], [0, -8], [10, -3], [0, 2], [-10, -3]]);
    line(c, "#ede0c6", 0.8, [[-5, -5.5], [5, -0.5]]);
    line(c, "#68736b", 1, [[9, -4], [9, -11], [6, -11]]);
  } else if (name === "kiosk") {
    rect2("#68756c", -6, -8, 2, 8);
    rect2("#68756c", 5, -7, 2, 5);
    shape(c, "#507e81", [[-10, -9], [0, -14], [10, -9], [0, -4]]);
    line(c, "#a7c7b9", 1, [[-10, -9], [0, -4], [10, -9]]);
  } else if (name === "fountain") {
    shape(c, "#999c87", [[-11, -3], [0, -8], [11, -3], [0, 3]]);
    shape(c, "#87b9bb", [[-8, -3], [0, -6], [8, -3], [0, 1]]);
    rect2("#d0e9df", -1, -11, 2, 8);
    rect2("#b2d8cf", -4, -8, 2, 2);
    rect2("#b2d8cf", 3, -8, 2, 2);
  } else {
    shape(c, "#506c6c", [[-10, -3], [4, -10], [10, -7], [-4, 0]]);
    shape(c, "#d1d0b6", [[-10, -7], [4, -14], [10, -11], [-4, -4]]);
    shape(c, "#73a4a1", [[-4, -4], [10, -11], [10, -7], [-4, 0]]);
    for (let i = 0; i < 3; i++) rect2("#395761", -2 + 4 * i, -4 - 2 * i, 2, 2);
  }
  c.restore();
}
var costumes = [
  [".........rrr....", "........rGGr....", "........rEEr....", ".......rrGrr..GG", ".....rrRGGrRRRGG", "....rRCRRRr.....", "...rrRRrrrrG....", "..rRRR..rrGG....", ".rrr..rRr.......", "GG...rRG........", "TT...GG.........", ".T...TT........."],
  ["...........rr...", "..........rGG...", ".....rrr..rr....", "....rEER.rr.....", "....rRRRrr......", "..rrrRDRr.......", ".rr.rRRR........", ".r..rDDD........", "...DD..DD.......", "..DD....DD......", "..rr....rrr....."]
];
var ink = { r: "#822e37", R: "#ce4543", G: "#f6c875", E: "#d7f6ee", C: "#b1fff1", D: "#375675", T: "#96d9d2" };
function hero(c, style) {
  const rows = costumes[style];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = ink[row[x]];
      if (color) {
        c.fillStyle = color;
        c.fillRect(x - 7, y - 6, 1, 1);
      }
    }
  });
}
function drawPatrol(c, x, y, scale, right, time) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale((right ? 1 : -1) * scale, scale);
  c.fillStyle = Math.floor(time * 6) % 2 ? "#8adaed" : "#f1da88";
  c.fillRect(-9, 3, 2.5, 1);
  c.fillRect(-7, 5, 2, 1);
  hero(c, 0);
  c.restore();
}
function skyRoute(landmarks, scale) {
  if (!landmarks.length) return null;
  const candidates = landmarks.map((o) => [o.sx, o.sy - (o.gift ? 69 : o.design.height + 14) * scale]);
  const center = candidates.reduce((v, p) => [v[0] + p[0] / candidates.length, v[1] + p[1] / candidates.length], [0, 0]);
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4, dx = Math.cos(angle), dy = Math.sin(angle);
    const score = (p2) => (p2[0] - center[0]) * dx + (p2[1] - center[1]) * dy;
    const p = candidates.reduce((a, b) => score(a) > score(b) ? a : b);
    points.push([Math.max(15, Math.min(1425, p[0] + dx * 18 * scale)), Math.max(15, Math.min(809, p[1] + dy * 12 * scale))]);
  }
  const path = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[(i + 7) % 8], b = points[i], d = points[(i + 1) % 8];
    for (let k = 0; k < 9; k++) {
      const t = k / 9;
      path.push(b.map((v, j) => (1 - t) ** 2 * (a[j] + v) / 2 + 2 * (1 - t) * t * v + t * t * (v + d[j]) / 2));
    }
  }
  let length = 0;
  const ends = path.map((p, i) => {
    const q = path[(i + 1) % path.length];
    length += Math.hypot(q[0] - p[0], q[1] - p[1]);
    return length;
  });
  return { path, ends, length };
}
function patrolPose(route, scale, time) {
  const distance2 = time * 22 * scale % route.length;
  const i = route.ends.findIndex((end) => end > distance2), j = Math.max(0, i), a = route.path[j], b = route.path[(j + 1) % route.path.length];
  const start = j ? route.ends[j - 1] : 0, f = (distance2 - start) / Math.max(1e-4, route.ends[j] - start);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + Math.sin(time * 1.6) * scale, b[0] >= a[0]];
}
function cityVisitor(c, style, x, y, scale, time, offset) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const t = time * 0.8 + offset;
  if (style === 0 || style === 1 || style === 4) {
    const dx = Math.round(Math.sin(t) * (style === 0 ? 34 : 22)), dy = Math.round((style === 1 ? -36 : -47) + Math.cos(t * 2) * (style === 0 ? 9 : 6));
    if (style === 1) line(c, "#e9eee4", 1, [[8, -56], [dx, dy]]);
    c.translate(dx, dy);
    if (style === 0 || style === 1) c.scale(1.35, 1.35);
    if (Math.cos(t) < 0) c.scale(-1, 1);
    if (style === 4) {
      line(c, "#405552", 1, [[-9, -3], [8, -3]]);
      c.fillStyle = "#ba594d";
      c.fillRect(-4, -1, 9, 4);
      c.fillStyle = "#dbe5d5";
      c.fillRect(3, -1, 3, 2);
      c.fillRect(-8, -2, 5, 1);
    } else {
      hero(c, style);
    }
  } else if (style === 2) {
    const dx = Math.round(Math.cos(t) * 13), dy = Math.round(-37 + Math.sin(t) * 6);
    c.fillStyle = "#e9be70";
    c.fillRect(dx, dy, 3, 2);
    c.fillStyle = "#536f90";
    c.fillRect(dx - 3, dy, 2, 1);
    c.fillRect(dx + 4, dy, 2, 1);
  } else {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i % 2 ? "#ecb163" : "#e6cdbc";
      c.fillRect(Math.round(Math.cos(t + i * 2) * 12), Math.round(-22 + Math.sin(t * 1.4 + i) * 5), 2, 2);
    }
  }
  c.restore();
}

// Pages작업본/mm/art/metropolis.js
var quarters = [
  {
    id: "station",
    name: "중앙역 상권",
    description: "역 앞 시장길에서 오피스와 주상복합으로 이어져요.",
    rows: [[0, 0, "T"], [0, 1, "S"], [1, 0, "S"], [1, 1, "O"], [0, -1, "S"], [1, -1, "H"], [2, 0, "O"], [2, 1, "H"], [2, -1, "S"], [3, 0, "T"], [3, -1, "H"], [3, 1, "H"], [1, 2, "P"], [2, 2, "H"]]
  },
  {
    id: "campus",
    name: "대학로 문화지구",
    description: "공연 광장 양옆에 대학 도서관과 카페, 운동장이 있어요.",
    rows: [[0, 0, "Q"], [1, 0, "C"], [0, 1, "S"], [1, 1, "C"], [0, -1, "S"], [1, -1, "P"], [2, 0, "A"], [2, 1, "H"], [1, 2, "C"], [2, 2, "H"], [0, 2, "H"], [1, -2, "H"], [2, -1, "P"], [2, 3, "H"]]
  },
  {
    id: "gardens",
    name: "가로수 주택가",
    description: "낮은 연립주택 사이로 녹지와 학교를 잇는 산책로가 나 있어요.",
    rows: [[0, 0, "P"], [0, 1, "H"], [1, 0, "H"], [1, 1, "P"], [1, -1, "H"], [0, -1, "H"], [1, 2, "H"], [2, 1, "C"], [2, 2, "H"], [0, 2, "S"], [2, 0, "H"], [2, -1, "H"], [2, 3, "P"], [1, 3, "H"]]
  },
  {
    id: "works",
    name: "창고·제조 지구",
    description: "공방과 완충녹지 너머에 공장, 창고와 물류 도로가 모여 있어요.",
    rows: [[0, 0, "S"], [1, 0, "P"], [0, 1, "H"], [1, 1, "C"], [2, 0, "I"], [2, 1, "I"], [2, -1, "I"], [1, -1, "P"], [3, 0, "I"], [3, 1, "I"], [3, -1, "I"], [2, 2, "T"], [4, 0, "I"], [3, 2, "S"]]
  }
];
var axes = [[1, 0], [0, 1], [-1, 0], [0, -1]];
var key = (x, y) => x + "," + y;
function extendCity(plan, established, random2, hash2) {
  const occupied = new Map(established.map((b) => [key(b[0], b[1]), b]));
  const seed = plan.blocks[0][3], turn = Math.floor(random2(seed, "borough-axis") * 4);
  const total = established.length * 2, added = [], districts2 = [];
  for (const [i, district] of quarters.entries()) {
    const n = Math.floor(total / 4) + (i < total % 4 ? 1 : 0), parts = district.rows.slice(0, n);
    let best = null;
    for (const parent of occupied.values()) for (const [j, [dx, dy]] of axes.entries()) {
      const bx = parent[0] + dx, by = parent[1] + dy;
      for (const hand of [-1, 1]) {
        const cells = parts.map(([a, b, z]) => [bx + a * dx - b * dy * hand, by + a * dy + b * dx * hand, z]);
        if (cells.some(([x, y]) => occupied.has(key(x, y)))) continue;
        let contact = 0, radius = 0;
        for (const [x, y] of cells) {
          radius += x * x + y * y;
          contact += axes.filter(([ax, ay]) => occupied.has(key(x + ax, y + ay))).length;
        }
        const side = (turn + i) % 4, alignment = j === side ? 8 : (j + 2) % 4 === side ? -7 : 0;
        const score = alignment + Math.min(9, contact) * 1.05 - radius / n * 0.19 + (parent[5] ? -3 : 1) + random2(seed, [i, bx, by, j, hand].join("/"));
        if (!best || score > best.score) best = { cells, score, parent };
      }
    }
    const inherited = best.parent[4] ?? plan.blocks.indexOf(best.parent) + 1;
    const parcels = best.cells.map(([x, y, z], j) => [x, y, z, hash2([seed, district.id, x, y].join("/")), Math.max(inherited, Math.min(14, 5 + Math.floor((j + i * 0.55) * 9 / n))), district.id]);
    for (const b of parcels) {
      occupied.set(key(b[0], b[1]), b);
      added.push(b);
    }
    const hub = parcels[i === 3 ? 4 : 0];
    districts2.push({ id: district.id, name: district.name, description: district.description, hub });
  }
  return { added, districts: districts2 };
}

// Pages작업본/mm/art/city-form.js
var profiles = {
  river: { x: 1.35, y: 1.18, long: "x" },
  rail: { x: 1.13, y: 1.54, long: "y" },
  park: { x: 1.7, y: 1.02, long: "x" },
  court: { x: 1.28, y: 1.28, long: "y" },
  canal: { x: 1.16, y: 1.42, long: "y" },
  garden: { x: 1.45, y: 1.24, long: "x" }
};
var key2 = (x, y) => x + "," + y;
function hash(s) {
  let h = 2166136261;
  for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function random(seed, label2) {
  let a = hash(seed + "|" + label2);
  a = Math.imul(a ^ a >>> 16, 2246822507);
  a = Math.imul(a ^ a >>> 13, 3266489909);
  return ((a ^ a >>> 16) >>> 0) / 4294967296;
}
var builtPlans = /* @__PURE__ */ new WeakMap();
function urbanPlan(plan) {
  if (builtPlans.has(plan)) return builtPlans.get(plan);
  const core = plan.blocks, seed = core[0][3], occupied = new Map(core.map((b) => [key2(b[0], b[1]), b]));
  const extras = [], directions2 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const horizontal = ["river", "park", "garden"].includes(plan.feature);
  const sign = random(seed, "expansion-shore") < 0.5 ? -1 : 1;
  const count = 10 + Math.floor(random(seed, "annex-count") * 4);
  for (let i = 0; i < count; i++) {
    const candidates = /* @__PURE__ */ new Map();
    for (const parcel of occupied.values()) for (const [dx, dy] of directions2) {
      const x2 = parcel[0] + dx, y2 = parcel[1] + dy, k = key2(x2, y2);
      if (!occupied.has(k)) candidates.set(k, [x2, y2]);
    }
    const ranked = [...candidates.values()].map(([x2, y2]) => {
      const touching2 = directions2.map(([dx, dy]) => occupied.get(key2(x2 + dx, y2 + dy))).filter(Boolean);
      const parents = touching2.filter((b) => b.length === 4);
      const along = horizontal ? x2 : y2, across = horizontal ? y2 : x2;
      const radius = Math.abs(along) * 0.86 + Math.abs(across) * 1.1;
      const branch = i % 4 < 2 ? along * sign * 0.53 : -across * sign * 0.49;
      const score = 0.74 * Math.min(touching2.length, 2) - radius * 0.33 + branch + random(seed, "fringe-" + Math.floor(i / 3) + "/" + key2(x2, y2)) * 1.7 + (parents.length ? 0.39 : 0) - (touching2.length === 4 ? 0.8 : 0);
      return { x: x2, y: y2, touching: touching2, score };
    }).sort((a, b) => b.score - a.score || a.x - b.x || a.y - b.y);
    const { x, y, touching } = ranked[0], touch = touching[0], parent = touch.length === 4 ? core.indexOf(touch) + 1 : touch[4];
    const unlock = Math.max(4 + Math.floor(i * 10 / count), parent);
    const palette = ["H", "S", "H", "P", "H", "C"];
    const zone = i === 1 ? "A" : i === 3 ? "I" : i === 7 ? plan.feature === "rail" ? "T" : "O" : palette[Math.floor(random(seed, "satellite" + i) * palette.length)];
    const cell = [x, y, zone, hash(seed + "/annex/" + key2(x, y)), unlock];
    occupied.set(key2(x, y), cell);
    extras.push(cell);
  }
  const established = [...core, ...extras], { added, districts: districts2 } = extendCity(plan, established, random, hash);
  const city2 = { ...plan, blocks: [...established, ...added], extras: [...extras, ...added], districts: districts2 };
  builtPlans.set(plan, city2);
  return city2;
}
var growthHours = [0, 6, 30, 85, 160, 240];
var coreLimits = [1, 3, 5, 8, 11, 14];
var schedules = /* @__PURE__ */ new WeakMap();
function development(plan, hours) {
  const full = urbanPlan(plan);
  if (!schedules.has(plan)) {
    const ordered = [{ cell: plan.blocks[0], at: 0 }], seen = /* @__PURE__ */ new Set([plan.blocks[0]]);
    for (let i = 1; i < growthHours.length; i++) {
      const open = full.blocks.filter((c, j) => !seen.has(c) && (c[4] ?? j + 1) <= coreLimits[i]).sort((a, b) => (a[4] ?? plan.blocks.indexOf(a) + 1) - (b[4] ?? plan.blocks.indexOf(b) + 1));
      const size = open.length;
      for (let j = 0; j < size; j++) {
        const adjacent = (c) => ordered.some((o) => Math.abs(c[0] - o.cell[0]) + Math.abs(c[1] - o.cell[1]) === 1);
        const idx = open.findIndex((c) => adjacent(c) && (!plan.blocks.includes(c) || !open.some((d) => plan.blocks.includes(d) && plan.blocks.indexOf(d) < plan.blocks.indexOf(c))));
        const [cell] = open.splice(Math.max(0, idx), 1);
        seen.add(cell);
        ordered.push({ cell, at: growthHours[i - 1] + (growthHours[i] - growthHours[i - 1]) * (j + 1) / size });
      }
    }
    schedules.set(plan, ordered);
  }
  const order = schedules.get(plan), eligible = new Set(order.filter((p) => p.at <= hours).map((p) => p.cell));
  return { cells: full.blocks.filter((c) => eligible.has(c)), blocks: plan.blocks.filter((c) => eligible.has(c)), next: order.find((p) => p.at > hours) };
}
function cityForm(plan) {
  const seed = plan.blocks[0][3], profile = profiles[plan.feature];
  const unitX = 20 * profile.x * (0.96 + 0.08 * random(seed, "width")), unitY = 20 * profile.y * (0.96 + 0.08 * random(seed, "depth"));
  const waterAxis = plan.feature === "river" ? "y" : plan.feature === "canal" ? "x" : null;
  const waterLine = waterAxis === "y" ? plan.axisY : plan.axisX;
  const landmarkDistrict = plan.blocks.findIndex((b) => b[2] === "O");
  const center = plan.blocks[landmarkDistrict < 0 ? Math.floor(plan.blocks.length / 2) : landmarkDistrict];
  const bridgeSites = /* @__PURE__ */ new Set();
  let mainBridge = null;
  if (waterAxis) {
    const banks = /* @__PURE__ */ new Map();
    plan.blocks.forEach(([x, y, , , unlock], i) => {
      const across = (waterAxis === "x" ? x : y) * 4, along = (waterAxis === "x" ? y : x) * 4;
      if (across !== waterLine && across + 4 !== waterLine) return;
      for (const site of [along, along + 4]) {
        if (!banks.has(site)) banks.set(site, [Infinity, Infinity]);
        const times = banks.get(site), side = across === waterLine ? 1 : 0;
        times[side] = Math.min(times[side], unlock || i + 1);
      }
    });
    const centerline = (waterAxis === "x" ? center[1] : center[0]) * 4;
    const candidates = [...banks].filter(([, pair]) => pair.every(Number.isFinite)).sort((a, b) => Math.max(...a[1]) - Math.max(...b[1]) || Math.abs(a[0] - centerline) - Math.abs(b[0] - centerline) || a[0] - b[0]);
    for (const [site] of candidates) if ([...bridgeSites].every((v) => Math.abs(v - site) >= 8)) bridgeSites.add(site);
    mainBridge = [...bridgeSites].sort((a, b) => Math.abs(a - centerline) - Math.abs(b - centerline))[0];
  }
  const byCell = new Map(plan.blocks.map((b) => [key2(b[0], b[1]), b]));
  function ground(x, y) {
    const u = x * unitX, v = y * unitY;
    return [u - v, (u + v) / 2];
  }
  function streetKind(a, b) {
    const horizontal = a.y === b.y, along = horizontal ? "x" : "y", lane = horizontal ? a.y : a.x;
    const low2 = Math.min(horizontal ? a.x : a.y, horizontal ? b.x : b.y);
    if (lane % 4 !== 0) return "lane";
    const k = lane / 4, i = Math.floor(low2 / 4);
    const left = byCell.get(horizontal ? key2(i, k - 1) : key2(k - 1, i));
    const right = byCell.get(horizontal ? key2(i, k) : key2(k, i));
    if (left && right && left[5] !== right[5] && (left[5] || right[5])) return "avenue";
    if (left && right && (left[5] === "station" || right[5] === "station") && along === profile.long) return "avenue";
    if (left && right) {
      if (left[2] === "P" && right[2] === "P") return "greenway";
      if (left[2] === "C" && right[2] === "P" || left[2] === "P" && right[2] === "C") return "greenway";
      if (left[2] === "S" && right[2] === "S") return "market";
    }
    const primary = (horizontal ? center[1] : center[0]) * 4;
    if (lane === primary) return along === profile.long ? "boulevard" : "avenue";
    if (left && right && (left[2] === "P" || right[2] === "P") && plan.feature === "garden") return "greenway";
    if (left && right && left[2] === "H" && right[2] === "H") return "lane";
    return left && right ? "street" : "local";
  }
  return { ground, unitX, unitY, waterAxis, waterLine, landmarkDistrict, byCell, streetKind, bridgeSites, mainBridge };
}
function cityCamera(blocks, form, w, h, objects, aspect) {
  const bounds = [];
  for (const [bx, by] of blocks) for (let i = 0; i <= 4; i++) {
    const x = 4 * bx, y = 4 * by;
    bounds.push(form.ground(x + i, y), form.ground(x + i, y + 4), form.ground(x, y + i), form.ground(x + 4, y + i));
  }
  for (const o of objects) {
    const [x, y] = form.ground(o.t.x, o.t.y), reserved = o.lot !== void 0;
    const ordinary = o.ordinaryWidth, sky = o.design ? o.design.sky + 10 : ordinary * (aspect(o.id) + 0.12);
    const height = reserved ? Math.max(o.id === "fair" || o.id === "fair-square" ? 86 : 194, sky) : sky, wide = reserved ? Math.max(80, ordinary) : ordinary;
    bounds.push([x - wide * 0.69, y - height], [x + wide * 0.69, y + wide * 0.2]);
  }
  const xx = bounds.map((p) => p[0]), yy = bounds.map((p) => p[1]), x0 = Math.min(...xx), x1 = Math.max(...xx), y0 = Math.min(...yy), y1 = Math.max(...yy);
  const scale = Math.min(2.1 * w / 896, (w - 46) / Math.max(1, x1 - x0), (h - 36) / Math.max(1, y1 - y0));
  const ox = (w - (x1 + x0) * scale) / 2, oy = (h - (y1 + y0) * scale) / 2;
  return { scale, project: (x, y) => {
    const [u, v] = form.ground(x, y);
    return [Math.round(ox + u * scale), Math.round(oy + v * scale)];
  } };
}
function streetsFor(blocks, form) {
  const nodes = /* @__PURE__ */ new Map(), edges = /* @__PURE__ */ new Map();
  function node(x, y) {
    const id = key2(x, y);
    if (!nodes.has(id)) nodes.set(id, { x, y, exits: /* @__PURE__ */ new Set() });
    return nodes.get(id);
  }
  function segment(x, y, u, v, kind) {
    const dx = Math.sign(u - x), dy = Math.sign(v - y);
    while (x !== u || y !== v) {
      const a = node(x, y), b = node(x + dx, y + dy), ids = [key2(a.x, a.y), key2(b.x, b.y)].sort();
      const crosses = form.waterAxis === "y" ? a.y === form.waterLine && b.y === form.waterLine : form.waterAxis === "x" && a.x === form.waterLine && b.x === form.waterLine;
      const bridge = form.waterAxis === "y" ? a.y === form.waterLine || b.y === form.waterLine : form.waterAxis === "x" && (a.x === form.waterLine || b.x === form.waterLine);
      const alongBank = form.waterAxis === "y" ? a.x : a.y;
      if (!crosses && (!bridge || form.bridgeSites.has(alongBank))) edges.set(ids.join("/"), { a, b, kind: kind || form.streetKind(a, b), bridge });
      x += dx;
      y += dy;
    }
  }
  for (const [bx, by, zone, v] of blocks) {
    const x = bx * 4, y = by * 4;
    segment(x, y, x + 4, y);
    segment(x, y + 4, x + 4, y + 4);
    segment(x, y, x, y + 4);
    segment(x + 4, y, x + 4, y + 4);
    if (zone === "H" || zone === "S") {
      const side = v % 2 ? 0 : 4;
      segment(x + side, y + 2, x + 2, y + 2, "lane");
      if (zone === "S") segment(x + 2, y + 2, x + 4 - side, y + 2, "market");
      else segment(x + 2, y + 2, x + 2, y + (v % 3 ? 4 : 0), "walk");
    } else if (zone === "O") {
      const side = v % 2 ? 4 : 0;
      segment(x + side, y + 2, x + 2, y + 2, "walk");
      segment(x + 2, y + 2, x + 2, y + 4, "walk");
    } else if (zone === "C" || zone === "T" || zone === "Q") {
      segment(x + 2, y, x + 2, y + 4, "walk");
    } else if (zone === "P") {
      segment(x, y + 2, x + 4, y + 2, "walk");
      segment(x + 2, y, x + 2, y + 2, "walk");
    }
  }
  const waterNodes = /* @__PURE__ */ new Map();
  for (const edge of edges.values()) if (edge.bridge) {
    for (const n of [edge.a, edge.b]) if ((form.waterAxis === "y" ? n.y : n.x) === form.waterLine) waterNodes.set(n, (waterNodes.get(n) || 0) + 1);
  }
  const segments = [];
  for (const edge of edges.values()) {
    if (edge.bridge && (waterNodes.get(edge.a) === 1 || waterNodes.get(edge.b) === 1)) continue;
    edge.a.exits.add(key2(edge.b.x, edge.b.y));
    edge.b.exits.add(key2(edge.a.x, edge.a.y));
    segments.push(edge);
  }
  return { roads: [...nodes.values()].filter((n) => n.exits.size), segments };
}

// Pages작업본/mm/art/city-hours.js
var periods = {
  dawn: { label: "새벽", from: 0, shade: [24, 29, 79, 0.75], surface: 0.38, tint: [15, 23, 50], people: 0.17, traffic: 0.13, lamps: 0.82, windows: { H: 0.13, S: 0.06, O: 0.08, C: 0.06, P: 0.02, T: 0.23, I: 0.13 } },
  morning: { label: "아침", from: 5, shade: [245, 181, 117, 0.18], surface: 0.88, tint: [248, 203, 161], people: 0.83, traffic: 1, lamps: 0.12, windows: { H: 0.22, S: 0.18, O: 0.18, C: 0.14, P: 0.03, T: 0.3, I: 0.18 } },
  day: { label: "낮", from: 9, shade: [0, 0, 0, 0], surface: 1, tint: [0, 0, 0], people: 1, traffic: 0.62, lamps: 0, windows: { H: 0.015, S: 0.04, O: 0.025, C: 0.02, P: 0, T: 0.04, I: 0 } },
  evening: { label: "저녁", from: 17, shade: [125, 74, 98, 0.39], surface: 0.67, tint: [122, 75, 96], people: 0.92, traffic: 0.9, lamps: 0.7, windows: { H: 0.56, S: 0.85, O: 0.42, C: 0.26, P: 0.68, T: 0.66, I: 0.32 } },
  night: { label: "밤", from: 20, shade: [13, 19, 48, 0.86], surface: 0.32, tint: [18, 30, 61], people: 0.34, traffic: 0.27, lamps: 1, windows: { H: 0.65, S: 0.42, O: 0.19, C: 0.13, P: 0.66, T: 0.49, I: 0.21 } }
};
function koreanPeriod(date = /* @__PURE__ */ new Date()) {
  const hour = (date.getUTCHours() + 9) % 24;
  return hour < 5 ? "dawn" : hour < 9 ? "morning" : hour < 17 ? "day" : hour < 20 ? "evening" : "night";
}
var visits = {
  dawn: { H: 4, S: 1, O: 1, C: 0, P: 0, T: 2, I: 3 },
  morning: { H: 1, S: 2, O: 4, C: 4, P: 1, T: 5, I: 2 },
  day: { H: 1, S: 3, O: 3, C: 3, P: 4, T: 2, I: 1 },
  evening: { H: 3, S: 5, O: 1, C: 1, P: 4, T: 4, I: 1 },
  night: { H: 4, S: 2, O: 0, C: 0, P: 1, T: 2, I: 1 }
};
function destinations(objects, period) {
  const result = [];
  for (const o of objects) {
    const zone = o.id === "academy" || o.id === "school" ? "C" : o.design?.zone || (o.id === "fair" || ["rest", "exercise", "feed"].includes(o.act) ? "P" : o.act === "shop" ? "S" : null);
    if (!zone || !o.act && !["H", "O", "T", "I"].includes(zone)) continue;
    const weight = visits[period][zone] || 0;
    if (weight || o.act === "feed" || o.act === "exercise") result.push({ t: o.t, act: o.act || (zone === "O" || zone === "I" ? "work" : "rest"), weight: weight || 1 });
  }
  return result;
}
var cache = /* @__PURE__ */ new Map();
function surface(color, period) {
  if (period === "day") return color;
  const key4 = period + color;
  if (cache.has(key4)) return cache.get(key4);
  const { surface: k, tint } = periods[period], n = parseInt(color.slice(1), 16);
  const rgb = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v, i) => Math.round(v * k + tint[i] * (1 - k)));
  const out = "rgb(" + rgb.join(",") + ")";
  cache.set(key4, out);
  return out;
}

// Pages작업본/mm/art/city-activity.js
var drivable = /* @__PURE__ */ new Set(["boulevard", "avenue", "street", "local"]);
function trips(network, stage, seed) {
  if (stage < 3) return [];
  const neighbours = /* @__PURE__ */ new Map(), tags = /* @__PURE__ */ new Map();
  for (const { a, b, kind } of network.segments) if (drivable.has(kind)) {
    if (!neighbours.has(a)) neighbours.set(a, []);
    if (!neighbours.has(b)) neighbours.set(b, []);
    neighbours.get(a).push(b);
    neighbours.get(b).push(a);
    if (kind === "boulevard" || kind === "avenue") tags.set(a, true);
  }
  const starts = [...tags.keys()];
  if (!starts.length) return [];
  const result = [];
  for (let i = 0; i < [0, 0, 0, 6, 11, 17][stage]; i++) {
    const start = starts[Math.floor(random(seed, "car-start" + i) * starts.length)], visited = /* @__PURE__ */ new Map([[start, null]]), queue = [start];
    for (let j = 0; j < queue.length; j++) for (const b of neighbours.get(queue[j])) if (!visited.has(b)) {
      visited.set(b, queue[j]);
      queue.push(b);
    }
    const far = queue.slice(Math.max(1, Math.floor(queue.length * 0.46)));
    if (!far.length) continue;
    const dest = far[Math.floor(random(seed, "car-end" + i) * far.length)], out = [];
    for (let a = dest; a; a = visited.get(a)) out.unshift(a);
    const used = new Set(out.slice(1).map((a, k) => [key2(a.x, a.y), key2(out[k].x, out[k].y)].sort().join("/")));
    const back2 = /* @__PURE__ */ new Map([[dest, null]]), search = [dest];
    for (let j = 0; j < search.length && !back2.has(start); j++) for (const b of neighbours.get(search[j])) {
      const a = search[j], id = [key2(a.x, a.y), key2(b.x, b.y)].sort().join("/");
      if (used.has(id) || back2.has(b)) continue;
      back2.set(b, a);
      search.push(b);
    }
    let ret = out.slice(1, -1).reverse();
    if (back2.has(start)) {
      ret = [];
      for (let a = back2.get(start); a && a !== dest; a = back2.get(a)) ret.unshift(a);
    }
    const route = [...out, ...ret];
    result.push({ route, offset: random(seed, "car-pos" + i) * route.length, speed: 0.8 + random(seed, "pace" + i) * 0.58, paint: i % 7 });
  }
  return result;
}
function carPose(trip, time) {
  const { route } = trip, v = (time * trip.speed + trip.offset) % route.length, i = Math.floor(v), t = v - i, a = route[i], b = route[(i + 1) % route.length];
  const dx = b.x - a.x, dy = b.y - a.y;
  return { x: a.x + dx * t - dy * 0.071, y: a.y + dy * t + dx * 0.071, dx, dy };
}
function car(c, x, y, s, p, index, period) {
  const [dx, dy] = [p.dx, p.dy], col = ["#c9554c", "#f0dbbb", "#7796ac", "#507e7e", "#d4a64d", "#8888a0", "#dfdfd2"][index];
  const point = (u, v, h = 0) => {
    const a = dx * u - dy * v, b = dy * u + dx * v;
    return [x + (a - b) * s, y + ((a + b) * 0.5 - h) * s];
  };
  const panel = (color, pts) => shape(c, surface(color, period), pts.map((q) => point(...q)));
  panel("#45545c", [[-3, -1.55, 0], [3.6, -1.55, 0], [3.6, 1.55, 0], [-3, 1.55, 0]]);
  for (const side of [-1, 1]) panel(col, [[-3, side * 1.5, 0.4], [3.6, side * 1.5, 0.4], [3.6, side * 1.5, 1.7], [-3, side * 1.5, 1.7]]);
  panel(col, [[-3, -1.55, 1.8], [3.6, -1.55, 1.8], [3.6, 1.55, 1.8], [-3, 1.55, 1.8]]);
  panel("#7498a9", [[-1.9, -1.3, 2], [-1.2, -1, 3.2], [0.8, -1, 3.2], [1.65, -1.3, 2], [1.65, 1.3, 2], [0.8, 1, 3.2], [-1.2, 1, 3.2], [-1.9, 1.3, 2]]);
  panel(col, [[-1.3, -1, 3.3], [0.8, -1, 3.3], [0.8, 1, 3.3], [-1.3, 1, 3.3]]);
  for (const v of [-0.95, 0.95]) {
    const [xx, yy] = point(3.65, v, 1);
    c.fillStyle = periods[period].lamps > 0.4 ? "#fff0aa" : "#d4cfb7";
    c.fillRect(xx, yy, Math.max(1, s * 1.2), Math.max(1, s));
  }
}
function furniture(network, form, seed) {
  const out = [], seen = /* @__PURE__ */ new Set();
  for (const { a, b, kind, bridge } of network.segments) {
    if (bridge || !["boulevard", "avenue", "street", "market", "greenway"].includes(kind) || (a.x + a.y) % 3 !== 0) continue;
    const tag = key2(a.x, a.y);
    if (seen.has(tag)) continue;
    seen.add(tag);
    const side = random(seed, "lamp" + tag) < 0.5 ? -0.22 : 0.22, dx = b.x - a.x, dy = b.y - a.y, x = a.x + dx * 0.48 - dy * side, y = a.y + dy * 0.48 + dx * side;
    if (form.waterAxis && Math.abs((form.waterAxis === "x" ? x : y) - form.waterLine) < 0.77) continue;
    out.push({ id: "streetlamp", t: { x, y }, w: 7, ordinaryWidth: 7, lamp: kind === "market" ? "shop" : "street", background: true });
  }
  return out;
}
function lamp(c, x, y, s, period) {
  const level = periods[period].lamps, tip = [x + 2 * s, y - 8 * s];
  line(c, surface("#566475", period), 1.1 * s, [[x, y], [x, y - 7 * s], tip]);
  c.fillStyle = level > 0.4 ? "#ffe79a" : surface("#e6d6ac", period);
  c.fillRect(tip[0], tip[1], 2 * s, 1.3 * s);
  if (level > 0.4) {
    c.fillStyle = "rgba(255,214,113," + level * 0.18 + ")";
    c.fillRect(tip[0] - s, tip[1] - s, 4 * s, 3 * s);
  }
}
function fair(c, x, y, s, time, period) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(s, s);
  const lit = periods[period].lamps > 0.4 && period !== "dawn", color = (h) => surface(h, period);
  const poly = (h, p) => shape(c, color(h), p), stroke = (h, w, p) => line(c, color(h), w, p);
  const box = (h, a, b, w, d, on = false) => {
    c.fillStyle = on ? h : color(h);
    c.fillRect(Math.round(a), Math.round(b), w, d);
  };
  poly("#cfc6a1", [[-36, -2], [-4, -17], [35, 0], [4, 15]]);
  poly("#73966b", [[-34, -2], [-22, -8], [-9, -2], [-20, 4]]);
  for (const d of [-2, 2]) {
    stroke("#577a87", 2.3, [[-17 + d, 2], [-9 + d, -25], [-1 + d, -3]]);
  }
  const wheel = (a, back2) => [-9 + Math.cos(a) * 17 + back2, -25 + Math.sin(a) * 17 + Math.cos(a) * 3 - back2 * 0.4];
  const rotation = period === "dawn" ? 0 : time * 0.12;
  for (const offset of [-2, 0]) {
    const rim = Array.from({ length: 33 }, (_, i) => wheel(i * Math.PI / 16 + rotation, offset));
    stroke(offset ? "#576b83" : "#ecd7ad", 2, rim);
    if (!offset && lit) for (const p of rim) box("#ffda7e", p[0], p[1], 1.5, 1.5, true);
  }
  for (let i = 0; i < 12; i++) {
    const p = wheel(i * Math.PI / 6 + rotation, 0);
    stroke("#b5a6a4", 0.75, [[-9, -25], p]);
    box("#e8cc84", p[0] - 1, p[1] - 1, 2, 2, lit);
    if (i % 2 === 0) {
      stroke("#526870", 1, [p, [p[0], p[1] + 2]]);
      box(["#d47764", "#6c99b3", "#d6ae57"][i / 2 % 3], p[0] - 2, p[1] + 2, 4, 3);
    }
  }
  box("#f2c66d", -11, -27, 4, 4, lit);
  poly("#a6796a", [[5, 0], [16, -5], [29, 0], [17, 5]]);
  for (const a of [9, 15, 23]) stroke("#b29b75", 1, [[a, 1], [a, -7]]);
  for (let j = 0; j < 6; j++) {
    const u = 4 + j * 4;
    poly(j % 2 ? "#edc59a" : "#c96766", [[16, -15], [u, -6 + Math.abs(16 - u) * 0.13], [u + 4, -6 + Math.abs(12 - u) * 0.13]]);
  }
  for (let j = 0; j < 4; j++) {
    const a = time * (period === "dawn" ? 0 : 0.58) + j * Math.PI / 2, xx = 16 + Math.cos(a) * 7, yy = -2 + Math.sin(a) * 2;
    box(j % 2 ? "#d1916a" : "#8da6a9", xx, yy, 3, 2);
    box("#d2ac76", xx + 1, yy - 2, 1, 3);
  }
  for (const [xx, yy] of [[1, 10], [15, 6]]) {
    poly("#be8671", [[xx - 2, yy], [xx + 2, yy + 1], [xx + 2, yy - 6], [xx - 2, yy - 7]]);
    poly("#705d82", [[xx - 3, yy - 6], [xx, yy - 13], [xx + 3, yy - 5]]);
    box("#f0bf73", xx, yy - 14, 3, 1, lit);
  }
  for (let i = 0; i < 7; i++) box("#f4d58b", 2 + i * 2, 3 - i * 0.4, 1, 1, lit);
  box("#efc98b", 15, -17, 2, 3, lit);
  stroke("#875e65", 2, [[4, 10], [4, 4], [13, 0], [13, 6]]);
  stroke("#dfb771", 2, [[3, 4], [13, -1]]);
  c.restore();
}

// Pages작업본/mm/art/reward-buildings.js
var sprites = /* @__PURE__ */ new Map();
function sprite(style, night) {
  const image = document.createElement("canvas");
  image.width = 84;
  image.height = 116;
  const c = image.getContext("2d");
  c.translate(42, 100);
  const pt = (x, y, z) => [Math.round(x - y), Math.round((x + y) / 2 - z)];
  const face = (color, points) => {
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.fill();
  };
  const rect2 = (color, x, y, w, h) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const line2 = (color, points, w = 1) => {
    c.strokeStyle = color;
    c.lineWidth = w;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x + 0.5, y + 0.5) : c.moveTo(x + 0.5, y + 0.5));
    c.stroke();
  };
  const shade = (color, f) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(color.slice(i, i + 2), 16) * f).toString(16).padStart(2, "0")).join("");
  const box = (x, y, a, b, z, h, col, cap) => {
    const vertices = [pt(x - a, y - b, z + h), pt(x + a, y - b, z + h), pt(x + a, y + b, z + h), pt(x - a, y + b, z + h)];
    face(shade(col, 0.72), [vertices[1], vertices[2], pt(x + a, y + b, z), pt(x + a, y - b, z)]);
    face(col, [vertices[2], vertices[3], pt(x - a, y + b, z), pt(x + a, y + b, z)]);
    face(cap || col, vertices);
  };
  const ellipse = (col, x, y, rx, ry) => {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  };
  const light = night ? "#ffe290" : "#b9dce1";
  const windows = (a, b, h, step = 5, col = light) => {
    for (let z = 4; z < h - 2; z += step) for (let u = -a + 2; u < a - 1; u += 4) {
      const [x, y] = pt(u, b, z);
      rect2(col, x, y, 2, 2);
    }
    for (let z = 5; z < h - 2; z += step) for (let v = -b + 2; v < b - 1; v += 4) {
      const [x, y] = pt(a, v, z);
      rect2(shade(col, 0.78), x, y, 1, 2);
    }
  };
  const base2 = (col = "#a3a79b") => box(0, 0, 11, 8, 0, 1, col, "#dbcfb5");
  const house = (col, cap, h = 12, a = 8, b = 6) => {
    base2();
    box(0, 0, a, b, 1, h, col, cap);
    windows(a, b, h + 1);
    if (h <= 14) {
      const awning = shade(cap, 0.92);
      box(0, b + 1, a - 0.6, 1.3, h * 0.56, 1.2, awning, cap);
      for (const u of [-a + 2, 0, a - 2]) {
        const [x, y] = pt(u, b + 0.2, 2);
        rect2(night ? "#ffd68a" : "#41565a", x, y - 3, 2, 3);
      }
    } else {
      box(0, 0, a + 0.6, b + 0.6, h - 1, 1.6, col, cap);
    }
  };
  const gable = (x, y, a, b, z, h, col) => {
    const left = pt(x - a, y + b, z), right = pt(x + a, y + b, z), front = pt(x, y + b, z + h), rear = pt(x, y - b, z + h);
    face(shade(col, 0.75), [front, right, pt(x + a, y - b, z), rear]);
    face(col, [left, front, rear, pt(x - a, y - b, z)]);
    face(shade(col, 0.86), [left, right, front]);
  };
  const stripe = (col, z, a = 8, b = 6) => box(0, 0, a + 0.25, b + 0.25, z, 1.1, col, col);
  const pole = (x, y, h, col = "#535e68") => {
    line2(col, [[x, y], [x, y - h]], 1);
  };
  const sign = (bg, x, y, w, h) => {
    rect2("#40505a", x - 0.5, y - 0.5, w + 1, h + 1);
    rect2(bg, x, y, w, h);
  };
  const lamp2 = (x, y) => {
    pole(x, y, 6);
    rect2(night ? "#ffe8ac" : "#e8d9a9", x - 1, y - 7, 2, 2);
  };
  const shops = [15, 16, 17, 18, 19, 23, 29, 33, 35], towers = [0, 1, 3, 7, 13, 14, 20, 22, 25];
  const civic = !shops.includes(style) && !towers.includes(style), stone = shops.includes(style) ? "#a38068" : civic ? "#849893" : "#738994";
  if (style === 5) {
    fair(c, 0, 0, 0.91, 4, night ? "night" : "day");
    return image;
  }
  box(0, 0, 13.8, 10.4, -2.5, 2, stone, shops.includes(style) ? "#dac7a7" : civic ? "#c9cbb4" : "#bfccca");
  for (let i = -11; i <= 10; i += 4) line2(shade(stone, 0.91), [pt(i, 7, -0.3), pt(i, 10, -0.3)]);
  const hedge = (x, y) => {
    const [u, v] = pt(x, y, 0);
    rect2("#76624e", u, v - 3, 1, 3);
    ellipse("#4a705b", u, v - 4, 2.1, 2.7);
    ellipse("#80a073", u - 1, v - 5, 1.25, 1.6);
  };
  for (const corner of [[-11, 5], [10, -6]]) hedge(...corner);
  const mast = (x, y, z, h, col) => {
    const a = pt(x, y, z), b = pt(x, y, z + h);
    line2("#465c66", [a, b]);
    rect2(col, b[0] - 1, b[1] - 1, 2, 2);
  };
  const glazing = (x, y, a, b, z, h, col) => {
    box(x, y, a, b, z, h, col, shade(col, 0.93));
    for (let u = -a + 2; u < a; u += 3) line2(night ? "#d9bb7b" : "#bdd7dc", [pt(x + u, y + b, z + 1), pt(x + u, y + b, z + h - 1)]);
    for (let v = -b + 1; v < b; v += 3) line2("#547483", [pt(x + a, y + v, z + 1), pt(x + a, y + v, z + h - 1)]);
    for (let i = z + 4; i < z + h; i += 4) line2("#73939a", [pt(x - a, y + b, i), pt(x + a, y + b, i), pt(x + a, y - b, i)]);
  };
  const dome = (x, y, rx, ry, col) => {
    ellipse(shade(col, 0.65), x, y, rx, ry * 0.35);
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, Math.PI, 2 * Math.PI);
    c.fill();
    for (const f of [0.4, 0.78]) {
      c.beginPath();
      c.ellipse(x, y, rx * f, ry, 0, Math.PI, 2 * Math.PI);
      c.strokeStyle = shade(col, 0.78);
      c.lineWidth = 0.75;
      c.stroke();
    }
  };
  switch (style) {
    case 0:
      glazing(0, 0, 9, 7, 0, 13, "#657b85");
      glazing(0, 0, 6, 5, 13, 29, "#6c9ca5");
      box(1, -1, 7, 5, 41, 3, "#bc8263", "#e4bd8d");
      glazing(2, -1, 4, 4, 44, 12, "#76939e");
      face("#a75145", [[-8, -34], [-4, -37], [0, -53], [8, -60], [4, -48], [2, -40]]);
      ellipse("#334850", 2, -47, 4, 4);
      ellipse(night ? "#a8ffef" : "#b7e8df", 2, -47, 2.6, 2.6);
      mast(2, -2, 55, 9, "#f1c379");
      break;
    case 1:
      glazing(0, 0, 8, 5, 0, 39, "#517b97");
      glazing(-2, -1, 5, 4, 39, 12, "#6c8098");
      for (const k of [-1, 1]) {
        line2("#db9e86", [[k * 10, 0], [k * 8, -16], [k * 5, -32], [k * 2, -51]], 1.3);
        for (let z = 8; z < 45; z += 9) line2("#d9cbb9", [[k * 8, -z + 3], [0, -z - 2], [k * 6, -z - 6]]);
      }
      mast(-3, -1, 50, 10, "#ffe5bb");
      break;
    case 2:
      box(0, 0, 10, 7, 0, 8, "#ad957f", "#d5cbb0");
      box(-2, -1, 7, 6, 8, 7, "#697e82");
      dome(-1, -15, 11, 11, "#81b9b0");
      line2("#47596a", [[-6, -16], [-1, -25], [5, -23]], 2);
      for (let i = 0; i < 4; i++) box(7, i * 1.65 - 2, 2, 0.64, 0, 4.8 - i, "#c4b49a", "#ece3c6");
      mast(6, -4, 7, 11, "#e2c176");
      break;
    case 3:
      for (const [z, a, x] of [[0, 9, 0], [12, 8, -1], [23, 6, 1], [33, 4, 0]]) {
        glazing(x, 0, a, 5, z, 9, "#7b9990");
        box(x, 0, a + 1.4, 6, z + 9, 2, "#c6bba0", "#91a777");
        for (const u of [-a + 2, a - 2]) {
          const [xx, yy] = pt(x + u, 4, z + 12);
          ellipse("#48775f", xx, yy, 2.5, 2.2);
          rect2("#86ac73", xx - 1, yy - 2, 2, 1);
        }
      }
      break;
    case 4:
      house("#b56c52", "#dfc7a6", 13, 9, 6);
      box(0, 0, 9, 7, 14, 1, "#546b70", "#687f79");
      ellipse("#e3d7b3", 0, -16, 5.4, 2.6);
      ellipse("#617b79", 0, -16, 4, 1.65);
      ellipse("#b54d3d", 0, -20, 4.5, 2.4);
      rect2("#9bc4cb", 1, -22, 2, 2);
      line2("#824f40", [[-3, -20], [-8, -23], [-9, -25]], 2);
      rect2("#515f63", -8, -25, 16, 1);
      rect2("#53666d", 0, -24, 1, 3);
      break;
    case 6:
      box(0, 0, 12, 7, 0, 4, "#a5a089", "#c8cbb5");
      for (const [x, y, r, h] of [[-6, -6, 7, 8], [5, -4, 8, 11], [-1, -8, 9, 13]]) dome(x, y, r, h, "#89c3b6");
      for (const x of [-7, -2, 4]) {
        line2("#799b7b", [[x, -5], [x - 1, -10], [x + 1, -13]]);
        rect2("#81a86f", x - 3, -10, 2, 1);
      }
      box(4, 7, 3, 2, 0, 4, "#b2a587", "#d6c6a4");
      break;
    case 7:
      box(0, 0, 9, 7, 0, 5, "#aba28a", "#ded1b2");
      box(0, 0, 4.6, 4, 5, 23, "#c9916d", "#dbb993");
      box(0, 0, 5.7, 4.8, 28, 8, "#b78c6e", "#dbc9a8");
      ellipse("#eadbb5", -2, -29, 3.3, 3.9);
      line2("#5f5f58", [[-2, -32], [-2, -29], [0, -28]]);
      gable(0, 0, 6, 5, 36, 10, "#508780");
      mast(0, 0, 46, 5, "#f5c772");
      break;
    case 8:
      house("#8e6663", "#b69880", 13, 10, 7);
      box(0, -4, 9, 1, 14, 9, "#454b61", "#62647a");
      face("#e5cf9e", [pt(-8, -2.9, 15), pt(8, -2.9, 15), pt(8, -2.9, 22), pt(-8, -2.9, 22)]);
      for (let row = 0; row < 3; row++) for (let seat = 0; seat < 5; seat++) box(-6 + seat * 2.9, row * 2.1 - 0.7, 1, 0.6, 14, 1.5, "#a95f56");
      mast(8, 4, 14, 7, "#ffe7a8");
      break;
    case 12:
      box(0, 0, 13, 10, 0, 1, "#7c9567", "#92ae79");
      box(-2, -2, 8, 5, 1, 11, "#ead3ae", "#d9c4ac");
      gable(-2, -2, 8.8, 5.7, 12, 6, "#59667b");
      box(-7, 0, 3, 4, 1, 8, "#dfbd94");
      gable(-7, 0, 3.6, 4.4, 9, 4, "#61758a");
      for (const x of [-9, -5, -1]) {
        rect2("#d2dece", x, -13, 2, 3);
        rect2("#485b6b", x, -12, 1, 2);
      }
      for (const x of [0, 3, 6]) rect2("#f8e8cb", x, -8, 1, 5);
      face("#71bdc1", [pt(6, 4, 1.2), pt(11, 4, 1.2), pt(11, 8, 1.2), pt(6, 8, 1.2)]);
      break;
    case 13: {
      base2();
      const rings = [[0, 11], [10, 10], [28, 8.5], [45, 6.2], [61, 3.7], [74, 1.3]];
      const edge = (h, r, side) => [side * r, -h + (side === 0 ? 3 : 0)];
      for (let i = 1; i < rings.length; i++) {
        const [z, a] = rings[i - 1], [h, b] = rings[i];
        face("#aac7cb", [edge(z, a, -1), edge(z, a, 0), edge(h, b, 0), edge(h, b, -1)]);
        face("#628e9e", [edge(z, a, 0), edge(z, a, 1), edge(h, b, 1), edge(h, b, 0)]);
        for (let y = z + 2; y < h; y += 3) {
          const r = a + (b - a) * (y - z) / (h - z);
          line2("#88abb3", [[-r, -y], [0, -y + 2], [r, -y]]);
        }
      }
      line2("#ecf2d9", [[-7, -3], [-5, -34], [-2, -62], [-2, -77]]);
      line2("#d6e5dc", [[4, -42], [2, -63], [2, -75]]);
      break;
    }
    case 14:
      base2();
      box(0, 0, 8, 5, 0, 52, "#c29744", "#ead186");
      for (let z = 3; z < 52; z += 3) {
        line2(z % 2 ? "#edc870" : "#b4863a", [pt(-7, 5, z), pt(8, 5, z), pt(8, -5, z)]);
      }
      for (let u = -6; u < 8; u += 3) line2("#dcb65e", [pt(u, 5, 2), pt(u, 5, 50)]);
      box(0, 0, 6.7, 4.2, 52, 2, "#c8ac6a", "#edda91");
      pole(1, -54, 5);
      break;
    case 15:
      house("#b76b42", "#ebd3a1", 8);
      stripe("#e5a14c", 8);
      stripe("#8d4539", 6);
      pole(10, 1, 17);
      ellipse("#efc372", 10, -18, 5, 3);
      rect2("#ad473c", 6, -18, 9, 2);
      face("#edb74c", [[-8, -10], [-8, -14], [-6, -12], [-4, -15], [-2, -12], [0, -14], [-1, -10]]);
      break;
    case 16:
      house("#9c4b3e", "#d35b46", 8);
      stripe("#d9ba6e", 6);
      pole(-10, 1, 17);
      sign("#be4237", -15, -22, 10, 8);
      line2("#ffce43", [[-14, -16], [-13, -20], [-12, -21], [-11, -20], [-10, -17], [-9, -20], [-8, -21], [-7, -20], [-6, -16]], 1.5);
      break;
    case 17:
      house("#8aabb0", "#cde4d9", 8);
      for (const x of [-8, -4, 0]) {
        rect2("#d6ebe5", x, -5, 3, 4);
        ellipse("#598298", x + 1, -3, 1, 1);
      }
      line2("#7e7d73", [[-9, -11], [0, -13], [6, -12]]);
      for (const [x, col] of [[-7, "#f4d487"], [-3, "#e7c1b6"], [1, "#99cede"]]) rect2(col, x, -12, 2, 3);
      break;
    case 18:
      house("#927262", "#b3af86", 9);
      for (let i = 0; i < 5; i++) rect2(["#b3624f", "#e0be77", "#567c76"][i % 3], -9 + i * 2, -5, 1, 4);
      ellipse("#373b40", 1, -13, 3, 2);
      rect2("#33383d", 2, -16, 3, 3);
      rect2("#383d41", 2, -17, 1, 2);
      rect2("#383d41", 4, -17, 1, 2);
      line2("#343a40", [[-1, -13], [-4, -14], [-4, -16]]);
      break;
    case 19:
      base2();
      box(0, 0, 7, 4, 0, 5, "#b37e46");
      gable(0, 0, 9, 6, 5, 4, "#c66d48");
      ellipse("#e5a953", 1, -12, 5, 2.7);
      face("#d89842", [[-4, -12], [-7, -15], [-7, -10]]);
      rect2("#735246", 4, -13, 1, 1);
      for (let x = -4; x <= 2; x += 3) rect2("#f2d698", x, -4, 2, 2);
      lamp2(9, 1);
      break;
    case 20:
      base2();
      line2("#657981", [[-10, 2], [0, -27], [9, 2]], 2);
      ellipse("#547585", 0, -24, 17, 18);
      ellipse(night ? "#384b60" : "#9cbac4", 0, -24, 15, 16);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6, x = Math.cos(a) * 16, y = -24 + Math.sin(a) * 17;
        line2("#e8d3ab", [[0, -24], [x, y]]);
        if (i % 2 === 0) rect2(["#df925c", "#b95554", "#77a6a3"][i / 2 % 3], x - 2, y, 4, 3);
      }
      ellipse("#ffe0a0", 0, -24, 2, 2);
      break;
    case 21:
      house("#b9aa96", "#d2cbb0", 12, 10, 6);
      gable(0, 0, 10, 6, 13, 4, "#95a69d");
      line2("#efe3c4", [[-11, -4], [-6, -7], [-1, -8], [4, -9], [7, -14], [10, -15]], 2);
      for (let i = -5; i <= 3; i += 2) line2("#e6d8b7", [[i, -8], [i + 1, -5]]);
      rect2("#ddd0a8", 8, -16, 4, 2);
      break;
    case 22:
      house("#8b9fae", "#cee0d6", 34);
      for (let z = 5; z < 34; z += 6) stripe("#bdc8c4", z);
      box(0, 0, 5, 3, 35, 0.7, "#d9d6b3", "#65b8c3");
      line2("#f2eee0", [[-2, -36], [-2, -39], [0, -40]]);
      break;
    case 23:
      house("#805858", "#645563", 8);
      sign("#463c48", -9, -11, 8, 5);
      ellipse("#292e36", 1, -13, 4.5, 4.5);
      ellipse("#c78b68", 1, -13, 1.25, 1.25);
      rect2("#eacb8c", -7, -7, 1, 3);
      break;
    case 24:
      house("#7792a3", "#acced1", 13);
      box(0, 0, 5, 3, 14, 4, "#f0d8af", "#f8efcf");
      line2("#9e7165", [[-6, -18], [0, -15], [6, -18]]);
      for (const [x, y] of [[-8, -16], [8, -18], [10, -16]]) ellipse("#d2e3dd", x, y, 3, 2);
      break;
    case 25:
      base2();
      box(-5, 0, 1.5, 1.5, 0, 36, "#ab8777");
      for (let z = 4; z < 34; z += 6) line2("#dfb67a", [[-8, -z], [-4, -z - 4], [-8, -z - 6]]);
      face("#e5ded2", [[0, -8], [0, -26], [3, -34], [6, -26], [6, -8]]);
      face("#ce7054", [[0, -26], [3, -34], [6, -26]]);
      face("#b75e4f", [[0, -13], [-4, -5], [1, -8]]);
      face("#b75e4f", [[6, -13], [9, -5], [5, -8]]);
      ellipse("#50879b", 3, -22, 1.7, 2);
      break;
    case 26:
      house("#8b887c", "#cdbfa3", 9);
      for (let i = 0; i < 8; i++) rect2(i % 2 ? "#504d55" : "#eee1c5", -8 + i * 2, -7, 2, 2);
      face("#dccda9", [[-5, -11], [4, -11], [3, -15], [1, -20], [3, -23], [3, -26], [0, -24], [-2, -25], [-6, -19], [-5, -17], [-1, -19], [0, -16]]);
      break;
    case 27:
      base2();
      ellipse("#8d6275", 0, -2, 16, 8);
      ellipse("#dbf0e9", 0, -4, 15, 7);
      ellipse("#aad2db", 0, -4, 12, 5);
      for (const x of [-14, 14]) {
        pole(x, -2, 13);
        rect2("#ffe5ac", x - 2, -16, 4, 2);
      }
      line2("#eef9f1", [[-7, -4], [-3, -5], [2, -5], [5, -4]]);
      break;
    case 28:
      house("#698f98", "#80b3b6", 13, 9, 6);
      ellipse("#4b8293", -4, -6, 6, 3);
      ellipse("#b9dbaf", -5, -6, 2, 1);
      face("#769cab", [[-7, -17], [-4, -22], [2, -23], [6, -20], [10, -22], [8, -17], [5, -17], [3, -15], [-4, -15]]);
      rect2("#cef0e4", -3, -21, 1, 1);
      break;
    case 29:
      house("#ceac81", "#a68d80", 7);
      ellipse("#f7e7bd", 0, -12, 3.5, 3);
      ellipse("#f0dfba", -2, -16, 1, 3);
      ellipse("#f0dfba", 1, -16, 1, 3);
      ellipse("#b77c60", 7, -7, 2.6, 1.4);
      line2("#794f44", [[5, -11], [9, -5]], 1.3);
      break;
    case 30:
      base2();
      box(0, 0, 8, 6, 0, 14, "#76668e", "#9285ab");
      sign("#343a5a", -8, -13, 10, 7);
      rect2("#88d9bf", -6, -11, 4, 1);
      rect2("#d8959c", -2, -9, 2, 2);
      rect2("#f5ce76", -6, -7, 2, 2);
      pole(4, -15, 4);
      ellipse("#d96370", 4, -20, 2.1, 2.1);
      break;
    case 31:
      house("#956757", "#ad9c84", 12);
      sign("#f4d495", -11, -11, 14, 4);
      for (let i = 0; i < 4; i++) rect2("#a95448", -9 + i * 3, -11, 1, 1);
      rect2("#404553", -1, -19, 11, 5);
      for (let i = 0; i < 4; i++) line2("#e7e0c8", [[i * 3, -18], [i * 3 + 2, -19]], 1);
      break;
    case 32:
      base2();
      ellipse("#8b9694", 0, -4, 17, 9);
      ellipse("#dbdbbf", 0, -7, 16, 9);
      ellipse("#acc0b8", 1, -9, 11, 6);
      ellipse("#818c80", 1, -10, 7, 3);
      ellipse("#81a377", 1, -10, 4, 2);
      for (const x of [-12, 12]) {
        pole(x, -8, 9);
        rect2("#efdfaf", x - 2, -18, 4, 2);
      }
      break;
    case 33:
      house("#d8d4bc", "#cad5c5", 7);
      stripe("#648e78", 7);
      stripe("#da9457", 6);
      sign("#f3ddba", -1, -11, 10, 4);
      ellipse("#eee3ba", 5, -11, 3, 1.2);
      line2("#c28c61", [[3, -12], [5, -14], [7, -13]]);
      break;
    case 34:
      base2();
      ellipse("#c09a76", 0, -2, 12, 5);
      for (const x of [-7, 0, 7]) {
        pole(x, -3, 10, "#d3b277");
        rect2("#dccb9c", x - 2, -7, 4, 2);
      }
      for (let i = 0; i < 6; i++) face(i % 2 ? "#e3bf96" : "#b96565", [[0, -19], [-13 + i * 4.4, -10], [-8.6 + i * 4.4, -10]]);
      pole(0, -19, 3);
      rect2("#e5ba66", 0, -22, 4, 2);
      break;
    case 35:
      house("#c38884", "#efc6ac", 7);
      box(0, 0, 4, 3, 8, 3, "#e2a7a1", "#fff0ce");
      box(0, 0, 2.3, 1.8, 11, 2, "#e6b2a0", "#ffe8cc");
      ellipse("#c25150", 0, -15, 1.6, 1.6);
      break;
  }
  const glow = night ? "#ffde83" : "#d9ba83";
  switch (style) {
    case 12:
      for (const x of [-6, 0]) {
        box(x, -1, 1.25, 1.25, 14, 3, "#d9c4a4");
        gable(x, -1, 1.65, 1.6, 17, 2, "#5e7382");
      }
      for (let i = 0; i < 3; i++) box(1, 6.5 + i, 3, 0.6, 0, 2.7 - i * 0.65, "#b9b4a2", "#efe2c7");
      hedge(-9, 7);
      break;
    case 13:
      glazing(0, 0, 10, 7, 0, 6, "#75969f");
      line2("#e5e7cf", [[2, -10], [4, -36], [3, -52], [1, -65]]);
      rect2(glow, -2, -76, 1, 2);
      break;
    case 14:
      box(0, 0, 10, 7, 0, 6, "#ae8646", "#e2c887");
      glazing(-3, 5, 3, 1.6, 0, 4, "#5a7577");
      box(1, 0, 4, 2, 53, 3, "#ac914f", "#e5cf83");
      break;
    case 15:
      for (const x of [-5, 3]) {
        box(x, 8, 1.8, 1, 0, 1.7, "#966b4c", "#f1c67b");
      }
      rect2("#f4c467", -6, -15, 3, 1);
      break;
    case 16:
      for (const u of [-5, -1, 3]) line2("#e9bf76", [pt(u, 6, 7), pt(u, 8.5, 5)], 1.5);
      box(-7, 6, 1.4, 1, 0, 4, "#933f39", "#f5b966");
      break;
    case 17:
      for (const x of [-6, -2, 2]) {
        const [u, v] = pt(x, 6.8, 4);
        ellipse("#d9e6d8", u, v, 1.8, 2);
        ellipse("#547a88", u, v, 1, 1.3);
      }
      mast(8, -4, 8, 7, "#a5d9d2");
      break;
    case 18:
      for (let i = 0; i < 7; i++) box(-6 + i * 1.5, 7.4, 0.57, 0.7, 0, 2.5 + i % 3, ["#ad7364", "#6e8680", "#c39766"][i % 3]);
      break;
    case 19:
      for (const x of [-4, 1, 5]) {
        const [u, v] = pt(x, 5, 6);
        rect2("#e8af73", u, v, 2, 3);
        rect2("#8e5943", u, v + 2, 2, 1);
      }
      break;
    case 20:
      for (const off of [-2, 2]) line2("#73959d", [[-12 + off, 3], [-2 + off, -24], [12 + off, 2]], 1);
      ellipse("#d2b279", 0, -24, 2.8, 2.8);
      break;
    case 21:
      for (const u of [-8, -4, 0, 4, 8]) {
        box(u, 6.7, 0.72, 0.75, 0, 7.5, "#cfc2a7", "#f3ddba");
      }
      gable(0, 6, 10.5, 2.4, 8.5, 3.5, "#8d9990");
      break;
    case 22:
      for (const u of [-4, 0, 4]) {
        const [x, y] = pt(u, -2, 36);
        ellipse("#d68773", x, y, 1.8, 1);
        rect2("#f2dfad", x, y, 1, 2);
      }
      break;
    case 23:
      line2("#d9ad73", [[5, -11], [6, -15], [7, -13], [7, -8], [4, -7]], 1.6);
      ellipse(glow, 3, -7, 1.6, 1);
      break;
    case 24:
      mast(-7, 4, 8, 11, "#e2a182");
      box(8, 6, 1.8, 1.4, 0, 4.8, "#527b8b", "#d6c3a4");
      break;
    case 25:
      box(3, 1, 5, 3, 0, 3, "#879a99", "#c2c8ac");
      line2("#d0c19c", [[-7, -23], [0, -24]], 2);
      line2("#d0c19c", [[-7, -15], [0, -16]], 2);
      break;
    case 26:
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) box(-4 + i * 2, 7 + j * 2, 1, 1, 0, 0.5, (i + j) % 2 ? "#6a6463" : "#ddcfb0");
      break;
    case 27:
      for (let i = 0; i < 10; i++) {
        const a = i / 9 * Math.PI;
        rect2("#897c71", Math.cos(a) * 14, -3 + Math.sin(a) * 6, 1, 3);
      }
      break;
    case 28:
      for (let i = 0; i < 6; i++) {
        const [x, y] = pt(-7 + i * 2.5, 6.2, 7);
        ellipse("#9dd4cc", x, y, 1.2, 1.5);
      }
      break;
    case 29:
      ellipse("#8b6859", 5, -12, 0.7, 0.7);
      box(4, 7, 3, 1.4, 0, 2, "#977964", "#eee1b8");
      break;
    case 30:
      for (const x of [-4, 0, 4]) {
        box(x, 7, 1.4, 1.2, 0, 4, "#654f70", "#cd97a5");
        const [u, v] = pt(x, 7, 3);
        rect2("#81cdca", u - 1, v, 2, 1);
      }
      break;
    case 31:
      for (let i = 0; i < 6; i++) rect2(glow, -10 + i * 2, -8, 1, 1);
      box(6, 6, 2, 1.6, 0, 4, "#97534e", "#ecd296");
      break;
    case 32:
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * i / 8;
        line2("#a5b6b0", [[Math.cos(a) * 15, -7 + Math.sin(a) * 8], [Math.cos(a) * 8, -10 + Math.sin(a) * 3]]);
      }
      break;
    case 33:
      box(5, 7, 2.1, 0.9, 0, 4, "#7d9981", "#efe0be");
      for (let i = 0; i < 3; i++) rect2("#eac07c", 1 + i * 2, -9, 1, 1);
      break;
    case 34:
      for (const x of [-8, -4, 0, 4, 8]) rect2(glow, x, -9 + Math.abs(x) * 0.1, 1, 1);
      ellipse("#b78568", 0, -3, 2, 1);
      break;
    case 35:
      for (const x of [-3, 0, 3]) {
        ellipse("#f7e3be", x, -12, 1.4, 1);
        rect2("#ad4f53", x, -13, 1, 1);
      }
      break;
  }
  if (night) {
    c.globalCompositeOperation = "source-atop";
    c.fillStyle = "#1e284755";
    c.fillRect(-42, -100, 84, 116);
  }
  return image;
}
function cachedSprite(style, period) {
  const night = period === "night" || period === "dawn", key4 = style + "/" + night;
  if (sprites.has(key4)) return sprites.get(key4);
  const raw = sprite(style, night), ctx = raw.getContext("2d"), pixels = ctx.getImageData(0, 0, raw.width, raw.height).data;
  let x0 = raw.width, y0 = raw.height, x1 = 0, y1 = 0;
  for (let y = 0; y < raw.height; y++) for (let x = 0; x < raw.width; x++) if (pixels[(y * raw.width + x) * 4 + 3] > 12) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const image = document.createElement("canvas");
  image.width = x1 - x0 + 1;
  image.height = y1 - y0 + 1;
  image.getContext("2d").drawImage(raw, -x0, -y0);
  const b = { image, ox: 42 - x0, oy: 100 - y0 };
  sprites.set(key4, b);
  return b;
}
function rewardSprite(style, x, y, width, period) {
  const b = cachedSprite(style, period), s = width / 33, left = x - b.ox * s, top = y - b.oy * s, w = b.image.width * s, h = b.image.height * s;
  return { image: b.image, left, top, right: left + w, bottom: top + h, width: w, height: h };
}
function rewardThumbnail(style) {
  const { image } = cachedSprite(style, "day"), cv = document.createElement("canvas");
  cv.width = 104;
  cv.height = 100;
  const s = Math.min(94 / image.width, 92 / image.height), w = image.width * s, h = image.height * s;
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.drawImage(image, (104 - w) / 2, (100 - h) / 2, w, h);
  return cv;
}

// Pages작업본/mm/art/reward-sites.js
var response = await fetch("/mm/art/city-rewards.json");
if (!response.ok) throw Error("마이시티 리워드 목록을 열 수 없습니다.");
var rules = await response.json();
var rewardNames = rules.rewards.map((r) => r[0]);
var rewardKind = (style) => rules.rewards[style]?.[1];
var low = new Set(rules.lowBlocks.map((xy) => xy.join(",")));
function rewardSites(plan, style, limit = 14) {
  const kind = rewardKind(style), lots = [];
  if (!kind || kind === "person") return lots;
  plan.blocks.slice(0, limit).forEach(([x, y, zone], i) => {
    if (kind === "park" !== (zone === "P") || low.has(x + "," + y) && !["small", "park"].includes(kind)) return;
    for (const slot of rules.slots[zone] || []) if (i || slot === 0) lots.push(i * 4 + slot);
  });
  return lots;
}
function siteName(plan, lot) {
  if (lot === -1) return "보관함";
  const index = Math.floor(lot / 4), zone = plan.blocks[index][2];
  return index + 1 + "구역 · " + { H: "주택가", S: "상점가", O: "업무지구", T: "역세권", C: "문화거리", P: "공원" }[zone] + [" 서편", " 동편", "", " 광장"][lot % 4];
}

// Pages작업본/mm/art/village-life.js
var directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
var key3 = (x, y) => x + "," + y;
var distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
function reachableFrom(start, adjacent) {
  const parents = /* @__PURE__ */ new Map([[start, null]]), queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const tile2 = queue[i];
    for (const next of adjacent.get(tile2)) {
      if (next && !parents.has(next)) {
        parents.set(next, tile2);
        queue.push(next);
      }
    }
  }
  return parents;
}
function planResidents(roads, objects, count, random2) {
  const streets2 = new Map(roads.map((t) => [key3(t.x, t.y), t]));
  const adjacent = new Map(roads.map((t) => [t, directions.map(([dx, dy]) => key3(t.x + dx, t.y + dy)).filter((k) => !t.exits || t.exits.has(k)).map((k) => streets2.get(k)).filter(Boolean)]));
  const reachable = /* @__PURE__ */ new Set(), components = [];
  for (const t of roads) {
    if (reachable.has(t)) continue;
    const component = [...reachableFrom(t, adjacent).keys()];
    component.forEach((p) => reachable.add(p));
    if (component.length > 1) components.push(component);
  }
  if (!components.length) return [];
  const aims = objects.filter((o) => o.act);
  const stopsByComponent = /* @__PURE__ */ new Map();
  for (const component of components) {
    const stops = [], members = new Set(component);
    for (const o of aims) {
      const reach = o.act === "study" ? 3 : 1.7;
      let tile2 = null, nearest = reach;
      for (let x = Math.ceil(o.t.x - reach); x <= o.t.x + reach; x++) for (let y = Math.ceil(o.t.y - reach); y <= o.t.y + reach; y++) {
        const p = streets2.get(key3(x, y));
        if (!members.has(p)) continue;
        const d = distance(p, o.t);
        if (d <= nearest) {
          tile2 = p;
          nearest = d;
        }
      }
      if (!tile2) continue;
      const visit = { tile: tile2, site: o.t, act: o.act };
      for (let j = 0; j < (o.weight || 1); j++) stops.push(visit);
    }
    stopsByComponent.set(component, stops);
  }
  const trees = /* @__PURE__ */ new Map();
  function routesFrom(tile2) {
    if (!trees.has(tile2)) trees.set(tile2, reachableFrom(tile2, adjacent));
    return trees.get(tile2);
  }
  return Array.from({ length: count }, (_, id) => {
    const component = components[id % components.length];
    const rng = (n) => random2("resident:" + id + ":" + n);
    const destinations2 = stopsByComponent.get(component);
    const homes = destinations2.filter((d) => d.act === "rest"), home = homes.length ? homes[Math.floor(rng("home") * homes.length)] : { tile: component[0], act: "rest" };
    const start = home.tile, stops = [home];
    const itinerary = [["feed", "shop", "rest"], ["read", "study", "shop"], ["work", "shop", "rest"], ["shop", "work", "read"]][id % 4];
    for (const [idx, act] of itinerary.entries()) {
      const last = stops.at(-1).tile;
      const options = destinations2.filter((d) => (d.tile !== last || act === "feed") && d.act === act);
      if (options.length) stops.push(options[Math.floor(rng("visit" + idx) * options.length)]);
    }
    if (stops.every((v) => v.tile === start)) {
      const other = destinations2.find((d) => d.tile !== start) || { tile: component.find((t) => t !== start), act: "rest" };
      stops.push(other);
    }
    const parks = new Set(destinations2.filter((d) => d.act === "exercise").map((d) => d.tile));
    const legs = [];
    let duration = 0, steps = 0;
    const pace = 0.23 + rng("pace") * 0.11;
    function add(a, b, seconds, act) {
      legs.push({ a, b, begin: duration, end: duration + seconds, steps, act });
      duration += seconds;
      if (a !== b) steps++;
    }
    for (let i = 0; i < stops.length; i++) {
      const from = stops[i].tile, to = stops[(i + 1) % stops.length];
      if (from === to.tile) {
        if (to.act === "feed") add(from, from, 9, "feed");
        continue;
      }
      const parents = routesFrom(from);
      const trail = [];
      for (let t = to.tile; t !== from; t = parents.get(t)) trail.push(t);
      let last = from;
      for (const t of trail.reverse()) {
        add(last, t, 1 / pace, "walk");
        last = t;
        if (parks.has(t) && rng("exercise" + i + ":" + t.x + "," + t.y) < 0.14) add(t, t, 14, "exercise");
      }
      add(last, last, (to.act === "study" || to.act === "work" ? 24 : 7) + rng("pause" + i) * 9, to.act);
    }
    let offset = rng("offset") * duration;
    if (id === 0) {
      const front = legs.filter((l) => l.act === "walk").reduce((a, b) => a.a.x + a.a.y > b.a.x + b.a.y ? a : b);
      offset = front.begin + 0.1;
    }
    return {
      id,
      stops,
      legs,
      duration,
      offset,
      laneX: (rng("lane-x") - 0.5) * 0.26,
      laneY: (rng("lane-y") - 0.5) * 0.26,
      companion: id % 9 === 2,
      style: Math.floor(rng("style") * 36)
    };
  });
}
function residentPose(w, time) {
  const at = (time + w.offset) % w.duration, idx = w.legs.findIndex((l) => at < l.end), leg = w.legs[idx];
  const fraction = (at - leg.begin) / (leg.end - leg.begin), moving = leg.a !== leg.b;
  const heading = moving ? leg : w.legs[(idx + w.legs.length - 1) % w.legs.length];
  const dx = heading.b.x - heading.a.x, dy = heading.b.y - heading.a.y;
  return {
    x: leg.a.x + (leg.b.x - leg.a.x) * fraction + w.laneX,
    y: leg.a.y + (leg.b.y - leg.a.y) * fraction + w.laneY,
    right: dx - dy >= 0,
    back: dx + dy < 0,
    frame: moving ? Math.floor((leg.steps + fraction) * 16) % 8 : 8,
    act: leg.act,
    beat: Math.floor((at - leg.begin) * 2) % 2
  };
}
var jackets = [["#a84e43", "#e18359"], ["#30546b", "#5c93a1"], ["#64683b", "#a8a35a"], ["#80566e", "#bd8395"], ["#9d6a39", "#d2a451"], ["#396d6d", "#66aaa1"]];
var skin = ["#edbe87", "#b57e5f", "#d49e72"];
var hair = ["#443b38", "#75543e", "#595056", "#997252"];
var sprites2 = /* @__PURE__ */ new Map();
function personBitmap(w, p) {
  const cacheKey = [w.style, p.back, p.frame, p.act, ["fish", "feed", "exercise", "study", "work"].includes(p.act) ? p.beat : 0].join("/");
  if (sprites2.has(cacheKey)) return sprites2.get(cacheKey);
  const cv = document.createElement("canvas");
  cv.width = 28;
  cv.height = 27;
  const c = cv.getContext("2d"), box = (col, x, y, a, b) => {
    c.fillStyle = col;
    c.fillRect(x, y, a, b);
  };
  const [shade, shirt] = jackets[w.style % jackets.length], face = skin[w.style % 3], head = hair[Math.floor(w.style / 3) % 4];
  const angle = p.frame % 8 * Math.PI / 4;
  const swing = p.frame === 8 ? 0 : Math.sin(angle) * 3, arm = Math.round(swing * 0.67);
  const leg = Math.round(swing), lift = p.frame !== 8 && Math.abs(Math.cos(angle)) > 0.7 ? 1 : 0;
  const bob = p.frame !== 8 && Math.abs(leg) > 1 ? 1 : 0, outline = "#383e45", shoe = "#423830";
  function boot(x, y, near) {
    box(near ? "#4a5460" : "#394651", x, 18, 2, 2);
    box(near ? "#52606a" : "#394651", x + (near ? leg : -leg), y - 2, 2, 3);
    const delta = near ? leg : -leg;
    box(near ? "#52606a" : "#394651", Math.min(x, x + delta), y - 3, Math.abs(delta) + 2, 2);
    box(shoe, x + delta, y, 3, 1);
  }
  boot(11, 23 - lift, false);
  boot(13, 24 - (leg < 0 ? 1 : 0), true);
  box(outline, 10, 11 + bob, 6, 8);
  box(shade, 10, 12 + bob, 6, 6);
  box(shirt, 11, 12 + bob, 4, 5);
  box(shade, 9, 13 + bob, 2, 4);
  box(face, 9 - arm, 16 + bob, 2, 2);
  box(shirt, 14, 13 + bob, 2, 4);
  box(face, 14 + arm, 16 + bob, 2, 2);
  box(head, 10, 5 + bob, 6, 5);
  box(head, 11, 4 + bob, 4, 1);
  box(face, p.back ? 14 : 11, 7 + bob, p.back ? 2 : 5, 4);
  box(face, 12, 10 + bob, 2, 2);
  if (!p.back) {
    box(face, 16, 8 + bob, 1, 2);
    box(outline, 15, 7 + bob, 1, 1);
  }
  box(head, 10, 6 + bob, 2, 3);
  if (w.style % 4 === 0) {
    box(shade, 9, 5 + bob, 8, 2);
    box(shirt, 11, 3 + bob, 4, 2);
  }
  if (w.style % 4 === 2) {
    box(head, 9, 7 + bob, 2, 5);
  }
  if (p.act === "dance" || p.act === "cheer" || p.act === "play") {
    const up = p.frame % 4 < 2;
    box(shirt, 7, up ? 10 : 13, 4, 2);
    box(face, 6, up ? 8 : 14, 2, 3);
    box(shirt, 15, up ? 12 : 9, 4, 2);
    box(face, 18, up ? 11 : 7, 2, 3);
    if (p.act === "play") {
      box("#efb75d", 14, 15, 5, 4);
      box("#744e41", 18, 14, 3, 2);
      box("#efcf89", 20, 12, 3, 2);
    }
  } else if (p.act === "exercise") {
    box(shirt, 7, 12 - p.beat * 3, 4, 2);
    box(shirt, 15, 12 - p.beat * 3, 4, 2);
    box(face, 6, 11 - p.beat * 4, 2, 3);
    box(face, 18, 11 - p.beat * 4, 2, 3);
  } else if (p.act === "feed") {
    box(shirt, 14, 16, 4, 2);
    box(face, 17, 18 + p.beat, 2, 2);
    box("#a85e47", 20, 23, 5, 2);
  } else if (p.act === "study" || p.act === "work" || p.act === "read") {
    box("#354859", 13, 14, 7, 4);
    box("#fcdf9a", 14, 14, 2, 3);
    box("#f4eed7", 17, 13, 2, 4);
  } else if (p.act === "shop") {
    box("#85553d", 16, 17, 3, 2);
    box("#c48a51", 15, 19, 5, 4);
  } else if (p.act === "fish") {
    for (let i = 0; i < 9; i++) box("#705643", 16 + i, 15 - i, 2, 1);
    box("#dfecdf", 25, 8, 1, 11 + p.beat);
    box("#db694c", 24, 19 + p.beat, 3, 2);
  }
  sprites2.set(cacheKey, cv);
  return cv;
}
function drawResident(c, w, p, x, y) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(p.right ? 0.76 : -0.76, 0.76);
  c.fillStyle = "#364a492f";
  c.fillRect(-4, -1, 9, 2);
  if (w.companion) {
    const foot = p.frame < 8 && p.frame % 4 < 2 ? 1 : 0;
    c.fillStyle = "#80634d";
    c.fillRect(3, -5, 3, 1);
    c.fillRect(6, -4, 3, 1);
    c.fillStyle = "#79513b";
    c.fillRect(8, -5, 6, 3);
    c.fillRect(12, -7, 3, 3);
    c.fillRect(7, -6, 2, 2);
    c.fillStyle = "#bf9268";
    c.fillRect(9, -5, 4, 2);
    c.fillRect(14, -5, 2, 1);
    c.fillStyle = "#51473e";
    c.fillRect(9 - foot, -2, 1, 2);
    c.fillRect(12 + foot, -2, 1, 2);
  }
  c.drawImage(personBitmap(w, p), -13, -24);
  c.restore();
}

// Pages작업본/mm/art/city-events.js
var examCalendar = [
  ["2027-03-24", "3월 전국연합학력평가", "고1–3"],
  ["2027-05-06", "5월 전국연합학력평가", "고3"],
  ["2027-06-03", "6월 모의평가·학력평가", "고1–3"],
  ["2027-07-08", "7월 전국연합학력평가", "고1·3"],
  ["2027-08-25", "8월 수능 모의평가", "고3"],
  ["2027-10-19", "10월 전국연합학력평가", "고1–3"],
  ["2027-11-18", "2028학년도 수능", "고3"]
];
var dayMs = 864e5;
function cityEvents(seed, stage, hasFair, now, preview = "auto", previewSeconds = 0, recentAward = null) {
  const local = new Date(now.getTime() + 9 * 36e5), date = local.toISOString().slice(0, 10);
  const day = Date.parse(date), weekday = local.getUTCDay(), sec = (local.getUTCHours() * 60 + local.getUTCMinutes()) * 60 + local.getUTCSeconds() + local.getUTCMilliseconds() / 1e3;
  const due = examCalendar.map(([d, name, grades]) => ({ days: (Date.parse(d) - day) / dayMs, name, grades })).find((e) => e.days >= 0 && e.days <= 7);
  const banner = preview === "banner" ? { days: 7, name: "3월 전국연합학력평가", grades: "고1–3" } : due;
  const sample = preview === "dance" || preview === "concert";
  let show = null;
  const slot = (type, start, duration) => {
    if (sec >= start && sec < start + duration) show = { type, elapsed: sec - start, duration };
  };
  if (preview === "auto" && stage >= 2) {
    const daySeed = seed + "/" + date;
    if (random(daySeed, "street-dance") < 0.42) slot("dance", (12 + Math.floor(random(daySeed, "hour") * 7)) * 3600 + Math.floor(random(daySeed, "minute") * 60) * 60, 5 * 60);
    if (stage >= 3 && [5, 6].includes(weekday)) slot("concert", 19 * 3600 + 30 * 60, 15 * 60);
    if (hasFair && stage >= 3 && weekday === 0) slot("concert", 18 * 3600, 15 * 60);
    if (recentAward) {
      const age = (now.getTime() - recentAward.time) / 1e3;
      if (age >= 0 && age < 420) show = { type: recentAward.fair && stage >= 3 ? "concert" : "dance", elapsed: age, duration: 420, occasion: recentAward.fair ? "테마파크 개장 축하" : "만점 축하" };
    }
  }
  if (sample && stage >= 2 && (preview !== "concert" || stage >= 3)) show = { type: preview, elapsed: previewSeconds % 54, duration: 54 };
  return { banner, show };
}
function planVenue(cells, roads, form, seed) {
  const centerOf = (b) => [b[0] * 4 + 2, b[1] * 4 + 2];
  const publicLot = cells.find((b) => b[2] === "Q") || cells.find((b) => b[2] === "A") || cells.find((b) => b[2] === "P");
  const preferred = publicLot ? centerOf(publicLot) : centerOf(cells[0]);
  const road2 = roads.reduce((a, b) => Math.hypot(a.x - preferred[0], a.y - preferred[1]) < Math.hypot(b.x - preferred[0], b.y - preferred[1]) ? a : b);
  const origin = publicLot ? preferred : [road2.x, road2.y], byKey = new Map(roads.map((r) => [key2(r.x, r.y), r]));
  const square = publicLot?.[2] === "Q";
  const gate = square ? byKey.get(key2(...preferred)) || road2 : road2;
  const parents = /* @__PURE__ */ new Map([[gate, null]]), queue = [gate], dist = /* @__PURE__ */ new Map([[gate, 0]]), starts = [];
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i], d = dist.get(n);
    if (d >= 3) starts.push(n);
    if (d === 7) continue;
    for (const k of n.exits) {
      const next = byKey.get(k);
      if (next && !parents.has(next)) {
        parents.set(next, n);
        dist.set(next, d + 1);
        queue.push(next);
      }
    }
  }
  starts.sort((a, b) => random(seed, "walk-in" + key2(a.x, a.y)) - random(seed, "walk-in" + key2(b.x, b.y)));
  const cast = Array.from({ length: 14 }, (_, i) => {
    const route = [];
    for (let n = starts[i % Math.max(1, starts.length)] || gate; n; n = parents.get(n)) route.push([n.x, n.y]);
    const col = i % 5, row = Math.floor(i / 5);
    const x = origin[0] - 0.89 + col * 0.4 + row * 0.12, y = origin[1] - 0.07 + row * 0.43 + i % 2 * 0.09;
    route.push([x, y]);
    return { route, style: Math.floor(random(seed, "cast" + i) * 36), id: i };
  });
  return { origin, cast, square, name: square ? "대학로 공연광장" : publicLot?.[2] === "A" ? "동네 운동장" : publicLot ? "공원 산책로" : "동네 어귀" };
}
function slab(c, pts, color) {
  c.fillStyle = color;
  c.beginPath();
  for (const [i, p] of pts.entries()) i ? c.lineTo(...p) : c.moveTo(...p);
  c.closePath();
  c.fill();
}
function rect(c, color, x, y, w, h) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}
function stageArt(c, t) {
  slab(c, [[-37, -5], [-8, -17], [34, -7], [6, 6]], "#a4785c");
  slab(c, [[-37, -5], [6, 6], [6, 11], [-37, 0]], "#70574b");
  slab(c, [[6, 6], [34, -7], [34, -2], [6, 11]], "#4c4850");
  for (const x of [-31, 24]) {
    rect(c, "#38464e", x, -32, 2, 30);
    rect(c, "#b7c3ba", x, -32, 1, 28);
    rect(c, "#354450", x - 4, -8, 8, 11);
    rect(c, "#8f9e9a", x - 2, -6, 4, 3);
    rect(c, "#647880", x - 2, -1, 4, 3);
  }
  slab(c, [[-35, -35], [-22, -42], [33, -40], [26, -33]], "#974f50");
  for (let j = 0; j < 6; j++) slab(c, [[-34 + j * 10, -35], [-22 + j * 9, -41], [-17 + j * 9, -41], [-29 + j * 10, -35]], j % 2 ? "#d8966c" : "#f0c586");
  rect(c, "#374750", -31, -34, 57, 3);
  rect(c, "#ceb27a", -30, -33, 55, 1);
  rect(c, "#344958", -21, -7, 12, 5);
  rect(c, "#dfb576", -21, -9, 12, 3);
  for (let j = 0; j < 5; j++) rect(c, "#f6e8c3", -20 + j * 2, -9, 1, 2);
  rect(c, "#4b4a48", -18, -4, 1, 4);
  rect(c, "#4b4a48", -11, -4, 1, 4);
  rect(c, "#734c48", 1, -11, 7, 5);
  rect(c, "#efc88f", 1, -12, 7, 2);
  rect(c, "#7e5b45", -1, -16, 1, 8);
  rect(c, "#dbb573", -4, -16, 7, 1);
  const colors = ["#ffce77", "#ec9988", "#98d6ca", "#d5b4d9"];
  for (let i = 0; i < 4; i++) {
    const x = -24 + i * 14, col = colors[(i + Math.floor(t / 2)) % 4];
    c.save();
    c.globalAlpha = 0.15;
    slab(c, [[x, -31], [x - 8, -6], [x + 7, -4]], col);
    c.restore();
    rect(c, col, x - 2, -31, 4, 3);
  }
  const performer = (x, y, id) => {
    c.save();
    c.translate(x, y);
    c.scale(0.75, 0.75);
    drawResident(c, { style: id }, { frame: Math.floor(t * 4 + id) % 8, act: "play", right: true, back: false }, 0, 0);
    c.restore();
  };
  performer(-10, -5, 23);
  performer(8, -3, 10);
  rect(c, "#403e43", 3, -13, 1, 11);
  rect(c, "#e5cfac", 1, -14, 4, 2);
  for (let i = 0; i < 3; i++) {
    const f = (t * 0.35 + i / 3) % 1, x = 12 + i * 4 + Math.sin(f * 5) * 3, y = -10 - f * 20;
    c.save();
    c.globalAlpha = 1 - f;
    rect(c, "#ffe1a1", x, y, 2, 2);
    rect(c, "#ffe1a1", x + 2, y - 4, 1, 5);
    c.restore();
  }
}
function bannerPosition(scene) {
  if (scene.venue.bannerPosition) return scene.venue.bannerPosition;
  const [cx, cy] = scene.venue.origin, { project, scale } = scene;
  const origin = project(cx + 0.73, cy + 0.93);
  const sites = [origin, ...scene.roads.filter((r) => Math.hypot(r.x - cx, r.y - cy) <= 5).map((r) => project(r.x, r.y))];
  let best = origin, bestScore = Infinity;
  for (const p of sites) {
    const [x, y] = p, l = x - 61 * scale, r = x + 62 * scale, t = y - 50 * scale;
    if (l < 0 || r > scene.base.width || t < 0 || y + 2 * scale > scene.base.height) continue;
    let covered = 0;
    for (const o of scene.objects) {
      if (o.sy < y) continue;
      const box = o.box;
      const width = Math.min(r, box.right) - Math.max(l, box.left);
      const height = Math.min(y + scale, box.bottom) - Math.max(t, box.top);
      if (width > 0 && height > 0) covered += width * height;
    }
    const score = covered / (scale * scale) + Math.hypot(x - origin[0], y - origin[1]) / scale;
    if (score < bestScore) {
      best = p;
      bestScore = score;
    }
    if (score === 0) break;
  }
  scene.venue.bannerPosition = best;
  return best;
}
function drawExamBanner(c, scene, b) {
  const [x, y] = bannerPosition(scene);
  c.save();
  c.translate(x, y);
  c.scale(scene.scale, scene.scale);
  for (const x2 of [-59, 59]) {
    rect(c, "#6a5548", x2, -47, 2, 48);
    rect(c, "#e0c99d", x2, -48, 1, 46);
    rect(c, "#edcd79", x2 - 1, -49, 4, 3);
  }
  slab(c, [[-58, -44], [0, -40], [59, -44], [59, -26], [0, -23], [-58, -26]], "#f7e8c6");
  slab(c, [[-58, -44], [0, -40], [59, -44], [59, -42], [0, -38], [-58, -42]], "#b34d44");
  for (const x2 of [-51, 47]) {
    rect(c, "#b85f50", x2, -35, 3, 3);
    rect(c, "#d09264", x2 + 3, -34, 2, 2);
  }
  c.fillStyle = "#503b39";
  c.font = 'bold 9px "Gmarket Sans",sans-serif';
  c.textAlign = "center";
  c.fillText(b.days ? "모의고사 D−" + b.days + "  ·  힘내!" : "오늘 시험, 힘내!", 0, -28, 92);
  c.restore();
}
function eventActors(c, scene, state, actor) {
  if (!state || !scene.venue) return;
  const { origin, cast } = scene.venue, [cx, cy] = origin, { project, scale } = scene;
  const prop = (x, y, ext, draw) => {
    const [u, v] = project(x, y);
    actor(v, u + ext[0] * scale, v + ext[1] * scale, u + ext[2] * scale, v + ext[3] * scale, () => {
      c.save();
      c.translate(u, v);
      c.scale(scale, scale);
      draw();
      c.restore();
    });
  };
  const e = state.show;
  if (!e) return;
  const t = e.elapsed, transition = Math.min(23, e.duration * 0.25), concert = e.type === "concert";
  if (concert) prop(cx - 0.57, cy - 0.61, [-40, -36, 38, 14], () => stageArt(c, t));
  for (const w of cast.slice(0, concert ? 14 : 10)) {
    const route = w.route, last = route.length - 1, delay = w.id % 5 * 0.085;
    const arrival = Math.max(0, Math.min(1, (t / transition - delay) / (1 - delay)));
    const departure = Math.max(0, Math.min(1, ((e.duration - t) / transition - delay) / (1 - delay)));
    const f = Math.min(arrival, departure);
    if (f <= 0) continue;
    const at = f * last, i = Math.min(last - 1, Math.floor(at)), mix = at - i, a = route[i], b = route[i + 1];
    let x = a[0] + (b[0] - a[0]) * mix, y = a[1] + (b[1] - a[1]) * mix;
    const frame = Math.floor(t * (concert ? 3 : 4) + (concert ? w.id * 0.63 : Math.floor(w.id / 5) * 2)) % 8, performing = f === 1;
    if (performing && !concert) {
      const side = w.id % 2 ? 1 : -1;
      x += side * Math.sin(frame * Math.PI / 4) * 0.13;
      y += side * Math.cos(frame * Math.PI / 4) * 0.11;
    }
    const [u, v] = project(x, y);
    actor(v, u - 8 * scale, v - 16 * scale, u + 8 * scale, v + 2 * scale, () => {
      c.save();
      c.translate(u, v - (performing && frame % 4 === 1 ? 1 : 0) * scale);
      c.scale(scale * 0.72, scale * 0.72);
      c.globalAlpha = Math.min(1, f * 12);
      drawResident(c, w, { frame, act: performing ? concert ? "cheer" : "dance" : "walk", back: performing ? concert : departure < arrival ? b[0] + b[1] > a[0] + a[1] : b[0] + b[1] < a[0] + a[1], right: performing ? w.id % 2 === 0 : (b[0] - a[0] - b[1] + a[1]) * (departure < arrival ? -1 : 1) >= 0 }, 0, 0);
      c.restore();
    });
  }
}

// Pages작업본/mm/art/classroom.js
var nightStops = [
  { action: "window", path: [[-0.34, -0.55], [-0.72, -0.58], [-0.77, 0.1]] },
  { action: "coffee", path: [[-0.34, -0.55], [-0.2, -0.7], [0.58, -0.7], [0.68, -0.56]] },
  { action: "board", path: [[-0.34, -0.55], [-0.26, -0.7], [0.17, -0.72]] },
  { action: "dance", path: [[-0.34, -0.55], [0.23, -0.62], [0.22, -0.13], [0.02, -0.09], [0.02, 0.23]] }
];
function classroomFrame(period, time, seed = 0) {
  const idle = Math.floor(time * 1.25) % 4;
  if (period !== "night" && period !== "dawn") return idle;
  const interval = 35 + seed % 9, first = 8 + seed % 6;
  if (time < first) return idle;
  const elapsed = time - first, round = Math.floor(elapsed / interval), tick = Math.floor(elapsed % interval * 6);
  return tick >= 60 ? idle : 4 + (round + seed % 4) % 4 * 60 + tick;
}
function nightMotion(frame) {
  if (frame < 4) return null;
  const stop = nightStops[Math.floor((frame - 4) / 60)], tick = (frame - 4) % 60;
  const travel = Math.min(1, Math.max(0, (tick - 4) / 14), Math.max(0, (55 - tick) / 13));
  const lengths = stop.path.slice(1).map(([x2, y2], i) => Math.hypot(x2 - stop.path[i][0], y2 - stop.path[i][1]));
  let dist = travel * lengths.reduce((a, b) => a + b, 0);
  let n = 0;
  while (n < lengths.length - 1 && dist > lengths[n]) dist -= lengths[n++];
  const [x, y] = stop.path[n], [endX, endY] = stop.path[n + 1], f = Math.min(1, dist / lengths[n]);
  return {
    x: x + (endX - x) * f,
    y: y + (endY - y) * f,
    tick,
    action: stop.action,
    acting: tick >= 18 && tick <= 42,
    rise: Math.min(1, tick / 4, (59 - tick) / 4),
    returning: tick > 42
  };
}
function classroomCatFrame(time, seed) {
  const tick = (time + seed % 7) % (58 + seed % 11);
  if (tick < 29 || tick >= 45) return Math.floor(time * 1.25) % 4;
  return 4 + Math.min(31, Math.floor((tick - 29) * 2));
}
function roomCat(c, x, y, frame) {
  const sleeping = frame < 4, r = frame - 4;
  const facing = r < 25 ? -1 : 1, curled = sleeping || r === 0 || r === 31;
  c.save();
  c.translate(x, y);
  c.scale(curled ? 1 : facing, 1);
  const px = (color, x2, y2, w, h) => {
    c.fillStyle = color;
    c.fillRect(x2, y2, w, h);
  };
  const coat = "#22252b", shine = "#41454d";
  if (curled) {
    const breath = frame === 2 ? 0.35 : 0;
    px("#695d50", -3.4, -0.25, 6.4, 0.65);
    px(coat, -3, -2.2 - breath, 4.9, 2.5);
    px(shine, -2.2, -2.6 - breath, 2.6, 0.6);
    px(coat, 1, -2.5, 2.1, 1.8);
    px(coat, 1.1, -3.4, 1, 1);
    px(coat, 2.5, -3.15, 0.65, 1);
    px("#b2a899", 2.1, -1.45, 0.8, 0.35);
    px(shine, -3.3, -1.1, 1.1, 1.1);
    px(shine, -2.6, -0.2, 3.7, 0.55);
  } else {
    const blink = r % 9 === 0, tail = Math.sin(r * 1.3);
    px(coat, -2.5, -3, 4.2, 2.6);
    px(coat, 0.8, -4.2, 2.5, 2.25);
    px(coat, 1, -5.15, 0.7, 1.15);
    px(coat, 2.7, -5, 0.65, 1.1);
    px(shine, -2, -3.3, 2.4, 0.55);
    px("#c6be80", 2.65, -3.5, 0.55, blink ? 0.25 : 0.62);
    px(coat, -2, -0.65, 1, 1.3);
    px(coat, 0.8, -0.65, 1.15, 1.25);
    px(coat, -3.4, -2.65, 1.5, 1);
    px(shine, -3.65, -4 + tail * 0.4, 0.8, 1.8);
  }
  c.restore();
}
function drawClassroom(c, d, period, pose, catFrame = 0) {
  const motion = nightMotion(pose);
  if (motion) pose = motion.tick % 4;
  const ax = d.rx * 0.94, ay = d.ry * 0.94, floor = d.height, night = period === "night" || period === "dawn";
  const p = (x, y, z = 0) => [x * ax - y * ay, (x * ax + y * ay) / 2 - floor - z];
  const poly = (color, pts) => {
    c.beginPath();
    pts.map(([x, y, z]) => p(x, y, z)).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  };
  const stroke = (color, pts, width = 0.55) => {
    c.beginPath();
    pts.map(([x, y, z]) => p(x, y, z)).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.lineWidth = width;
    c.strokeStyle = color;
    c.stroke();
  };
  const top = (color, x0, y0, x1, y1, z) => poly(color, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);
  const north = (color, y, x0, x1, b, t) => poly(color, [[x0, y, b], [x1, y, b], [x1, y, t], [x0, y, t]]);
  const west = (color, x, y0, y1, b, t) => poly(color, [[x, y0, b], [x, y1, b], [x, y1, t], [x, y0, t]]);
  const cube = (x0, y0, x1, y1, z0, z1, lid, front, side) => {
    north(front, y1, x0, x1, z0, z1);
    west(side, x1, y0, y1, z0, z1);
    top(lid, x0, y0, x1, y1, z1);
  };
  const ink2 = night ? "#343942" : "#62594d", wood = night ? "#77634f" : "#c79560";
  const paper = night ? "#ffdfa1" : "#fff3d6";
  c.save();
  c.lineJoin = "miter";
  c.lineCap = "square";
  north(night ? "#304d50" : "#3f716f", 1, -1, 1, -6, -0.4);
  north(night ? "#536b70" : "#8fb2af", 1, -0.89, -0.3, -floor + 1, -7);
  north("#becdc3", 1, -0.61, -0.58, -floor + 1, -7);
  const [sx, sy] = p(-1, 1, -0.6);
  c.save();
  c.translate(sx, sy);
  c.transform(1, 0.5, 0, 1, 0, 0);
  c.font = 'bold 4.1px "Gmarket Sans",sans-serif';
  c.textBaseline = "middle";
  c.textAlign = "center";
  c.fillStyle = "#f9ebc9";
  c.fillText("입실론수학학원", ax, 2.5, ax * 1.86);
  c.restore();
  top(night ? "#726253" : "#dbb889", -1, -1, 1, 1, 0);
  for (let i = 1; i < 9; i++) {
    const y = -1 + i * 2 / 9;
    stroke(night ? "#63584f" : "#c8a578", [[-1, y, 0], [1, y, 0]], 0.36);
  }
  cube(-1, -1, 1, -0.93, 0, 15, night ? "#9a9e93" : "#f2ecd2", night ? "#777b75" : "#e4d8b9", ink2);
  cube(-1, -0.93, -0.93, 1, 0, 15, night ? "#84908a" : "#ebdfbf", ink2, night ? "#58666a" : "#bebfae");
  north("#75583f", -0.915, -0.86, 0.57, 4.1, 13.65);
  north(night ? "#304a43" : "#365f50", -0.901, -0.82, 0.53, 4.75, 13.12);
  const chalk = night ? "#98a99c" : "#dfecd8";
  stroke(chalk, [[-0.69, -0.895, 7], [-0.61, -0.895, 8.5], [-0.49, -0.895, 7.65], [-0.37, -0.895, 10.8]], 0.65);
  for (const [x, z, len] of [[-0.2, 10.7, 0.27], [-0.2, 9.2, 0.17], [0.12, 7.4, 0.18]]) stroke(chalk, [[x, -0.895, z], [x + len, -0.895, z]], 0.5);
  cube(-0.86, -0.92, 0.57, -0.84, 4, 4.55, "#c3a277", ink2, ink2);
  const [cx, cy] = p(0.79, -0.89, 11);
  c.fillStyle = "#444e4b";
  c.fillRect(cx - 1.75, cy - 1.75, 3.5, 3.5);
  c.fillStyle = night ? "#cdc7ab" : "#faf3d9";
  c.fillRect(cx - 1.25, cy - 1.25, 2.5, 2.5);
  c.fillStyle = ink2;
  c.fillRect(cx - 0.1, cy - 1, 0.45, 1.15);
  c.fillRect(cx, cy, 0.9, 0.4);
  west("#506067", -0.917, -0.56, 0.66, 5.3, 12.9);
  west(night ? "#35485f" : "#b9d7d8", -0.907, -0.5, 0.6, 5.9, 12.3);
  west(night ? "#65777a" : "#edf0d9", -0.898, -0.01, 0.035, 5.9, 12.3);
  cube(-0.94, -0.56, -0.82, 0.67, 5.1, 5.65, "#a9a79a", ink2, ink2);
  if (night) {
    poly("#a27f57", [[-0.74, -0.7, 0.01], [0.19, -0.78, 0.01], [0.47, -0.15, 0.01], [0.26, 0.25, 0.01], [-0.44, 0.3, 0.01], [-0.84, -0.07, 0.01]]);
  }
  const furniture2 = [];
  function place(x, y, draw) {
    furniture2.push({ depth: x * ax + y * ay, draw });
  }
  function desk(x, y, w, depth, height, lit) {
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - depth / 2, y1 = y + depth / 2;
    for (const px of [x0 + 0.025, x1 - 0.035]) for (const py of [y0 + 0.025, y1 - 0.035]) stroke(ink2, [[px, py, 0.15], [px, py, height]], 0.7);
    cube(x0, y0, x1, y1, height - 0.85, height, lit ? "#daa86e" : wood, night ? "#69513e" : "#ab794b", night ? "#514d46" : "#846849");
  }
  function reader(x, y, variant) {
    const [u, v] = p(x, y, 0), tone = ["#648284", "#637491", "#a07467", "#78836f"][variant];
    c.fillStyle = "#655444";
    c.fillRect(u - 1.6, v - 2.4, 3.4, 1.3);
    c.fillStyle = "#474845";
    c.fillRect(u - 1.25, v - 0.95, 1.2, 1.15);
    c.fillRect(u + 0.6, v - 1, 1.25, 0.9);
    c.fillStyle = tone;
    c.fillRect(u - 1.7, v - 5.7, 3.6, 3.8);
    const lean = pose === variant ? 0.45 : 0;
    c.fillStyle = "#dfaf82";
    c.fillRect(u - 1.6 + lean, v - 8, 3.1, 2.7);
    c.fillStyle = ["#49403d", "#4d4140", "#684939", "#403e42"][variant];
    c.fillRect(u - 1.8 + lean, v - 8.8, 3.6, 2.6);
    c.fillStyle = "#d7a37f";
    c.fillRect(u + 1.45, v - 4.8, 1.3, 1);
    if (variant === 2 && pose >= 2) {
      c.fillStyle = tone;
      c.fillRect(u + 1.45, v - 6.6, 1.3, 2.7);
      c.fillStyle = "#e2b48a";
      c.fillRect(u + 2, v - 9.15, 1.05, 3.25);
    }
  }
  for (const [i, [x, y]] of [[-0.39, 0.04], [0.42, 0.04], [-0.39, 0.65], [0.42, 0.65]].entries()) {
    place(x, y, () => {
      desk(x, y, 0.53, 0.29, 3.1, false);
      if (!night) top("#f4e3be", x - 0.12, y - 0.09, x + 0.08, y + 0.075, 3.13);
    });
    place(x, y + 0.16, () => {
      cube(x - 0.115, y + 0.08, x + 0.115, y + 0.24, 1.7, 2.3, night ? "#675c52" : "#8f775d", ink2, ink2);
      if (!night) reader(x, y + 0.18, i);
    });
  }
  if (!night) {
    place(0.43, -0.65, () => {
      const [u, v] = p(0.43, -0.65, 0), lift = [0, 0.45, 1, 0.45][pose];
      c.fillStyle = "#373e42";
      c.fillRect(u - 1.55, v - 3.3, 1.3, 3.5);
      c.fillRect(u + 0.72, v - 3.4, 1.3, 3.4);
      c.fillStyle = "#294959";
      c.fillRect(u - 2.15, v - 8.3, 4.3, 5.4);
      c.fillStyle = "#e2dac0";
      c.fillRect(u - 0.6, v - 8.25, 1.25, 2.3);
      c.fillStyle = "#516e75";
      c.fillRect(u + 1.5, v - 7.8, 1.1, 2.65);
      c.fillStyle = "#e2ae83";
      c.fillRect(u + 1.8, v - 5.6, 0.95, 1.8);
      c.fillRect(u - 1.6, v - 11.2, 3.3, 3.1);
      c.fillStyle = "#3f3735";
      c.fillRect(u - 1.85, v - 12.1, 3.8, 1.75);
      c.fillStyle = "#526168";
      c.fillRect(u - 1.7, v - 10.3, 2.9, 0.55);
      c.fillRect(u - 1.6, v - 10.1, 0.4, 0.65);
      c.fillRect(u + 0.45, v - 10.1, 0.4, 0.6);
      c.strokeStyle = "#e3ae83";
      c.lineWidth = 1.25;
      c.beginPath();
      c.moveTo(u - 1.75, v - 7.45);
      c.lineTo(u - 3.3, v - 8.1 - lift);
      c.lineTo(u - 5, v - 9.6 - lift);
      c.stroke();
      c.fillStyle = "#fff1c5";
      c.fillRect(u - 5.8, v - 10.4 - lift, 1.25, 0.75);
    });
  } else {
    place(0.84, -0.65, () => {
      desk(0.83, -0.65, 0.28, 0.32, 3.5, false);
      const [mx, my] = p(0.82, -0.71, 3.55), pour = motion?.action === "coffee" && motion.acting;
      c.fillStyle = "#484a48";
      c.fillRect(mx - 2.6, my - 5.7, 1, 5.6);
      c.fillRect(mx - 2.6, my - 5.8, 4.7, 0.9);
      c.fillStyle = "#c68c64";
      c.fillRect(mx - 0.9, my - 4.9, 2.8, 1.2);
      c.fillRect(mx - 0.35, my - 3.8, 1.65, 0.95);
      c.fillStyle = "#b4cdcb";
      c.fillRect(mx - 1, my - 1.65, 3.4, 1.75);
      c.fillStyle = "#79523d";
      c.fillRect(mx - 0.65, my - 0.85, 2.7, 0.75);
      if (pour && motion.tick < 31) {
        c.fillStyle = "#dfac6e";
        c.fillRect(mx + 0.3, my - 2.9 + pose % 2 * 0.45, 0.55, 0.95);
      }
    });
    if (!motion) {
      place(-0.34, -0.55, () => {
        const [u, v] = p(-0.34, -0.55, 0), nod = pose === 2 ? 0.55 : 0;
        c.fillStyle = "#46444b";
        c.fillRect(u - 2.1, v - 5, 4.3, 5.1);
        c.fillStyle = "#355461";
        c.fillRect(u - 2.05, v - 7, 4.2, 4.15);
        c.fillStyle = "#67808a";
        c.fillRect(u - 0.5, v - 7.35, 2.55, 2.8);
        c.fillStyle = "#e1d4b6";
        c.fillRect(u + 0.55, v - 7.25, 0.7, 1.4);
        c.fillStyle = "#bd8967";
        c.fillRect(u - 0.9, v - 7.8 + nod, 2.2, 1.15);
        c.fillStyle = "#edbd8e";
        c.fillRect(u - 1.4, v - 10 + nod, 3.4, 2.7);
        c.fillRect(u + 1.85, v - 8.95 + nod, 0.7, 0.8);
        c.fillStyle = "#403b37";
        c.fillRect(u - 1.75, v - 10.95 + nod, 3.65, 1.6);
        c.fillRect(u - 1.6, v - 9.6 + nod, 0.85, 1.2);
        c.fillStyle = "#454f4e";
        c.fillRect(u + 0.4, v - 9.2 + nod, 1.85, 0.45);
        c.fillRect(u + 1.65, v - 9 + nod, 0.5, 0.65);
      });
    } else {
      place(motion.x, motion.y, () => {
        const { action: action2, acting, tick, rise, returning } = motion;
        const [u, v] = p(motion.x, motion.y), beat = Math.sin(tick * Math.PI / 3), dance = acting && action2 === "dance";
        const walk = !acting && tick > 4 && tick < 55, step = walk ? beat * 0.9 : 0;
        const hop = dance ? Math.max(0, Math.sin(tick * Math.PI / 3)) * 1.8 : 0;
        const lean = dance ? beat * 1.25 : 0, bodyY = v - hop + (1 - rise) * 2.25;
        const line2 = (color, w, ...pts) => {
          c.beginPath();
          pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b));
          c.lineWidth = w;
          c.strokeStyle = color;
          c.stroke();
        };
        const coat = "#466977", skin2 = "#edbb8c", leg = "#383e48";
        const back2 = acting && (action2 === "window" || action2 === "board"), left = acting ? action2 === "window" : returning !== (action2 === "window");
        const head = u + lean + (acting && action2 === "window" ? -0.55 : 0);
        line2(leg, 1.35, [u - 0.9, bodyY - 4.5], [u - 1.2 - step - (dance ? 1.4 : 0), v - 0.6 - hop]);
        line2(leg, 1.35, [u + 1, bodyY - 4.5], [u + 1.4 + step + (dance ? 1.3 : 0), v - 0.35 - hop]);
        c.fillStyle = coat;
        c.fillRect(head - 2, bodyY - 8.2, 4.15, 4.65);
        c.fillStyle = "#829997";
        c.fillRect(head - 1.8, bodyY - 8.1, 3.5, 0.65);
        c.fillStyle = skin2;
        c.fillRect(head - 1.55, bodyY - 11.1, 3.15, 2.8);
        c.fillStyle = "#453d39";
        c.fillRect(head - 1.75, bodyY - 12, 3.6, back2 ? 2.8 : 1.5);
        c.fillRect(head + (left ? 0.8 : -1.6), bodyY - 10.8, 1.05, 1.4);
        if (!back2) {
          const dx = left ? -1.9 : 0.25;
          c.fillStyle = "#354a50";
          c.fillRect(head + dx, bodyY - 10.2, 1.8, 0.55);
        }
        function arm(side, ex, ey, hx, hy) {
          line2(coat, 1.3, [head + side * 1.5, bodyY - 7.35], [ex, ey]);
          line2(skin2, 0.95, [ex, ey], [hx, hy]);
        }
        if (acting && action2 === "board") {
          const progress = (tick - 18) / 24, bx = 0.2 + 0.28 * progress, bz = 8.1 + Math.sin(progress * Math.PI * 4) * 1.1;
          const [px, py] = p(bx, -0.895, bz);
          for (let j = 1; j <= tick - 18; j++) {
            const a = (j - 1) / 24, b = j / 24;
            stroke("#d3d2b7", [[0.2 + 0.28 * a, -0.895, 8.1 + Math.sin(a * Math.PI * 4) * 1.1], [0.2 + 0.28 * b, -0.895, 8.1 + Math.sin(b * Math.PI * 4) * 1.1]], 0.55);
          }
          arm(1, (u + px) / 2, bodyY - 6.9, px, py);
          c.fillStyle = "#f3edcc";
          c.fillRect(px, py - 0.7, 1, 0.65);
          arm(-1, u - 2.1, bodyY - 5.8, u - 1.75, bodyY - 4.5);
        } else if (acting && action2 === "window") {
          const [wx, wy] = p(-0.88, 0.15, 5.65);
          arm(-1, u - 3, bodyY - 7.7, wx, wy);
          arm(1, u + 1.8, bodyY - 5.8, u + 0.4, bodyY - 4.9);
        } else if (acting && action2 === "coffee") {
          const sip = Math.min(1, Math.max(0, (tick - 29) / 4), Math.max(0, (42 - tick) / 4));
          const [potX, potY] = p(0.82, -0.71, 3.55);
          const hx = potX + (u + 1.9 - potX) * sip, hy = potY - 1 + (bodyY - 9.6 - (potY - 1)) * sip;
          arm(1, u + 3.3, bodyY - 5.7, hx - 0.5, hy + 0.6);
          arm(-1, u - 2, bodyY - 5.8, u - 0.8, bodyY - 4.35);
          c.fillStyle = "#f1dfb7";
          c.fillRect(hx - 1, hy - 0.6, 2.3, 1.8);
          c.fillRect(hx + 1.3, hy - 0.3, 0.75, 0.85);
          if (tick > 24) {
            c.fillStyle = "#c3c6b1";
            c.fillRect(hx + pose % 2 * 0.5, hy - 2.3 - pose % 2 * 0.3, 0.5, 0.9);
          }
        } else if (dance) {
          arm(-1, u - 3.3, bodyY - 7.8 - beat, u - 4.1, bodyY - 8.8 - beat * 2);
          arm(1, u + 3.25, bodyY - 7.7 + beat, u + 4.25, bodyY - 9.2 + beat * 2);
        } else {
          arm(-1, u - 2.1 - step, bodyY - 5.9, u - 1.9 - step, bodyY - 4.8);
          arm(1, u + 2.2 + step, bodyY - 6, u + 2 + step, bodyY - 4.7);
        }
      });
    }
    place(-0.24, -0.32, () => {
      desk(-0.24, -0.32, 0.86, 0.39, 3.8, true);
      top("#ddcca5", -0.51, -0.39, -0.36, -0.16, 3.9);
      top(paper, -0.36, -0.39, -0.15, -0.16, 3.93);
      stroke("#ba8b67", [[-0.36, -0.39, 4], [-0.36, -0.16, 4]], 0.45);
      stroke("#997650", [[-0.31, -0.26, 4], [-0.21, -0.26, 4]], 0.4);
      if (!motion && pose === 3) poly("#fff2c9", [[-0.27, -0.35, 3.98], [-0.16, -0.35, 4.9], [-0.16, -0.18, 4.6], [-0.27, -0.18, 3.98]]);
      if (!motion) {
        const [u, v] = p(-0.27, -0.35, 4);
        const [shoulderX, shoulderY] = p(-0.34, -0.55, 6.2);
        c.lineWidth = 1.6;
        c.strokeStyle = "#547481";
        c.beginPath();
        c.moveTo(shoulderX + 0.8, shoulderY);
        c.lineTo(shoulderX + 1.7, shoulderY + 1.4);
        c.lineTo(u - 1.35, v - 1.4);
        c.stroke();
        c.fillStyle = "#efbe90";
        c.fillRect(u - 1.45, v - 1.55, 2 + pose * 0.29, 1.1);
        c.fillStyle = "#384a50";
        c.fillRect(u + 0.4 + pose * 0.29, v - 2, 0.55, 1.65);
      }
      cube(-0.05, -0.48, 0.065, -0.34, 4, 5, "#93a3a0", ink2, ink2);
      north("#344a54", -0.38, -0.02, 0.12, 4.8, 8);
      north("#c6daca", -0.375, -8e-3, 0.109, 5.1, 7.7);
      const [lx, ly] = p(-0.55, -0.38, 3.8);
      c.fillStyle = "#59574c";
      c.fillRect(lx - 0.7, ly - 4.1, 0.8, 4);
      c.fillRect(lx - 0.9, ly - 0.5, 2.5, 0.6);
      c.fillStyle = "#c0864b";
      c.fillRect(lx - 0.7, ly - 5.6, 1.8, 0.9);
      c.fillRect(lx - 1.2, ly - 4.8, 3.2, 1.1);
      c.fillStyle = "#fff2b8";
      c.fillRect(lx - 1.25, ly - 3.8, 3.3, 0.6);
    });
  }
  if (night) {
    const tick = catFrame - 4, toWindow = catFrame < 4 ? 0 : Math.max(0, Math.min(1, (tick - 1) / 5, (30 - tick) / 5));
    const x = -0.56 + (-0.875 + 0.56) * toWindow, y = -0.2 + 0.48 * toWindow;
    const z = 4.05 + 1.65 * toWindow + Math.sin(Math.PI * toWindow) * 4.1;
    place(toWindow < 0.3 ? -0.19 : x, toWindow < 0.3 ? -0.29 : y, () => {
      const [u, v] = p(x, y, z);
      roomCat(c, u, v, catFrame);
    });
  }
  furniture2.sort((a, b) => a.depth - b.depth).forEach((obj) => obj.draw());
  north(night ? "#aa9272" : "#e5cfab", 1, -1, 1, -0.8, 0.65);
  west(night ? "#8e816f" : "#b5a48c", 1, -1, 1, -0.8, 0.65);
  c.restore();
}

// Pages작업본/mm/art/campus-life.js
function cat(c, x, y, s, t, feeding, variant) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const coat = ["#d19458", "#67656a", "#eee2c8"][variant % 3], ink2 = "#554846", step = feeding ? 0 : Math.floor(t * 2) % 2;
  const box = (col, u, v, w, h) => {
    c.fillStyle = col;
    c.fillRect(u, v, w, h);
  };
  box(ink2, -5, -3, 6, 3);
  box(coat, -5, -4, 6, 3);
  box(coat, 1, -5 + step, 3, 3);
  box(ink2, 1, -6 + step, 1, 1);
  box(ink2, 3, -6 + step, 1, 1);
  box(coat, -7, -6 + step, 1, 4);
  box(coat, -6, -4, 2, 1);
  box(ink2, -4 - step, -1, 1, 2);
  box(ink2, -1 + step, -1, 1, 2);
  c.restore();
}
function costume(c, style, p, time) {
  const flip = p.right ? 1 : -1;
  c.scale(flip, 1);
  const box = (col, x, y, w, h) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  }, beat = Math.floor(time * 2) % 2;
  if (style === 9) {
    shape(c, "#49948c", [[-2, -16], [-8, -13], [-12, -6 + beat], [-5, -8], [1, -12]]);
    box("#d3f0a6", -4, -18, 7, 2);
    box("#428477", -4, -20, 6, 2);
    box("#ffce73", 2, -10, 5, 5);
  } else if (style === 10) {
    box("#7c5463", -4, -19, 6, 4);
    box("#dec093", -3, -17, 6, 1);
    shape(c, "#b88243", [[1, -11], [7, -12], [9, -9], [7, -4], [4, -2], [1, -6]]);
    box("#f3d986", 4, -10, 1, 5);
  } else {
    box("#6b4485", -4, -19, 6, 3);
    box("#82dce4", -4, -17, 7, 2);
    box("#704982", -6, -12, 4, 7);
    box("#d5dfe1", 4, -12 + beat, 2, 6);
    box("#96dce0", 3, -14 + beat, 1, 3);
    box("#96dce0", 6, -14 + beat, 1, 3);
  }
}
function campusActors(c, scene, time, actor) {
  const { academy, scale, project, walkers, cats, heroes } = scene;
  if (academy) {
    const o = academy;
    actor(o.sy + 0.01, o.box.left, o.box.top, o.box.right, o.box.bottom, () => {
      c.drawImage(o.sprite.image, o.sprite.left, o.sprite.top, o.sprite.width, o.sprite.height);
      if (scene.ticker) drawSign(c, o, scale, time, scene.ticker);
    });
  }
  for (const [idx, feeder] of cats.entries()) {
    const p = residentPose(feeder, time), feeding = p.act === "feed", home = feeder.stops.find((a) => a.act === "feed")?.tile || feeder.stops[0].tile;
    const [bx, by] = project(home.x + 0.18, home.y + 0.16);
    actor(by, bx - 5 * scale, by - 3 * scale, bx + 5 * scale, by + 2 * scale, () => {
      c.fillStyle = "#8c5545";
      c.fillRect(bx - 2 * scale, by - 1.5 * scale, 4 * scale, 1.5 * scale);
      c.fillStyle = "#e5b879";
      c.fillRect(bx - scale, by - 2 * scale, 2 * scale, scale);
    });
    const phase2 = time * 0.12 + idx * 2, range = 0.12 + 0.12 * Math.cos(phase2);
    const [x, y] = project(feeding ? p.x + 0.16 : home.x + 0.16 + range, feeding ? p.y + 0.14 : home.y + 0.14);
    actor(y, x - 9 * scale, y - 10 * scale, x + 8 * scale, y + 3 * scale, () => {
      cat(c, x, y, scale * 0.7, time, feeding, idx);
    });
  }
  for (const [i, style] of heroes.entries()) {
    const w = walkers[(i + 1) % walkers.length];
    if (!w) continue;
    const p = residentPose(w, time + 13 * (i + 1)), [x, y] = project(p.x + 0.1, p.y + 0.08);
    actor(y, x - 13 * scale, y - 22 * scale, x + 13 * scale, y + 4 * scale, () => {
      c.save();
      c.translate(x, y);
      c.scale(scale * 0.66, scale * 0.66);
      drawResident(c, { ...w, style: style * 2, companion: false }, p, 0, 0);
      c.scale(0.76, 0.76);
      costume(c, style, p, time);
      c.restore();
    });
  }
}

// Pages작업본/mm/art/city-edge.js
function fringe(c, project, scale, cells, form, seed) {
  const blocks = new Set(cells.map(([a, b]) => key2(a, b))), near = /* @__PURE__ */ new Set();
  for (const [a, b] of cells) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++)
    if (!blocks.has(key2(a + i, b + j))) near.add(key2(a + i, b + j));
  const shrubs = [];
  const ridge = (x, y) => Math.sin(x * 0.37 + y * 0.2 + seed.length) * 0.32 + Math.sin(y * 0.68 - x * 0.15) * 0.24;
  for (const addr of near) {
    const [a, b] = addr.split(",").map(Number);
    const neighbors = cells.filter(([i, j]) => Math.abs(i - a) <= 1 && Math.abs(j - b) <= 1);
    const distance2 = (x2, y2) => Math.min(...neighbors.map(([i, j]) => Math.hypot(Math.max(4 * i - x2, 0, x2 - 4 * i - 4), Math.max(4 * j - y2, 0, y2 - 4 * j - 4))));
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const salt = addr + "/" + i + "/" + j, r = random(seed, "edge/" + salt);
      const x2 = a * 4 + (i + 0.12 + 0.76 * random(seed, "east" + salt)) / 2, y2 = b * 4 + (j + 0.12 + 0.76 * random(seed, "north" + salt)) / 2;
      const d = distance2(x2, y2), wave = ridge(x2, y2);
      if (d > 2.45 + wave || d < 0.1) continue;
      const tint = Math.max(0, 1 - d / (2.65 + wave)), [u, v] = project(x2, y2);
      c.fillStyle = "rgba(185,179,134," + tint * 0.63 + ")";
      c.beginPath();
      c.ellipse(u, v, (12 + 4 * r) * scale, (6 + 2 * r) * scale, -0.1, 0, 2 * Math.PI);
      c.fill();
      if (form.waterAxis && Math.abs((form.waterAxis === "x" ? x2 : y2) - form.waterLine) < 0.91) continue;
      if (d > 0.48 && r > 0.71 + Math.cos(x2 * 0.66 + y2 * 0.31) * 0.12) {
        shrubs.push({ id: r > 0.94 ? "plane" : r > 0.83 ? "linden" : "pine", t: { x: x2, y: y2 }, w: 4 + d * (1.1 + r * 3.1), background: true, flip: r > 0.88 });
      }
    }
    const sides = [[1, 0], [0, 1], [-1, 0], [0, -1]].filter(([dx2, dy2]) => blocks.has(key2(a - dx2, b - dy2)));
    if (!sides.length || random(seed, "gardenlot" + addr) > 0.41) continue;
    const [dx, dy] = sides[0], x = 4 * a + 2 - 2 * dx, y = 4 * b + 2 - 2 * dy;
    const p = (along, across) => project(x + dx * along - dy * across, y + dy * along + dx * across);
    const hand = random(seed, "hedge" + addr) < 0.5 ? -1 : 1, end = 2.2 + random(seed, "track" + addr) * 1.15;
    const track = [p(0, -0.15 * hand), p(0.48, -0.2 * hand), p(0.9, -0.03 * hand), p(1.4, 0.37 * hand), p(1.9, 0.46 * hand), p(end, 0.24 * hand)];
    line(c, "#b5a386", 3.3 * scale, track);
    line(c, "#d8c5a1", 1.9 * scale, track);
    const world = (u, v) => ({ x: x + dx * u - dy * v, y: y + dy * u + dx * v });
    const bankSafe = (t) => !form.waterAxis || Math.abs((form.waterAxis === "x" ? t.x : t.y) - form.waterLine) > 1.05;
    for (const [idx, [along, off]] of [[1.1, -0.52 * hand], [end - 0.22, 0.77 * hand]].entries()) {
      const t = world(along, off);
      if (!bankSafe(t) || blocks.has(key2(Math.floor(t.x / 4), Math.floor(t.y / 4)))) continue;
      const corners = [[-0.33, -0.28], [0.38, -0.28], [0.36, 0.36], [-0.35, 0.33]].map(([u, v]) => project(t.x + u, t.y + v));
      shape(c, idx ? "#9caf83" : "#bfb391", corners);
      shrubs.push({ id: idx ? "cottage" : "bakery", label: idx ? "외곽 전원주택" : "텃밭 관리동", t, w: idx ? 21 : 15, ordinaryWidth: idx ? 21 : 15, background: true, flip: hand < 0 });
    }
    for (let n = 0; n < 4; n++) {
      const k = 0.35 + n * 0.2;
      shape(c, n % 2 ? "#96a477" : "#ad9d74", [p(0.78, k), p(1.56, k + 0.17), p(1.5, k + 0.29), p(0.77, k + 0.1)]);
    }
  }
  return shrubs;
}

// Pages작업본/mm/art/city-trees.js
var palettes = {
  plane: ["#486a50", "#5b855f", "#77a26c", "#94b87f", "#abc58b"],
  linden: ["#4f6948", "#668553", "#82a45e", "#9bb570", "#b8c781"],
  flowering: ["#936d83", "#b97f99", "#d79db2", "#e9b8c7", "#f8d8dc"],
  fir: ["#3f614b", "#507751", "#70935e", "#89a568", "#a0b779"],
  pine: ["#44634d", "#547657", "#6f9165", "#86a474", "#a2b685"]
};
var native = /* @__PURE__ */ new Map();
function treeTile(c, o) {
  if (!Object.hasOwn(palettes, o.id)) return false;
  const variant = Math.abs(Math.round(o.t.x * 7 + o.t.y * 3)) % 4, tag = o.id + variant + o.period;
  let sprite2 = native.get(tag);
  if (!sprite2) {
    let cluster = function(cx, cy, rx, ry, tier) {
      for (let v = -ry; v <= ry; v++) {
        const width = conifer ? (1 + (v + ry) / (2 * ry)) * rx * 0.57 : Math.sqrt(Math.max(0, 1 - v * v / (ry * ry))) * rx;
        for (let u = Math.ceil(-width); u <= width; u++) {
          const tex = ((cx * 23 + u * 47 + v * 71 + variant * 29) % 17 + 17) % 17, light = -(u / rx * 0.47 + v / ry * 0.7) + (tex - 8) * 0.055;
          const idx = Math.max(0, Math.min(4, Math.floor(1.6 + tier + light * 1.35)));
          g.fillStyle = colors[idx];
          g.fillRect(cx + u, cy + v, 1, 1);
        }
      }
    };
    sprite2 = document.createElement("canvas");
    sprite2.width = 28;
    sprite2.height = 32;
    const g = sprite2.getContext("2d"), ink2 = (h) => surface(h, o.period), colors = palettes[o.id].map(ink2);
    g.fillStyle = ink2("#755f48");
    g.fillRect(13, 19, 2, 12);
    g.fillRect(10, 21, 3, 2);
    g.fillRect(15, 21, 3, 2);
    const conifer = o.id === "pine" || o.id === "fir";
    if (conifer) {
      cluster(14, 18, 11, 7, 0);
      cluster(13, 12, 8, 7, 0.35);
      cluster(13, 7, 5, 6, 0.45);
    } else {
      cluster(15, 17, 9, 6, 0);
      cluster(8, 15, 6, 6, 0.2);
      cluster(20, 13, 6, 6, 0.25);
      cluster(13, 10, 9, 7, 0.55);
      cluster(10 + variant, 7, 5, 4, 0.8);
    }
    native.set(tag, sprite2);
  }
  const w = o.dw * 1.12;
  c.drawImage(sprite2, Math.round(o.sx - w * 0.5), Math.round(o.foot - w * 32 / 28), w, w * 32 / 28);
  return true;
}

// Pages작업본/mm/art/city-frontage.js
var finishes = [
  ["#f0ecda", "#d1d2c9", "#a2b0ad", "#71859c"],
  ["#eee3ca", "#cec1aa", "#9eaaae", "#b76851"],
  ["#e0e7e4", "#bbcbd0", "#859ca8", "#507494"],
  ["#e3cead", "#c6ab91", "#998e86", "#779473"],
  ["#d38c70", "#ab7265", "#7d7979", "#555f80"],
  ["#e9dac7", "#c6b8b5", "#9c979d", "#786a8f"]
];
var cached2 = /* @__PURE__ */ new Map();
var roomFrames = /* @__PURE__ */ new Map();
function bitmap2(d, period, pose, catPose) {
  const { rx, ry, height: h, type, seed } = d;
  const hw = Math.ceil(rx + ry) + 4, up = Math.ceil(d.sky) + 10, down = Math.ceil((rx + ry) / 2) + 4;
  const density = type === "academy" ? 2 : 1;
  const image = document.createElement("canvas");
  image.width = hw * 2 * density;
  image.height = (up + down) * density;
  const c = image.getContext("2d");
  c.scale(density, density);
  c.translate(hw, up);
  function paint(color, pts, lit = false) {
    c.fillStyle = lit ? color : surface(color, period);
    c.beginPath();
    pts.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y)));
    c.closePath();
    c.fill();
  }
  const P = (x, y, z = 0) => [x - y, (x + y) * 0.5 - z];
  const poly = (color, xyz, lit = false) => paint(color, xyz.map((t) => P(...t)), lit);
  const slab2 = (x0, y0, x1, y1, z, col) => poly(col, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);
  const rect2 = (col, x, y, w, h2, lit = false) => {
    c.fillStyle = lit ? col : surface(col, period);
    c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h2)));
  };
  const n = (a, b = 0) => {
    let v = Math.imul((seed ^ Math.imul(a + 1, 1597334677) ^ Math.imul(b + 3, 3812015801)) >>> 0, 2246822519);
    return ((v ^ v >>> 15) >>> 0) / 4294967296;
  };
  const pick = (arr, k) => arr[Math.floor(n(k) * arr.length)];
  const pal = finishes[seed % finishes.length], roof = pick(["#535d80", "#b56757", "#68858c", "#687a98", "#ad795d", "#72896e"], 41);
  const warm = ["#ffdb79", "#ffeeb0", "#efb360", "#f9d899"], winRate = periods[period].windows[d.zone] ?? 0.12;
  function face(x0, y0, x1, y1, z0, z1, side, u0, u1, h0, h1, color, lit = false) {
    const q = (u, h2) => side ? P(x1, y0 + (y1 - y0) * u, h2) : P(x0 + (x1 - x0) * u, y1, h2);
    paint(color, [q(u0, z0 + h0), q(u1, z0 + h0), q(u1, z0 + h1), q(u0, z0 + h1)], lit);
  }
  function mass(x0, y0, x1, y1, z0, z1, finish = "normal", fenestration = true) {
    const glass2 = finish === "glass", dark = finish === "charcoal", brick = finish === "brick", white = finish === "ivory";
    const left = glass2 ? "#749ab2" : dark ? "#747d94" : brick ? "#c1846b" : white ? "#e9e9dd" : pal[0];
    const right = glass2 ? "#416c8a" : dark ? "#505c78" : brick ? "#975e56" : white ? "#acbbbf" : pal[1];
    const roofcol = glass2 ? "#9aafb6" : dark ? "#8792a0" : brick ? "#b39986" : white ? "#c6d0c7" : pal[2];
    for (let side = 0; side < 2; side++) {
      const f = (u, v, low2, high, col, light = false) => face(x0, y0, x1, y1, z0, z1, side, u, v, low2, high, col, light);
      const height = z1 - z0, len = side ? y1 - y0 : x1 - x0, cols = Math.max(2, Math.round(len / (glass2 ? 3.9 : 5.1)));
      f(0, 1, 0, height, side ? right : left);
      if (!fenestration) continue;
      const rows = Math.max(1, Math.floor((height - 1) / d.floorHeight)), pitch = (height - 1) / rows;
      for (let r = 0; r < rows; r++) {
        const z = 1 + r * pitch;
        if (glass2 || type === "balcony" || type === "retail" && r === 0) f(0, 1, z, z + 0.75, glass2 ? side ? "#828fa0" : "#b7cbd1" : side ? "#9aa2a0" : "#d4d5c4");
        for (let k = 0; k < cols; k++) {
          const q = k / cols, sz = 1 / cols;
          const on = n(k + side * 57, r + Math.floor(z0) * 2) < winRate;
          const pane = on ? warm[Math.floor(n(126 + k, r) * warm.length)] : glass2 ? k % 4 === 0 ? side ? "#547d99" : "#a0c2cb" : side ? "#345872" : "#64839e" : side ? "#546572" : r % 4 === 2 ? "#7d94a0" : "#637f91";
          f(q + sz * (glass2 ? 0.09 : 0.19), q + sz * (glass2 ? 0.88 : 0.72), z + 0.55, Math.min(height, z + pitch * (glass2 ? 0.84 : 0.78)), pane, on);
          if (!glass2 && r > 0 && k % 3 === 1 && type === "apartment") f(q + 0.08 * sz, q + 0.8 * sz, z - 0.3, z + 0.45, side ? "#c2c7bf" : "#f4ecdb");
        }
      }
      if (type === "apartment" || type === "balcony" || type === "glass") {
        const band = type === "glass" ? 0.54 : 0.3, rail = type === "glass" ? "#c6d9d7" : pick(["#628197", "#a87965", "#748d82", "#a69577"], 9);
        f(band, band + Math.min(0.15, 2.3 / len), 0, height, rail);
      }
      f(0, 1, height - 1.2, height, side ? "#a2acaa" : "#eee8cf");
    }
    slab2(x0, y0, x1, y1, z1, roofcol);
    return z1;
  }
  const ax = rx * 0.94, ay = ry * 0.94, glass = ["glass", "fin", "setback", "twin"].includes(type);
  const box = (a, b, z0, z1, finish = "normal", windows = true) => mass(-a, -b, a, b, z0, z1, finish, windows);
  function gable(a, b, z, col, rise) {
    poly(col, [[-a, -b, z], [a, -b, z], [a, 0, z + rise], [-a, 0, z + rise]]);
    poly(col, [[-a, 0, z + rise], [a, 0, z + rise], [a, b, z], [-a, b, z]]);
    poly(pal[1], [[a, -b, z], [a, b, z], [a, 0, z + rise]]);
    for (let i = -a + 3; i < a - 2; i += 7) poly("#b5a8a7", [[i, 0, z + rise], [i + 0.65, 0, z + rise], [i + 0.65, b, z], [i, b, z]]);
    const q = P(a * 0.3, 0, z + rise);
    rect2("#7f655d", q[0], q[1] - 3, 2, 4);
  }
  function mechanical(a, b, z) {
    slab2(-a * 0.79, -b * 0.69, a * 0.79, b * 0.69, z + 0.25, "#afb6ac");
    if (type === "balcony" || d.feature === "garden" && seed % 3 === 0) slab2(-a * 0.65, -b * 0.55, a * 0.58, b * 0.56, z + 0.6, "#84a274");
    mass(-a * 0.55, -b * 0.5, -a * 0.12, -b * 0.12, z + 1, z + 3, "ivory", false);
    if (a + b > 16) mass(a * 0.16, b * 0.1, a * 0.49, b * 0.45, z + 1, z + 2.6, "charcoal", false);
  }
  slab2(-rx, -ry, rx, ry, 0, "#b8b9a9");
  if (glass) {
    const low2 = Math.max(7, Math.round(h * 0.16));
    box(ax, ay, 0, low2, "ivory");
    if (type === "twin") {
      const short = h * 0.77;
      mass(-ax * 0.93, -ay * 0.88, ax * 0.14, ay * 0.7, low2, h, "glass");
      mass(ax * 0.25, -ay * 0.5, ax * 0.92, ay * 0.8, low2, short, "charcoal");
    } else if (type === "setback" || type === "fin") {
      const z = Math.round(h * 0.69);
      box(ax * 0.84, ay * 0.84, low2, z, "glass");
      box(ax * 0.62, ay * 0.62, z, h, type === "fin" ? "charcoal" : "glass");
      box(ax * 0.32, ay * 0.31, h, h + 4, "ivory", false);
      if (type === "fin") {
        box(ax * 0.14, ay * 0.14, h + 4, h + 11, "glass", false);
        rect2("#a7afb2", 0, -h - 20, 1, 11);
        rect2("#ffd37a", 0, -h - 20, 1, 1, true);
      }
    } else {
      box(ax * 0.87, ay * 0.88, low2, h, seed % 5 === 1 ? "charcoal" : "glass");
      mechanical(ax * 0.83, ay * 0.82, h);
    }
  } else if (type === "academy") {
    box(ax, ay, 0, h, "ivory", false);
    face(-ax, -ay, ax, ay, 0, h, 1, 0.05, 0.96, 2, h - 2, "#527683");
    for (const u of [0.12, 0.42, 0.72]) face(-ax, -ay, ax, ay, 0, h, 1, u, u + 0.18, 3, h - 4, "#abd4cc");
    const interior = 1.42;
    c.save();
    c.scale(interior, interior);
    drawClassroom(c, { ...d, rx: d.rx / interior, ry: d.ry / interior, height: h / interior }, period, pose, catPose);
    c.restore();
  } else if (type === "apartment" || type === "balcony") {
    box(ax, ay, 0, 6, "normal");
    if (type === "balcony") {
      const split = Math.round(h * 0.6);
      box(ax * 0.98, ay * 0.88, 6, split, "ivory");
      slab2(-ax * 0.9, -ay * 0.8, ax * 0.9, ay * 0.8, split + 0.2, "#709d74");
      box(ax * 0.75, ay * 0.64, split, h, "ivory");
      mechanical(ax * 0.7, ay * 0.62, h);
    } else {
      box(ax * 0.91, ay * 0.9, 6, h, ["ivory", "normal", "brick", "ivory", "charcoal"][seed % 5]);
      mechanical(ax * 0.86, ay * 0.85, h);
    }
  } else if (type === "museum" || type === "clock") {
    box(ax, ay, 0, 3, "ivory", false);
    box(ax * 0.9, ay * 0.82, 3, h, "ivory");
    for (let i = 0; i < 5; i++) {
      const x = (-0.74 + i * 0.36) * ax;
      mass(x - 1, ay * 0.8, x + 1, ay * 0.93, 3, h, "ivory", false);
    }
    gable(ax * 0.96, ay * 0.93, h, "#697d8d", 5);
    if (type === "clock") {
      box(ax * 0.26, ay * 0.28, h + 2, h + 14, "normal", false);
      const q = P(ax * 0.26, ay * 0.27, h + 10);
      rect2("#fbefd3", q[0] - 2, q[1] - 2, 4, 4);
      rect2("#506878", q[0], q[1] - 1, 1, 2);
      poly("#527b84", [[-ax * 0.33, ay * 0.36, h + 14], [ax * 0.33, ay * 0.36, h + 14], [0, 0, h + 21]]);
      poly("#3d626c", [[ax * 0.33, ay * 0.36, h + 14], [ax * 0.33, -ay * 0.36, h + 14], [0, 0, h + 21]]);
    }
  } else if (type === "station" || type === "wintergarden") {
    box(ax, ay, 0, h * 0.65, "ivory");
    const z = h * 0.65, rise = type === "station" ? 8 : 10;
    for (let i = 0; i < 6; i++) {
      const a = i / 6, b = (i + 1) / 6;
      const edge = (x, t) => [x, ay * (2 * t - 1), z + Math.sin(Math.PI * t) * rise];
      poly(["#8fa9ac", "#bbd1c6", "#d2e1cf", "#a1c8bc", "#7ba7a9", "#759a9e"][i], [edge(-ax, a), edge(ax, a), edge(ax, b), edge(-ax, b)]);
      for (let xx = -ax + 3; xx < ax; xx += 6) poly("#e1dfc8", [edge(xx, a), edge(xx + 0.7, a), edge(xx + 0.7, b), edge(xx, b)]);
      poly("#9eb7b3", [[ax, ay * (2 * a - 1), z], edge(ax, a), edge(ax, b), [ax, ay * (2 * b - 1), z]]);
    }
  } else if (type === "factory" || type === "shed" || type === "fieldhouse") {
    box(ax, ay, 0, h, type === "factory" ? "brick" : "normal");
    gable(ax, ay, h, type === "fieldhouse" ? "#47798a" : "#788498", 5);
    if (type === "factory") for (let i = 0; i < 2; i++) {
      const x = ax * (i ? -0.2 : 0.32), y = -ay * 0.35;
      mass(x - 1.5, y - 1.5, x + 1.5, y + 1.5, h + 2, h + 18 - i * 4, "brick", false);
      mass(x - 1.6, y - 1.6, x + 1.6, y + 1.6, h + 12 - i * 4, h + 14 - i * 4, "ivory", false);
    }
  } else {
    box(ax, ay, 0, h, type === "school" ? "brick" : type === "retail" ? "ivory" : "normal");
    if (type === "gable" || type === "terrace") gable(ax, ay, h, roof, type === "gable" ? 7 : 4.5);
    else mechanical(ax, ay, h);
    if (type === "school") {
      const clock = P(ax * 0.1, ay, h - 3), flag = P(-ax * 0.48, -ay * 0.4, h + 1);
      rect2("#505955", clock[0] - 2, clock[1] - 2, 5, 5);
      rect2("#f2e3bd", clock[0] - 1, clock[1] - 1, 3, 3, true);
      rect2("#525c59", clock[0], clock[1] - 1, 1, 2);
      rect2("#bcbca7", flag[0], flag[1] - 7, 1, 8);
      paint("#578091", [[flag[0] + 1, flag[1] - 7], [flag[0] + 7, flag[1] - 6], [flag[0] + 5, flag[1] - 3], [flag[0] + 1, flag[1] - 4]]);
    }
    if (type === "retail") {
      for (let j = 0; j < 6; j++) {
        const x = -ax + ax * j / 3, end = x + ax / 3, col = j % 2 ? "#f5dcb5" : pick(["#b95c54", "#507b7c", "#c8914f", "#5d7d98"], 4);
        poly(col, [[x, ay, 5], [end, ay, 5], [end, ry, 3], [x, ry, 3]]);
      }
      const q = P(ax * 0.84, ay, 8);
      rect2("#614e52", q[0], q[1], 3, 6);
      rect2(period === "night" ? "#ffcb84" : "#d98b63", q[0], q[1], 2, 4, period === "night");
    }
  }
  return { image, hw, up, density };
}
function bakeFrontage(o, scale, period, pose = 0, catPose = 0) {
  const d = o.design, key4 = [d.seed, d.type, d.rx.toFixed(3), d.ry.toFixed(3), period, pose, catPose].join("/");
  const frames = d.type === "academy" ? roomFrames : cached2, limit = d.type === "academy" ? 24 : 1e3;
  let b = frames.get(key4);
  if (!b) {
    b = bitmap2(d, period, pose, catPose);
    if (frames.size >= limit) frames.delete(frames.keys().next().value);
    frames.set(key4, b);
  }
  const left = Math.round(o.sx - b.hw * scale), top = Math.round(o.sy - b.up * scale), width = Math.ceil(b.image.width * scale / b.density), height = Math.ceil(b.image.height * scale / b.density);
  return { image: b.image, left, top, width, height, right: left + width, bottom: top + height };
}

// Pages작업본/mm/art/city-lots.js
var label = {
  academy: "입실론수학학원 · 민재웅 선생님",
  gable: "골목 주택",
  terrace: "연립주택",
  retail: "상점가",
  apartment: "아파트",
  balcony: "테라스 아파트",
  glass: "유리 업무동",
  setback: "계단식 업무 타워",
  twin: "쌍둥이 업무 타워",
  fin: "금융센터",
  museum: "시립 미술관",
  clock: "시계탑 도서관",
  school: "학교",
  station: "기차역",
  factory: "공장",
  shed: "물류 창고",
  wintergarden: "유리 온실",
  hall: "시민회관",
  clinic: "보건소",
  fieldhouse: "체육관"
};
var ranges = {
  academy: [4, 4],
  gable: [1, 3],
  terrace: [2, 5],
  retail: [2, 5],
  apartment: [7, 19],
  balcony: [7, 17],
  glass: [11, 22],
  setback: [13, 24],
  twin: [13, 20],
  fin: [21, 27],
  museum: [2, 3],
  clock: [2, 3],
  school: [3, 5],
  station: [2, 3],
  factory: [2, 4],
  shed: [1, 3],
  wintergarden: [1, 2],
  hall: [3, 6],
  clinic: [3, 5],
  fieldhouse: [1, 2]
};
var choices = (pool, n) => pool[Math.floor(n * pool.length)];
function rotated(x, y, n) {
  for (let i = 0; i < n; i++) [x, y] = [4 - y, x];
  return [x, y];
}
function populate(cells, gifts, plan, form, names2, rewardNames2, stage) {
  const objects = [], byLot = /* @__PURE__ */ new Map();
  for (const g of gifts) {
    if (!rewardSites(plan, g.style).includes(g.lot)) continue;
    if (!byLot.has(g.lot)) byLot.set(g.lot, []);
    byLot.get(g.lot).push(g);
  }
  cells.forEach((cell, index) => {
    const [bx, by, zone, variant] = cell, feature = plan.feature;
    const randomAt = (tag) => random(variant, tag), pick = (tag, pool) => choices(pool, randomAt(tag));
    const neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, y]) => form.byCell.get(key2(bx + x, by + y))).filter((b) => b && (cell[5] || !b[5])).map((b) => b[2]);
    const edgeHome = cell[5] && neighbours.length < 4;
    const central = neighbours.includes("O") || neighbours.includes("T"), europe = feature === "canal" || feature === "court";
    function inland(axis, block, v) {
      if (form.waterAxis !== axis) return v;
      if (block * 4 === form.waterLine) return 0.83 + 0.7925 * v;
      if (block * 4 + 4 === form.waterLine) return 0.7925 * v;
      return v;
    }
    const point = (x, y) => ({ x: bx * 4 + inland("x", bx, x), y: by * 4 + inland("y", by, y) });
    function build(type, x, y, width, depth, tag, lot, act) {
      const t = point(x, y), lo = point(x - width / 2, y - depth / 2), hi = point(x + width / 2, y + depth / 2);
      const rx = (hi.x - lo.x) * form.unitX / 2, ry = (hi.y - lo.y) * form.unitY / 2;
      const [cx, cy] = form.ground(t.x, t.y);
      const start = plan.blocks[0], origin = (axis, v) => form.waterAxis !== axis ? v : form.waterLine === 0 ? 0.83 + 0.7925 * v : 0.7925 * v;
      const [ax, ay] = form.ground(start[0] * 4 + origin("x", 1.86), start[1] * 4 + origin("y", 1.99));
      const adjacent = Math.hypot(cx - ax, (cy - ay) * 1.8) < 85;
      const inFront = cy >= ay && cy - ay < 155 && Math.abs(cx - ax) < rx + ry + 42;
      const protectedLot = type !== "academy" && (adjacent || inFront);
      if (protectedLot && !["school", "gable", "retail", "terrace"].includes(type)) type = "retail";
      const n = randomAt(tag + "floors"), [low2, high] = ranges[type], floors = protectedLot ? 1 : low2 + Math.round(n * (high - low2));
      const seed = Math.floor(randomAt(tag + "finish") * 4294967295) >>> 0;
      const floorHeight = ["shed", "museum", "station", "wintergarden", "fieldhouse"].includes(type) ? 5 : ["apartment", "balcony", "glass", "setback", "fin", "twin"].includes(type) ? 4.8 : 4;
      const height = type === "academy" ? 28 : 4 + floorHeight * floors, extra = {
        academy: 54,
        fin: 24,
        clock: 21,
        station: 9,
        museum: 11,
        wintergarden: 11,
        factory: 21,
        gable: 9,
        terrace: 7,
        shed: 7,
        apartment: 4,
        balcony: 5,
        glass: 4,
        setback: 5,
        twin: 5
      }[type] || 4;
      const design = { type, rx, ry, seed, feature, floors, floorHeight, height, sky: height + extra + (rx + ry) / 2, zone, stage };
      const tagSlot = { shop00: 0, shop10: 1, business00: 0, business11: 1, library: 1, shops: 0, hotel: 1 };
      if (lot === void 0 && cell.length === 4 && Object.hasOwn(tagSlot, tag)) lot = plan.blocks.indexOf(cell) * 4 + tagSlot[tag];
      const earned = byLot.get(lot) || [], gift = earned[0], w = 2 * (rx + ry);
      if (earned.length) {
        const accents = ["fountain", "plane", "bench", "flowering", "kiosk", "linden", "fir", "fountain", "kiosk", "bench", "plane", "flowering"];
        [...new Set(earned.map((g) => g.style))].slice(0, 4).forEach((style, i) => {
          const place = point(x + (i % 2 ? -0.5 : 0.5) * width, y + (0.42 - i * 0.23) * depth);
          objects.push({ t: place, id: accents[style] || "bench", w: 8 + i % 2 * 2, ordinaryWidth: 9, label: rewardNames2[style] + " 기념물", act: "rest" });
        });
      }
      objects.push({
        t,
        id: type,
        architecture: true,
        design,
        lot,
        gift,
        w: gift ? rewardKind(gift.style) === "small" ? index === 0 ? 37 : Math.max(43, Math.min(60, w)) : Math.max(68, Math.min(84, w * 1.2)) : w,
        ordinaryWidth: w,
        label: gift ? rewardNames2[gift.style] : label[type],
        act,
        level: earned.length,
        effects: [...new Set(earned.map((g) => g.style))]
      });
    }
    function prop(id, x, y, w, act) {
      objects.push({ id, t: point(x, y), w, ordinaryWidth: w, architecture: false, label: names2[id] || "벚나무", act });
    }
    if (index === 0) {
      build("academy", 1.86, 1.99, 2.92, 2.5, "epsilon", void 0, "study");
      build("school", 0.7, 0.42, 1.12, 0.56, "first-school", void 0, "read");
      build("gable", 3.43, 0.5, 0.9, 0.64, "first-home", 0, "rest");
      build("retail", 3.44, 3.58, 0.85, 0.66, "corner-store", 1, "shop");
      prop("bench", 0.58, 2.93, 10, "feed");
      prop("plane", 0.52, 3.49, 14);
    } else if (zone === "H") {
      const anchors = [[1.12, 1.12], [2.86, 2.86]].map(([x, y]) => rotated(x, y, variant % 4));
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const x0 = a ? 2.15 : 0.22, x1 = a ? 3.78 : 1.85, y0 = b ? 2.15 : 0.22, y1 = b ? 3.78 : 1.85;
        const tag = "home" + a + b, slot = anchors.findIndex(([x, y]) => x > 2 === !!a && y > 2 === !!b);
        if (stage === 0 && slot < 0) continue;
        const high = stage >= 3 && !europe && randomAt(tag + "density") < (edgeHome ? 0.07 : cell[5] === "gardens" ? 0.1 : central ? 0.8 : 0.46);
        const dwelling = high ? pick(tag, ["apartment", "balcony", "apartment"]) : pick(tag, europe ? ["gable", "terrace", "terrace"] : ["gable", "terrace"]);
        if (slot >= 0) {
          const [x, y] = anchors[slot], w = Math.min(x - x0, x1 - x) * 2 - 0.04, d = Math.min(y - y0, y1 - y) * 2 - 0.04;
          build(stage === 0 ? "gable" : dwelling, x, y, w, d, tag, cell.length === 4 ? index * 4 + slot : void 0);
          continue;
        }
        const splitX = (variant + a + b) % 2 === 0, tagWidth = x1 - x0, tagDepth = y1 - y0;
        const units = stage >= 2 && !high ? 3 : 2;
        for (let j = 0; j < units; j++) {
          const x = x0 + tagWidth * (splitX ? (j + 0.5) / units : 0.5), y = y0 + tagDepth * (splitX ? 0.5 : (j + 0.5) / units);
          build(
            j === 0 ? dwelling : pick(tag + "annex", high ? ["apartment", "terrace", "retail"] : ["terrace", "gable", "retail"]),
            x,
            y,
            tagWidth * (splitX ? 0.95 / units : 0.93),
            tagDepth * (splitX ? 0.93 : 0.95 / units),
            tag + j
          );
        }
      }
      if (stage > 0) {
        prop("linden", 1.9, 0.48, 12);
        prop("flowering", 0.4, 2, 13);
      }
    } else if (zone === "S") {
      for (let row = 0; row < 2; row++) {
        const n = 3 + (variant + row) % 2, step = 3.6 / n;
        for (let j = 0; j < n; j++) {
          const x = 0.2 + (j + 0.5) * step, y = row ? 3.02 : 1, tag = "shop" + row + j;
          let style = pick(tag, ["retail", "retail", "terrace", "gable"]);
          if (stage >= 3 && j === 1 && central) style = europe ? "terrace" : pick(tag + "office", ["apartment", "glass", "balcony"]);
          build(style, x, y, step - 0.07, 1.46, tag, void 0, "shop");
        }
      }
      prop("kiosk", 0.46, 2.06, 13, "shop");
    } else if (zone === "O") {
      const core = plan.blocks[form.landmarkDistrict] === cell;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const x = a ? 3 : 1, y = b ? 3 : 1, tag = "business" + a + b;
        let kind = pick(tag, feature === "garden" ? ["balcony", "glass", "setback"] : ["glass", "setback", "apartment", "twin"]);
        if (europe) kind = pick(tag, ["terrace", "apartment", "hall"]);
        if (core && a === 0 && b === 0) kind = feature === "canal" ? "clock" : feature === "garden" ? "balcony" : "fin";
        if ((a + b) % 2 === 0) build(kind, x, y, 1.56, 1.52, tag);
        else {
          build(kind, x - 0.4, y, 0.76, 1.53, tag);
          build(pick(tag + "side", ["hall", "glass", "apartment"]), x + 0.41, y, 0.72, 1.4, tag + "wing");
        }
      }
      prop("plane", 2, 1.72, 12);
      prop("kiosk", 2, 3.37, 12, "shop");
    } else if (zone === "C") {
      const academy = plan.blocks.find((b) => b[2] === "C") === cell || cell[5] === "campus" && variant % 3 === 0 || cell[5] === "gardens";
      build(academy ? "school" : cell[5] === "campus" ? pick("faculty", ["museum", "hall", "clock"]) : pick("civic", ["museum", "clock", "hall"]), 1.06, 1.8, 1.64, 2.78, "institution", void 0, "read");
      build(academy || cell[5] === "campus" ? "clock" : "clinic", 2.98, 2.99, 1.53, 1.43, "library", void 0, "read");
      prop(academy ? "court-yard" : "fountain", 3, 1.22, 42, "rest");
      prop("flowering", 2.44, 0.45, 17);
      if (!academy) build("retail", 3.19, 0.55, 1.03, 0.53, "cafe", void 0, "shop");
      prop("linden", 2.28, 2.08, 15);
      prop("bench", 2.6, 1.91, 11, "rest");
    } else if (zone === "Q") {
      prop("kiosk", 0.48, 0.57, 16, "shop");
      prop("bench", 0.85, 3.52, 13, "rest");
      prop("bench", 3.5, 1.1, 13, "rest");
      for (const [x, y] of [[0.48, 3.55], [3.56, 0.48]]) prop("flowering", x, y, 17);
    } else if (zone === "I") {
      if (cell[5] === "works" && variant % 3 === 0) {
        build("shed", 1.96, 1.12, 3.24, 1.55, "freight");
        build("shed", 1.05, 2.99, 1.45, 1.31, "dispatch");
        build("retail", 3.22, 3.14, 0.88, 1.02, "canteen", void 0, "shop");
      } else if (cell[5] === "works" && variant % 3 === 1) {
        build("factory", 1.2, 1.66, 1.72, 2.45, "turbine");
        build("factory", 3.02, 1.72, 1.25, 2.63, "press");
        build("shed", 2.22, 3.47, 2.13, 0.66, "workshop");
        prop("plane", 0.45, 3.51, 13);
      } else {
        build("factory", 1.04, 1.24, 1.62, 1.94, "kiln");
        build("shed", 3, 1.4, 1.53, 2.06, "depot");
        build("shed", 1.23, 3.16, 1.89, 1.08, "storage");
        build("hall", 3.2, 3.18, 0.96, 1.1, "office");
      }
    } else if (zone === "T") {
      build("station", 1.02, 2, 1.48, 3.38, "concourse", void 0, "rest");
      build("retail", 3.05, 3.05, 1.56, 1.43, "shops", void 0, "shop");
      build("glass", 3.05, 1.02, 1.49, 1.5, "hotel");
      prop("kiosk", 2.43, 2.04, 13, "shop");
    } else if (zone === "A") {
      build("fieldhouse", 3.28, 2.63, 0.94, 1.91, "stands", void 0, "rest");
      prop("kiosk", 3.09, 0.68, 15, "shop");
      for (let j = 0; j < 5; j++) prop(j === 2 ? "flowering" : "linden", 0.4, 0.56 + j * 0.72, 12);
    } else {
      const signature = plan.blocks.find((b) => b[2] === "P") === cell;
      if (cell.length === 4) {
        const lot = plan.blocks.indexOf(cell) * 4 + 3, t = point(2.08, 2.25), earned = (byLot.get(lot) || []).filter((g) => g.style === 5);
        objects.push({
          id: earned.length ? "fair" : "fair-square",
          t,
          lot,
          gift: earned[0],
          level: earned.length,
          effects: [],
          ordinaryWidth: 71,
          w: 71,
          label: earned.length ? rewardNames2[5] : "축제 광장",
          act: "rest"
        });
      }
      if (signature) build("wintergarden", 3.24, 0.9, 0.86, 0.95, "glasshouse", void 0, "rest");
      else if (cell.length !== 4) prop("fountain", 3, 2.97, 25, "rest");
      const border = feature === "garden" ? 14 : 9;
      for (let j = 0; j < border; j++) {
        const x = j % 2 ? 0.42 : 3.59, y = 0.42 + Math.floor(j / 2) * 3.11 / Math.ceil(border / 2);
        prop(j % 5 === 1 ? "flowering" : j % 3 ? "plane" : "linden", x, y, 15 + randomAt("tree" + j) * 9);
      }
      prop("bench", 0.65, 1.42, 12, "exercise");
      prop("flowering", 1.22, 3.14, 22);
    }
  });
  return objects;
}

// Pages작업본/mm/art/city-fabric.js
function trace(project, points) {
  const out = [project(...points[0])];
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i - 1], [u, v] = points[i], steps = Math.ceil(Math.max(Math.abs(u - x), Math.abs(v - y)) * 1.5);
    for (let j = 1; j <= steps; j++) out.push(project(x + (u - x) * j / steps, y + (v - y) * j / steps));
  }
  return out;
}
var tones = { Q: ["#c9b7a4", "#dfcdb5"], H: ["#bcc39b", "#cbd0a6"], S: ["#cec3a6", "#ded0b3"], O: ["#bdc5ba", "#d3d4c4"], C: ["#c5c7ae", "#e0d7b9"], P: ["#98b981", "#acc68e"], T: ["#c5bdad", "#d4c9b0"], A: ["#99b488", "#b6c79b"], I: ["#b4b5a6", "#c6c4b3"] };
function districts(c, project, scale, blocks, plan) {
  const occupied = new Set(blocks.map(([a, b]) => a + "," + b));
  for (const [a, b, z, v] of blocks) {
    const [base2, inner] = tones[z], x = a * 4, y = b * 4, cut = plan.feature === "court" ? 0.43 : 0.16;
    const local = (arr) => arr.map(([i, j]) => [x + i, y + j]);
    const fill = (p, col) => shape(c, col, trace(project, local([...p, p[0]])));
    const path = (p, col, w) => line(c, col, w * scale, trace(project, local(p)));
    const corner = (d, k) => [[d + k, d], [4 - d - k, d], [4 - d, d + k], [4 - d, 4 - d - k], [4 - d - k, 4 - d], [d + k, 4 - d], [d, 4 - d - k], [d, d + k]];
    const perimeter = (d) => {
      const outline = [], corners = [[0, 0, -1, -1], [4, 0, 1, -1], [4, 4, 1, 1], [0, 4, -1, 1]];
      for (const [j, [u, w, dx, dy]] of corners.entries()) {
        const exposed = !occupied.has([a + dx, b].join(",")) && !occupied.has([a, b + dy].join(","));
        const radius = exposed ? 0.78 + v % 7 * 0.045 : cut;
        const cx = u - dx * (d + radius), cy = w - dy * (d + radius), start = Math.PI + j * Math.PI / 2;
        for (let n = 0; n <= 4; n++) {
          const angle = start + n * Math.PI / 8;
          outline.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
        }
      }
      return outline;
    };
    fill(perimeter(0.03), base2);
    fill(perimeter(0.25), inner);
    if (z === "Q") {
      for (let i = 0.5; i < 3.8; i += 0.4) {
        path([[0.3, i], [3.7, i]], "#cab9a4", 0.8);
        path([[i, 0.3], [i, 3.7]], "#d4bfab", 0.8);
      }
      const diamond = [[0.77, 2], [2, 0.77], [3.23, 2], [2, 3.23], [0.77, 2]];
      path(diamond, "#a78a74", 2);
      path([[1.52, 2], [2, 1.52], [2.48, 2], [2, 2.48], [1.52, 2]], "#f6e4ba", 2);
    } else if (z === "P") {
      fill([[0.29, 0.43], [1.48, 0.3], [2.1, 1.12], [1.43, 1.67], [0.46, 1.43]], "#80a472");
      fill([[0.42, 2.5], [1.41, 2.26], [2.24, 2.91], [1.74, 3.64], [0.51, 3.51]], "#88ad79");
      if (v % 3 !== 1) {
        const pond = [[2.52, 0.48], [3.27, 0.37], [3.65, 0.81], [3.49, 1.4], [2.98, 1.57], [2.43, 1.22], [2.35, 0.83]];
        fill(pond, "#88ada6");
        path(pond.slice(1, 5), "#c8d6af", 1.5);
      }
      path([[0.45, 3.51], [1.38, 2.62], [2.13, 2.06], [2.87, 1.61], [3.6, 1.69]], "#ebd7ad", 2.9);
    } else if (z === "A") {
      const loop = [[0.72, 1.02], [1.08, 0.6], [2.22, 0.61], [2.61, 1.04], [2.61, 2.93], [2.28, 3.36], [1.07, 3.37], [0.72, 2.96], [0.72, 1.02]];
      fill(loop, "#b5826d");
      path(loop, "#ddae91", 1);
      const pitch = [[1.03, 1.07], [2.29, 1.07], [2.29, 2.95], [1.03, 2.95], [1.03, 1.07]];
      fill(pitch, "#86a976");
      path(pitch, "#e4dfb8", 1);
      path([[1.03, 2.01], [2.29, 2.01]], "#e4dfb8", 0.8);
      const circle = Array.from({ length: 17 }, (_, i) => [1.66 + 0.22 * Math.cos(i * Math.PI / 8), 2.01 + 0.22 * Math.sin(i * Math.PI / 8)]);
      path(circle, "#e4dfb8", 0.8);
      for (const y2 of [1.07, 2.95]) {
        const inner2 = y2 === 1.07 ? 1.36 : 2.66;
        path([[1.3, y2], [1.3, inner2], [2.02, inner2], [2.02, y2]], "#e4dfb8", 0.8);
      }
    } else if (z === "I") {
      for (let j = 0; j < 6; j++) {
        const u = 0.43 + j * 0.4;
        path([[u, 1.81], [u, 2.57]], "#e2d8b9", 1.3);
      }
      for (let j = 0; j < 4; j++) {
        const u = 0.7 + j * 0.32;
        fill([[u, 2.92], [u + 0.22, 2.92], [u + 0.22, 3.48], [u, 3.48]], j % 2 ? "#af7763" : "#76948d");
      }
    } else if (z === "C" || z === "O" || z === "T") {
      const plaza = z === "O" ? [[1.56, 1.2], [2.37, 1.08], [2.82, 1.81], [2.02, 2.54], [1.16, 2.1]] : corner(0.57, 0.35);
      fill(plaza, z === "C" ? "#d2c7a8" : "#cad0c3");
      if (z === "C") for (let i = 0.79; i < 3.5; i += 0.39) path([[i, 0.78], [i, 3.25]], "#dcd1b6", 0.7);
      if (z === "O") path([[0.23, 3.14], [1.47, 2.39], [2.27, 1.66], [3.76, 0.88]], "#e6dfbe", 2.3);
    } else if (z === "S" && plan.feature === "court") {
      fill([[1.08, 1.14], [2.97, 1.14], [2.97, 2.83], [1.08, 2.83]], "#a8b791");
      path([[1.26, 2.68], [2.1, 2.24], [2.79, 1.33]], "#e6d5af", 2.3);
    } else if (z === "H") {
      fill([[0.46, 0.49], [3.49, 0.5], [3.37, 1.32], [2.43, 1.49], [0.49, 1.25]], "#b0bd91");
      fill([[0.5, 2.63], [3.57, 2.48], [3.55, 3.55], [0.5, 3.5]], "#aebe90");
    }
  }
}
function waterfront(c, project, scale, form, blocks) {
  if (!form.waterAxis) return;
  const axis = form.waterAxis, at = form.waterLine, canal = axis === "x", width = canal ? 0.53 : 0.64;
  const atPoint = (i, d) => axis === "y" ? [i, at + d] : [at + d, i];
  const shore = blocks.filter(([x, y]) => {
    const edge = 4 * (canal ? x : y);
    return edge === at || edge + 4 === at;
  }).map(([x, y]) => 4 * (canal ? y : x));
  function openness(i) {
    return Math.min(1, Math.min(...shore.map((a) => Math.max(a - i, 0, i - a - 4))) / 4);
  }
  function meander(i) {
    const t = openness(i);
    return t * t * (1.1 * Math.sin(i * 0.24) + 0.48 * Math.sin(i * 0.5 + 0.5));
  }
  function bank(i, side, factor) {
    const w = width + 0.09 * Math.sin(i * 0.51) + 0.06 * Math.sin(i * 0.88 + 0.7) + openness(i) * 0.14;
    return atPoint(i, meander(i) + side * w * factor);
  }
  const seq = Array.from({ length: 345 }, (_, i) => i * 0.55 - 94);
  for (const side of [-1, 1]) {
    const meadow = seq.map((i) => bank(i, side, 1.16 + openness(i) * (1.35 + 0.8 * Math.sin(i * 0.35 + side))));
    shape(c, "#a3b687", [...meadow, ...[...seq].reverse().map((i) => bank(i, side, 1.01))].map((p) => project(...p)));
  }
  for (const [spread, col] of [[1.24, "#93a78c"], [1.08, "#dfd2ae"], [1, "#5895aa"], [0.74, "#47899e"]]) {
    const coords = [...seq.map((i) => bank(i, -1, spread)), ...[...seq].reverse().map((i) => bank(i, 1, spread))];
    shape(c, col, coords.map((p) => project(...p)));
  }
  for (let i = -26; i <= 30; i += 0.81) {
    const d = meander(i) + Math.sin(i * 26) * 0.36;
    line(c, "#a8c9c7", scale * 0.8, [project(...atPoint(i, d)), project(...atPoint(i + 0.19, d))]);
  }
  const eastWest = axis === "y";
  for (const [a, b] of blocks) {
    const along = (eastWest ? a : b) * 4, edge = (eastWest ? b : a) * 4;
    if (edge !== at && edge + 4 !== at) continue;
    const side = edge === at ? 1 : -1, path = [];
    for (let j = 0; j <= 8; j++) path.push(bank(along + j * 0.5, side, 1.27));
    line(c, "#b8ad91", 3.7 * scale, path.map((p) => project(...p)));
    line(c, "#efe1bd", 2.4 * scale, path.map((p) => project(...p)));
  }
}
var streetStyle = {
  boulevard: [12, 8.7, "#515b62"],
  avenue: [10.4, 7, "#59636a"],
  street: [7.7, 4.9, "#687071"],
  local: [4.6, 2.9, "#879283"],
  lane: [4.1, 2.3, "#b9b7a0"],
  market: [4.6, 2.9, "#d7ba98"],
  walk: [3.8, 2.1, "#e0cda9"],
  greenway: [7.9, 3.5, "#dacfad"]
};
function streets(c, project, scale, network, form) {
  c.lineCap = "round";
  c.lineJoin = "round";
  const paths = /* @__PURE__ */ new Map();
  function turnout(node, towards) {
    if (node.exits.size !== 2 || node.x % 4 || node.y % 4) return null;
    const other = [...node.exits].find((id) => id !== [towards.x, towards.y].join(",")).split(",").map(Number);
    const ux = other[0] - node.x, uy = other[1] - node.y, dx = towards.x - node.x, dy = towards.y - node.y;
    if (ux * dx + uy * dy !== 0) return null;
    return [0.5, 0.625, 0.75, 0.875, 1].map((t) => project(node.x + 0.66 * ((1 - t) ** 2 * ux + t * t * dx), node.y + 0.66 * ((1 - t) ** 2 * uy + t * t * dy)));
  }
  for (const e of network.segments) {
    const { a, b } = e, start = !e.bridge && turnout(a, b), end = !e.bridge && turnout(b, a);
    e.path = start || end ? [...start || [project(a.x, a.y)], ...end ? end.reverse() : [project(b.x, b.y)]] : trace(project, [[a.x, a.y], [b.x, b.y]]);
    if (!paths.has(e.kind)) paths.set(e.kind, []);
    paths.get(e.kind).push(e);
  }
  const ascending = Object.keys(streetStyle).reverse();
  for (const layer of [0, 1]) for (const k of ascending) {
    const group = paths.get(k);
    if (!group) continue;
    const [rim, core, color] = streetStyle[k];
    c.strokeStyle = layer ? color : k === "greenway" ? "#86a67b" : k === "local" ? "#afb79d" : "#d3d1bd";
    c.lineWidth = (layer ? core : rim) * scale;
    c.beginPath();
    for (const { path } of group) {
      c.moveTo(...path[0]);
      for (const p of path.slice(1)) c.lineTo(...p);
    }
    c.stroke();
  }
  for (const { a, b, kind, bridge } of network.segments) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const p = (f, off = 0) => project(a.x + dx * f - dy * off, a.y + dy * f + dx * off);
    if (kind === "boulevard" || kind === "avenue") {
      line(c, "#ded6af", 1 * scale, [p(0.29), p(0.65)]);
      if (kind === "boulevard" && !bridge && (a.x + a.y) % 4 === 2) line(c, "#a3b08c", 2.6 * scale, [p(0.18), p(0.82)]);
    }
    if (bridge) {
      const l = p(0), r = p(1), len = Math.hypot(r[0] - l[0], r[1] - l[1]) || 1;
      const nx = (r[1] - l[1]) / len, ny = (l[0] - r[0]) / len, d = (streetStyle[kind][0] / 2 + 0.4) * scale;
      for (const sign of [-1, 1]) {
        const rr = [l, r].map(([x, y]) => [x + nx * d * sign, y + ny * d * sign]);
        line(c, "#667b79", 1.7 * scale, rr);
        line(c, "#e1d6b7", scale, rr.map(([x, y]) => [x, y - 2 * scale]));
        for (const [x, y] of rr) {
          c.fillStyle = "#7a8478";
          c.fillRect(x, y - 2 * scale, scale, 2.5 * scale);
        }
      }
    } else if (["avenue", "boulevard", "street"].includes(kind)) {
      for (const [node, sgn] of [[a, 1], [b, -1]]) if (node.exits.size >= 3 && node.x % 4 === 0 && node.y % 4 === 0) {
        const cx = node.x + sgn * dx * 0.24, cy = node.y + sgn * dy * 0.24;
        const center = project(cx, cy), end = p(node === a ? 0.48 : 0.52), len = Math.hypot(end[0] - center[0], end[1] - center[1]) || 1;
        const vx = (end[0] - center[0]) / len, vy = (end[1] - center[1]) / len;
        for (let i = -2; i <= 2; i++) {
          const px = center[0] - vy * i * 1.22 * scale, py = center[1] + vx * i * 1.22 * scale;
          line(c, "#e3dfca", 0.72 * scale, [[px, py], [px + vx * 2 * scale, py + vy * 2 * scale]]);
        }
      }
    }
  }
  if (form.waterAxis && form.mainBridge !== void 0) {
    const at = form.mainBridge, mid = form.waterLine, along = form.waterAxis === "y";
    if (network.segments.some((e) => e.bridge && (along ? e.a.x : e.a.y) === at)) {
      const crossing = (t, off) => along ? project(at + off, mid + t) : project(mid + t, at + off);
      for (const side of [-0.13, 0.13]) {
        const points = [];
        for (let j = 0; j <= 10; j++) {
          const t = -0.92 + j * 0.184, p = crossing(t, side), h = (1 - t * t) * 8 * scale;
          points.push([p[0], p[1] - h]);
          if (j % 2 === 0) line(c, "#577777", 1.15 * scale, [p, [p[0], p[1] - h]]);
        }
        line(c, "#567979", 2.6 * scale, points);
        line(c, "#c0cfba", 0.9 * scale, points.map(([x, y]) => [x, y - scale]));
      }
    }
  }
  c.lineCap = "butt";
}

// Pages작업본/mm/art/vendor/village/value-noise.js
var OCTAVES = 4;
var PERSISTENCE = 0.5;
var LACUNARITY = 2;
var AMP_SUM = 1.875;
function fbm2d(width, height, rng) {
  const output = Array.from({ length: height }, () => new Array(width).fill(0));
  let cell = Math.max(4, Math.floor(Math.max(width, height) / 4));
  let amp = 1;
  for (let oct = 0; oct < OCTAVES; oct++) {
    const lw = Math.ceil(width / cell) + 2;
    const lh = Math.ceil(height / cell) + 2;
    const lattice = Array.from(
      { length: lh },
      () => Array.from({ length: lw }, () => rng())
    );
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = Math.floor(x / cell);
        const j = Math.floor(y / cell);
        const fx = x / cell - i;
        const fy = y / cell - j;
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const v00 = lattice[j][i];
        const v10 = lattice[j][i + 1];
        const v01 = lattice[j + 1][i];
        const v11 = lattice[j + 1][i + 1];
        const sample = v00 + sx * (v10 - v00) + sy * (v01 - v00) + sx * sy * (v00 - v10 - v01 + v11);
        output[y][x] += amp * sample;
      }
    }
    amp *= PERSISTENCE;
    cell = Math.max(1, Math.floor(cell / LACUNARITY));
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      output[y][x] = output[y][x] / AMP_SUM;
    }
  }
  return output;
}

// Pages작업본/mm/art/city-scene.js
var W = 1440;
var H = 824;
var limits = [1, 3, 5, 8, 11, 14];
var models = await (await fetch("/mm/art/city-plans.json")).json();
var names = { linden: "보리수", plane: "가로수", bench: "공원 벤치", kiosk: "정류장", fountain: "분수", "court-yard": "동네 운동장", metro: "전철", cottage: "단독주택", studio: "공방", shop: "동네 가게", market: "상가", glass: "유리 업무동", stone: "업무 타워", office: "오피스", redflat: "공동주택", officepair: "업무 단지", strip: "상점가", tower: "고층 사옥", loft: "복합 업무동", workshop: "작업장", library: "시립 도서관", hospital: "종합병원", fire: "소방서", school: "학교", clinic: "보건소", classroom: "학교 별관", bakery: "작은 상점", factory: "공장", hall: "주민센터", utility: "관리소", park: "근린공원", warehouse: "물류 창고", rowhouse: "연립주택", terrace: "테라스 주택", court: "안뜰 주택", brownstone: "벽돌 연립주택", midrise: "주상복합", brickhigh: "고층 아파트", walkup: "다세대주택", brickflat: "벽돌 주택", blockflat: "아파트", condo: "공동주택", fir: "가로수", pine: "소나무" };
function examplePlan(seed, kind) {
  const m = models[kind];
  return {
    kind,
    feature: m.feature,
    guide: m.guide,
    motif: m.name,
    axisY: 4,
    axisX: 4,
    blocks: m.blocks.map(([x, y, z], i) => [x, y, z, hash(seed + "/" + i)])
  };
}
function canvas() {
  const b = document.createElement("canvas");
  b.width = W;
  b.height = H;
  return b;
}
function polygon(c, project, coords, color) {
  shape(c, color, coords.map(([x, y]) => project(x, y)));
}
function road(c, project, x, y, u, v, color, width) {
  line(c, color, width, [project(x, y), project(u, v)]);
}
function landscape(c, project, scale, seed) {
  c.fillStyle = "#8eab75";
  c.fillRect(0, 0, W, H);
  let n = 0;
  const field = fbm2d(60, 60, () => random(seed, "field" + n++));
  for (let x = -30; x < 30; x++) for (let y = -30; y < 30; y++) {
    const [sx, sy] = project(x + 0.5, y + 0.5);
    if (sx < -30 || sx > W + 30 || sy < -20 || sy > H + 20) continue;
    const v = field[x + 30][y + 30];
    const tint = Math.round((v - 0.5) * 10);
    polygon(c, project, [[x - 0.03, y - 0.03], [x + 1.03, y - 0.03], [x + 1.03, y + 1.03], [x - 0.03, y + 1.03]], "rgb(" + [142 + tint, 171 + tint, 117 + tint].join(",") + ")");
    if (v > 0.49 && random(seed, "grass" + key2(x, y)) > 0.75) {
      c.fillStyle = "#93b088";
      c.fillRect(sx, sy, Math.max(1, scale), 1);
      c.fillRect(sx + 2, sy - 1, 1, 1);
    }
  }
}
function townScene(seed, kind, stage, gifts = [], plan = examplePlan(seed, kind), period = koreanPeriod(), hours = null) {
  const progress = hours == null ? null : development(plan, hours), blocks = progress?.blocks || plan.blocks.slice(0, limits[stage]), blueprint = urbanPlan(plan), form = cityForm(blueprint);
  const cells = progress?.cells || [...blocks, ...blueprint.extras.filter((cell) => cell[4] <= blocks.length)];
  const objects = populate(cells, gifts, blueprint, form, names, rewardNames, stage), { project, scale } = cityCamera(cells, form, W, H, objects, tileHeight);
  const base2 = canvas(), c = base2.getContext("2d");
  c.imageSmoothingEnabled = false;
  landscape(c, project, scale, seed);
  objects.push(...fringe(c, project, scale, cells, form, String(seed)));
  districts(c, project, scale, cells, plan);
  waterfront(c, project, scale, form, cells);
  const next = progress?.next?.cell || plan.blocks[blocks.length];
  if (next) {
    const [a, b] = next, x = a * 4, y = b * 4;
    c.setLineDash([3 * scale, 4 * scale]);
    line(c, "#8e9f78", scale, [[x + 0.5, y + 0.5], [x + 3.5, y + 0.5], [x + 3.5, y + 3.5], [x + 0.5, y + 3.5], [x + 0.5, y + 0.5]].map((t) => project(...t)));
    c.setLineDash([]);
  }
  const network = streetsFor(cells, form), { roads } = network;
  streets(c, project, scale, network, form);
  objects.push(...furniture(network, form, seed));
  const occupied = new Set(cells.map(([x, y]) => key2(x, y)));
  for (let a = -9; a <= 9; a++) for (let b = -9; b <= 9; b++) {
    if (occupied.has(key2(a, b))) continue;
    const tag = key2(a, b), density = random(seed, "wood" + tag);
    const cx = 4 * a + 0.7 + random(seed, "cx" + tag) * 2.6, cy = 4 * b + 0.7 + random(seed, "cy" + tag) * 2.6;
    for (let i = 0; i < Math.floor(density * density * 12); i++) {
      const angle = random(seed, tag + "a" + i) * 6.283, r = random(seed, tag + "r" + i) * 1.45;
      const x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
      if (occupied.has(key2(Math.floor(x / 4), Math.floor(y / 4)))) continue;
      if (form.waterAxis && Math.abs((form.waterAxis === "y" ? y : x) - form.waterLine) < 0.94) continue;
      const [u, v] = project(x, y);
      if (u < -12 || u > W + 12 || v < -7 || v > H + 20) continue;
      objects.push({ t: { x, y }, id: ["pine", "linden", "plane", "fir"][Math.floor(random(seed, tag + "species" + i) * 4)], w: 9 + random(seed, tag + "crown" + i) * 10, background: true, flip: i % 2 === 1 });
    }
  }
  let rail = null;
  if (plan.feature === "rail" && stage >= 3) {
    const points = roads.filter((t) => t.x === plan.axisX).sort((a, b) => a.y - b.y);
    let longest = [], run = [];
    for (const t of points) {
      if (run.length && run.at(-1).y + 1 !== t.y) run = [];
      run.push(t);
      if (run.length > longest.length) longest = run.slice();
    }
    if (longest.length >= 3) {
      const a = longest[0], b = longest.at(-1);
      rail = [a, b];
      for (const d of [0.3, 0.44]) line(c, "#66685c", 1.2 * scale, trace(project, [[a.x + d, a.y], [b.x + d, b.y]]));
      for (let i = a.y; i < b.y; i += 0.33) road(c, project, a.x + 0.26, i, a.x + 0.48, i, "#8a806a", scale);
    }
  }
  const light = periods[period], shade = light.shade;
  if (shade[3]) {
    c.fillStyle = "rgba(" + shade.join(",") + ")";
    c.fillRect(0, 0, W, H);
  }
  const cars = trips(network, stage, seed);
  for (const o of objects.filter((o2) => o2.lamp)) if (light.lamps > 0.35) {
    const [x, y] = project(o.t.x, o.t.y);
    c.fillStyle = "rgba(255,196,103," + light.lamps * 0.12 + ")";
    c.beginPath();
    c.ellipse(x, y, 5 * scale, 2.4 * scale, -0.12, 0, Math.PI * 2);
    c.fill();
  }
  const walkers = planResidents(roads, destinations(objects, period), Math.min(35, [2, 4, 7, 13, 20, 29][stage] + gifts.reduce((n, g) => n + (g.perfect ? 2 : 1), 0)), (k) => random(seed, k));
  for (const o of objects) {
    [o.sx, o.sy] = project(o.t.x, o.t.y);
    o.dw = o.w * scale;
    o.foot = o.sy + o.dw * 0.16;
    o.hitHeight = tileHeight(o.id);
    o.period = period;
    if (o.gift) o.sprite = rewardSprite(o.gift.style, o.sx, o.id === "fair" ? o.sy : o.foot, o.id === "fair" ? 61 * scale : o.dw, period);
    else if (o.design) o.sprite = bakeFrontage(o, scale, period);
    o.box = o.sprite || { left: o.sx - o.dw * 0.83, right: o.sx + o.dw * 0.83, top: o.foot - o.dw * (o.gift ? 2.95 : o.hitHeight + 0.41), bottom: o.foot + o.dw * 0.18 };
    if (o.architecture || o.gift) {
      const w = o.dw, shadow = o.gift ? 1.65 : o.hitHeight;
      shape(c, "rgba(65,77,65,.14)", [[o.sx - w * 0.44, o.sy], [o.sx - w * 0.39 - w * shadow * 0.21, o.sy + w * 0.09], [o.sx - w * 0.13, o.sy + w * 0.23], [o.sx + w * 0.29, o.sy + w * 0.06]]);
    }
  }
  objects.sort((a, b) => a.sy - b.sy);
  const occluders = /* @__PURE__ */ new Map(), bucket = 64;
  for (const [idx, o] of objects.entries()) {
    o.order = idx;
    const b = o.box;
    for (let x = Math.floor(b.left / bucket); x <= Math.floor(b.right / bucket); x++) for (let y = Math.floor(b.top / bucket); y <= Math.floor(b.bottom / bucket); y++) {
      const k = key2(x, y);
      if (!occluders.has(k)) occluders.set(k, []);
      occluders.get(k).push(o);
    }
  }
  const buildings = objects.filter((o) => o.design), park = objects.find((o) => o.id === "fair");
  const densest = buildings.reduce((best, o) => {
    const score = buildings.reduce((n, b) => n + Math.max(0, 1 - ((b.sx - o.sx) ** 2 + (b.sy - o.sy) ** 2) / (135 * scale) ** 2) * (b.design.zone === "O" ? 1.35 : 1), 0);
    return score > best.score ? { score, o } : best;
  }, { score: -1, o: buildings[0] }).o;
  const academy = objects.find((o) => o.id === "academy");
  const focus = stage === 0 && academy ? [academy.sx, academy.sy - academy.design.height * scale * 0.52] : park ? [(park.sx * 3 + densest.sx) / 4, (park.sy * 3 + densest.sy) / 4 - 22 * scale] : [densest.sx, densest.sy - 25 * scale];
  const venue = planVenue(cells, roads, form, seed);
  const caretakers = walkers.filter((w) => w.stops.some((stop) => stop.act === "feed"));
  const cats = caretakers.length ? caretakers.slice(0, stage >= 3 ? 3 : 1) : walkers.slice(0, 1);
  const heroes = [...new Set(gifts.map((g) => g.style).filter((style) => rewardKind(style) === "person"))];
  const patrol = gifts.some((g) => g.style === 0) ? skyRoute(buildings, scale) : null;
  return { base: base2, objects, walkers, cars, academy, cats, heroes, patrol, period, focus, venue, occluders, bucket, roads, segments: network.segments, project, scale, blocks, cells, rail };
}
function drawParcel(c, o) {
  if (treeTile(c, o)) return;
  if (o.id === "streetlamp") {
    lamp(c, o.sx, o.sy, o.dw / 7, o.period);
    return;
  }
  if (o.id === "fair") return;
  if (o.id === "fair-square") {
    tile(c, "fountain", o.sx, o.sy, 19 * o.dw / 71);
    return;
  }
  if (o.sprite) c.drawImage(o.sprite.image, o.sprite.left, o.sprite.top, o.sprite.width, o.sprite.height);
  else {
    c.save();
    if (o.period === "night" || o.period === "dawn") c.globalAlpha = 0.55;
    tile(c, o.id, o.sx, o.foot, o.dw, o.flip);
    c.restore();
  }
}
function stillFrame(scene) {
  const cv = canvas(), c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.drawImage(scene.base, 0, 0);
  const parcel = scene.objects.find((o) => o.lot !== void 0 && o.lot === scene.highlightLot);
  if (parcel) {
    const { x, y } = parcel.t, d = 0.87, corners = [[x - d, y - d], [x + d, y - d], [x + d, y + d], [x - d, y + d]].map((q) => scene.project(...q));
    for (let i = 0; i < 4; i++) {
      const a = corners[i], part = (b) => a.map((v, j) => v + (b[j] - v) * 0.34);
      line(c, "#c79443", 2 * scene.scale, [part(corners[(i + 3) % 4]), a, part(corners[(i + 1) % 4])]);
    }
  }
  for (const o of scene.objects) if (o !== scene.academy) drawParcel(c, o);
  return cv;
}
function paintTown(c, scene, time) {
  const room = scene.academy;
  if (room) {
    const frame = classroomFrame(scene.period, time, room.design.seed);
    const catPose = ["night", "dawn"].includes(scene.period) ? classroomCatFrame(time, room.design.seed) : 0;
    if (room.pose !== frame || room.catPose !== catPose) {
      room.catPose = catPose;
      room.pose = frame;
      room.sprite = bakeFrontage(room, scene.scale, scene.period, frame, catPose);
      room.label = ["night", "dawn"].includes(scene.period) ? "재웅T 수업준비중" : "입실론수학학원 · 민재웅 선생님 강의 중";
    }
  }
  if (!scene.still || scene.mark !== scene.highlightLot) {
    scene.still = stillFrame(scene);
    scene.mark = scene.highlightLot;
  }
  c.drawImage(scene.still, 0, 0);
  const { scale, project } = scene, actors = [];
  function actor(depth, x0, y0, x1, y1, draw) {
    actors.push({ depth, x0, y0, x1, y1, draw });
  }
  for (const o of scene.objects) if (o.gift) for (const style of o.effects.filter((s) => s > 0 && s < 5)) {
    actor(
      o.sy + 16 * scale,
      o.sx - 50 * scale,
      o.foot - 76 * scale,
      o.sx + 50 * scale,
      o.foot + 2 * scale,
      () => cityVisitor(c, style, o.sx, o.foot, scale, time, o.lot + style)
    );
  }
  campusActors(c, scene, time, actor);
  const light = periods[scene.period];
  for (const o of scene.objects) if (o.id === "fair") {
    actor(o.sy, o.sx - 74 * scale, o.sy - 92 * scale, o.sx + 74 * scale, o.sy + 33 * scale, () => fair(c, o.sx, o.sy, 1.68 * scale, time, scene.period));
  }
  for (const trip of scene.cars.slice(0, Math.ceil(scene.cars.length * light.traffic))) {
    const p = carPose(trip, time), [x, y] = project(p.x, p.y);
    actor(y, x - 7 * scale, y - 7 * scale, x + 7 * scale, y + 4 * scale, () => car(c, x, y, scale, p, trip.paint, scene.period));
  }
  for (const w of scene.walkers.slice(0, Math.max(1, Math.round(scene.walkers.length * light.people)))) {
    const p = residentPose(w, time), [x, y] = project(p.x, p.y);
    actor(y, x - 11 * scale, y - 15 * scale, x + 11 * scale, y + 3 * scale, () => {
      c.save();
      c.translate(x, y);
      c.scale(scale * 0.53, scale * 0.53);
      drawResident(c, w, p, 0, 0);
      c.restore();
    });
  }
  if (scene.rail) {
    const [a, b] = scene.rail, f = (1 - Math.cos(time * 0.22)) / 2;
    for (let i = 0; i < 2; i++) {
      const y = a.y + 0.55 + (b.y - a.y - 1.5) * f + i * 0.45;
      const [x, v] = project(a.x + 0.38, y);
      actor(v, x - 11 * scale, v - 16 * scale, x + 11 * scale, v + 3 * scale, () => tile(c, "metro", x, v, 16 * scale));
    }
  }
  eventActors(c, scene, scene.eventState, actor);
  for (const a of actors.sort((a2, b) => a2.depth - b.depth)) {
    a.draw();
    c.save();
    c.beginPath();
    c.rect(a.x0, a.y0, a.x1 - a.x0, a.y1 - a.y0);
    c.clip();
    const near = /* @__PURE__ */ new Set(), size = scene.bucket;
    for (let x = Math.floor(a.x0 / size); x <= Math.floor(a.x1 / size); x++) for (let y = Math.floor(a.y0 / size); y <= Math.floor(a.y1 / size); y++) {
      for (const o of scene.occluders.get(key2(x, y)) || []) if (o.sy > a.depth) near.add(o);
    }
    for (const o of [...near].sort((p, q) => p.order - q.order)) {
      const b = o.box;
      if (b.left < a.x1 && b.right > a.x0 && b.top < a.y1 && b.bottom > a.y0) drawParcel(c, o);
    }
    c.restore();
  }
  if (scene.patrol) {
    const [x, y, right] = patrolPose(scene.patrol, scale, time);
    drawPatrol(c, x, y, scale * 1.25, right, time);
  }
  if (scene.eventState?.banner) drawExamBanner(c, scene, scene.eventState.banner);
}
function countryScene(root, count, selected, stage, towns = [], hours = null) {
  const base2 = canvas(), c = base2.getContext("2d");
  c.imageSmoothingEnabled = false;
  const cols = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / cols);
  const step = Math.min(158, W * 0.74 / (cols + 1), H * 0.66 / (rows + 1));
  const pts = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols), col = row % 2 ? cols - 1 - i % cols : i % cols;
    return { i, x: W / 2 + (col - (cols - 1) / 2) * step + (row - (rows - 1) / 2) * step * 0.34, y: H * 0.48 + (row - (rows - 1) / 2) * step * 0.72 - (col - (cols - 1) / 2) * step * 0.16 };
  });
  landscape(c, (x, y) => [W / 2 + (x - y) * 19, H / 2 + (x + y) * 9.5], 1, root);
  for (let i = 1; i < count; i++) {
    const a = pts[i - 1], b = pts[i], j = [b.x, a.y + (b.x - a.x) * 0.35];
    line(c, "#d9caaa", 7, [[a.x, a.y], j, [b.x, b.y]]);
    line(c, "#84908b", 4, [[a.x, a.y], j, [b.x, b.y]]);
  }
  for (const p of [...pts].sort((a, b) => a.y - b.y)) {
    const town = towns[p.i], plan = town?.plan || examplePlan(root + p.i, p.i % 6), area = plan.blocks.slice(0, limits[p.i < count - 1 ? 5 : stage]);
    const full = urbanPlan(plan), form = cityForm(full);
    if (hours != null && p.i === count - 1) area.splice(0, area.length, ...development(plan, hours).cells);
    else area.push(...full.extras.filter((cell) => cell[4] <= area.length));
    const extent = area.flatMap(([a, b]) => [[a * 4, b * 4], [a * 4 + 4, b * 4], [a * 4, b * 4 + 4], [a * 4 + 4, b * 4 + 4]]).map((q) => form.ground(...q));
    const xs = extent.map((q) => q[0]), ys = extent.map((q) => q[1]), lo = Math.min(...xs), hi = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
    const scale = Math.min(step * 0.76 / (hi - lo), step * 0.5 / (bottom - top), 0.21);
    const project = (x, y) => {
      const [sx, sy] = form.ground(x, y);
      return [p.x + (sx - (lo + hi) / 2) * scale, p.y + (sy - (top + bottom) / 2) * scale];
    };
    const samples = { H: "terrace-row", O: "terraced-tower", S: "arcade", P: "linden", C: "library", T: "platform", A: "court-yard", I: "warehouse" };
    for (const [a, b, z] of area) {
      const x = a * 4, y = b * 4;
      polygon(c, project, [[x, y], [x + 4, y], [x + 4, y + 4], [x, y + 4]], z === "P" ? "#98b27e" : "#cdc7ab");
      road(c, project, x, y, x + 4, y, "#939c90", 1);
      road(c, project, x, y, x, y + 4, "#939c90", 1);
    }
    for (const [a, b, z] of [...area].sort((v, w) => project(v[0] * 4, v[1] * 4)[1] - project(w[0] * 4, w[1] * 4)[1])) {
      const [u, v] = project(a * 4 + 2, b * 4 + 2);
      tile(c, samples[z], u, v + 2, Math.max(4, scale * 84));
    }
    if (p.i === selected) {
      c.fillStyle = "#b96542";
      c.fillRect(p.x - 1, p.y - 20, 2, 17);
      shape(c, "#cc7147", [[p.x, p.y - 20], [p.x + 11, p.y - 17], [p.x, p.y - 13]]);
    }
    if (town?.name) {
      c.font = '9px "Gmarket Sans",sans-serif';
      c.textAlign = "center";
      const label2 = town.name.length > 9 ? town.name.slice(0, 8) + "…" : town.name;
      c.fillStyle = "#f6f2dc";
      const w = c.measureText(label2).width;
      c.fillRect(p.x - w / 2 - 3, p.y + 13, w + 6, 13);
      c.fillStyle = "#344c49";
      c.fillText(label2, p.x, p.y + 23);
    }
  }
  return { base: base2, pts };
}

// Pages작업본/mm/art/world.js
var HOURS = 36e5;
var TOWN = 240 * HOURS;
var thresholds = growthHours;
var themes = models.map((m) => m.name + "형");
var rewards = rewardNames;
function rand(seed, key4) {
  let a = hash(seed + "|" + key4);
  a = Math.imul(a ^ a >>> 16, 2246822507);
  a = Math.imul(a ^ a >>> 13, 3266489909);
  return ((a ^ a >>> 16) >>> 0) / 4294967296;
}
function biome(seed, index) {
  const order = themes.map((_, i) => i).sort((a, b) => rand(seed, "type" + a) - rand(seed, "type" + b));
  return order[index % order.length];
}
function townName(seed, index, kind = biome(seed, index)) {
  const a = ["버들", "모래", "솔빛", "해온", "푸른", "은빛", "노을", "새봄", "달", "가람", "새벽", "별빛"];
  const b = ["강변", "역촌", "공원", "광장", "물길", "숲길"];
  return a[Math.floor(rand(seed, "name" + index) * a.length)] + b[kind];
}
function phase(ms) {
  return thresholds.reduce((best, h, i) => ms >= h * HOURS ? i : best, 0);
}
var dispose = () => {
};
var cameraMemory = null;
function stopMap() {
  dispose();
  dispose = () => {
  };
}
function mountMap(canvas2, opts) {
  stopMap();
  if (!canvas2) return;
  let live = true, frame = 0, zoom = 1, panX = 0, panY = 0, scene, world;
  const viewId = [opts.seed, opts.kind, opts.stage, opts.country, opts.mini].join("/");
  if (cameraMemory?.key === viewId) ({ zoom, panX, panY } = cameraMemory);
  const points = /* @__PURE__ */ new Map();
  let lastDrag, dragged = false, previous = 0, elapsed = 0, inView = false;
  const motion = matchMedia("(prefers-reduced-motion:reduce)");
  let fit = 1, viewW = W, viewH = H, initial = true, clockTimer = 0, lightKey = null;
  const shell = canvas2.closest(".world-shell"), district = shell?.querySelector("#districtVisit"), picker = shell?.querySelector("#eventVisit");
  const happening = shell?.querySelector("#cityHappening"), blurb = shell?.querySelector("#districtBlurb");
  const placement = shell?.querySelector("#rewardPlace");
  let moving = null, sites = [], selectedSite = null, saving = false;
  function closePlacement() {
    moving = null;
    sites = [];
    selectedSite = null;
    if (placement) placement.hidden = true;
  }
  const buildable = /* @__PURE__ */ new Map();
  if (!opts.country && !opts.mini) {
    for (let style = 0; style < rewardNames.length; style++) for (const lot of rewardSites(opts.plan, style, opts.opened)) {
      if (!buildable.has(lot)) buildable.set(lot, /* @__PURE__ */ new Set());
      buildable.get(lot).add(style);
    }
  }
  function openLot(plot) {
    closePlacement();
    placement.replaceChildren();
    placement.hidden = false;
    const header = document.createElement("header"), title = document.createElement("strong"), close = document.createElement("button");
    title.textContent = "리워드 건물 짓기";
    close.type = "button";
    close.textContent = "← 뒤로";
    close.onclick = () => {
      if (!saving) closePlacement();
    };
    header.append(title, close);
    const list = document.createElement("ul"), status = document.createElement("small");
    status.setAttribute("role", "status");
    const available = opts.gifts.filter((g) => buildable.get(plot.lot).has(g.style)).sort((a, b) => (a.lot >= 0) - (b.lot >= 0));
    for (const g of available) {
      const li = document.createElement("li"), button3 = document.createElement("button"), name = document.createElement("b"), action2 = document.createElement("span");
      button3.type = "button";
      name.textContent = rewardNames[g.style];
      action2.textContent = g.lot < 0 ? "짓기" : "이곳으로 이전";
      button3.append(rewardThumbnail(g.style), name, action2);
      li.append(button3);
      list.append(li);
      button3.onclick = async () => {
        if (saving) return;
        saving = true;
        placement.querySelectorAll("button").forEach((b) => b.disabled = true);
        try {
          await opts.moveGift(g, plot.lot);
        } catch (error) {
          status.textContent = error.message;
          placement.querySelectorAll("button").forEach((b) => b.disabled = false);
        } finally {
          saving = false;
        }
      };
    }
    if (!available.length) status.textContent = "이 자리에 지을 수 있는 리워드가 아직 없어요.";
    placement.append(header, list, status);
    close.focus({ preventScroll: true });
  }
  function openPlacement(g) {
    if (!placement || !g || opts.goal && !opts.demo || rewardKind(g.style) === "person" || opts.country || opts.mini) return;
    moving = g;
    selectedSite = null;
    placement.replaceChildren();
    placement.hidden = false;
    const occupied = new Set(opts.gifts.filter((other) => other !== g && other.lot >= 0).map((other) => other.lot));
    const allowed = new Set(rewardSites(opts.plan, g.style, opts.opened));
    sites = scene.objects.filter((o) => o.lot !== void 0 && allowed.has(o.lot) && o.lot !== g.lot && !occupied.has(o.lot));
    const title = document.createElement("strong");
    title.textContent = rewardNames[g.style];
    const select = document.createElement("select");
    select.setAttribute("aria-label", "옮길 자리");
    select.add(new Option(sites.length ? "옮길 자리 선택" : "개척된 빈자리 없음", ""));
    for (const o of sites) select.add(new Option(siteName(opts.plan, o.lot), String(o.lot)));
    if (g.lot !== -1) select.add(new Option("보관함으로", "-1"));
    const ok = document.createElement("button");
    ok.type = "button";
    ok.disabled = true;
    ok.textContent = "옮기기";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "← 뒤로";
    const msg = document.createElement("small");
    msg.setAttribute("role", "status");
    const controls2 = document.createElement("div");
    controls2.append(select, ok, cancel);
    placement.append(title, controls2, msg);
    select.onchange = () => {
      selectedSite = select.value === "" ? null : Number(select.value);
      ok.disabled = selectedSite === null;
      const plot = sites.find((o) => o.lot === selectedSite);
      if (plot) centerOn([plot.sx, plot.sy - 8 * scene.scale], Math.max(zoom, 2.5));
      else draw(elapsed);
    };
    cancel.onclick = () => {
      if (!saving) {
        closePlacement();
        draw(elapsed);
      }
    };
    ok.onclick = async () => {
      if (saving || selectedSite === null) return;
      saving = true;
      ok.disabled = true;
      select.disabled = true;
      cancel.disabled = true;
      try {
        await opts.moveGift(g, selectedSite);
      } catch (error) {
        msg.textContent = error.message;
        ok.disabled = false;
        select.disabled = false;
        cancel.disabled = false;
      } finally {
        saving = false;
      }
    };
    draw(elapsed);
    select.focus({ preventScroll: true });
  }
  function updateTicker() {
    if (!scene || !opts.ticker) return;
    scene.ticker = opts.ticker();
    if (!opts.mini) canvas2.setAttribute("aria-description", scene.ticker.join(" / "));
  }
  function refreshSign() {
    updateTicker();
    draw(elapsed);
  }
  canvas2.addEventListener("ticker-update", refreshSign);
  function chooseCollected(e) {
    openPlacement(opts.gifts.find((g) => g.exam === e.detail));
  }
  canvas2.addEventListener("select-reward", chooseCollected);
  let eventMode = opts.event || "auto", eventBase = null, eventAt = 0, previewStart = 0;
  if (picker) {
    if (picker.querySelector('option[value="' + eventMode + '"]')?.disabled) {
      eventMode = "auto";
      opts.setEvent?.("auto");
    }
    picker.value = eventMode;
  }
  function eventClock(now) {
    if (opts.country || !scene) return;
    eventAt = now.getTime();
    eventBase = cityEvents(opts.seed, opts.stage, scene.objects.some((o) => o.id === "fair"), now, eventMode, 18 + (elapsed - previewStart) / 1e3, opts.recentAward);
    if (happening) {
      const { show, banner } = eventBase, items = [];
      if (show) items.push((show.occasion ? show.occasion + " · " : "") + (show.type === "concert" ? "광장 콘서트" : "깜짝 단체 댄스"));
      if (banner) items.push(banner.name + " " + (banner.days ? "D−" + banner.days : "시험 당일") + " · " + banner.grades);
      happening.hidden = !items.length;
      happening.textContent = (eventMode !== "auto" ? "미리보기 · " : "") + items.join(" / ") + "  ↗";
    }
  }
  function centerOn(point, factor) {
    if (!scene || !point) return;
    const z = Math.min(8, factor);
    panX = (W / 2 - point[0]) * fit * z;
    panY = (H / 2 - point[1]) * fit * z;
    change(z);
  }
  function visitEvent() {
    if (!scene) return;
    const bannerVisit = eventBase?.banner && (eventMode === "banner" || !eventBase.show);
    const [x, y] = bannerVisit ? bannerPosition(scene) : scene.project(...scene.venue.origin);
    const worldPixel = fit / (viewW / canvas2.getBoundingClientRect().width);
    centerOn([x, y - (bannerVisit ? 34 : 11) * scene.scale], Math.max(2.6, 1.82 / (scene.scale * worldPixel)));
    if (district) district.selectedIndex = -1;
    if (blurb) {
      blurb.hidden = false;
      blurb.textContent = scene.venue.name;
    }
  }
  if (happening) happening.onclick = visitEvent;
  if (picker) picker.onchange = () => {
    eventMode = picker.value;
    opts.setEvent?.(eventMode);
    previewStart = elapsed;
    eventClock(/* @__PURE__ */ new Date());
    if (eventMode !== "auto") visitEvent();
    else draw(elapsed);
  };
  if (district) district.onchange = () => {
    if (!scene) return;
    if (district.value === "full") {
      change(1);
      if (blurb) blurb.hidden = true;
      return;
    }
    const d = urbanPlan(opts.plan).districts.find((d2) => d2.id === district.value);
    const target = d ? scene.project(4 * d.hub[0] + 2, 4 * d.hub[1] + 2) : scene.focus;
    centerOn(target, viewW < viewH ? 5 : 2.8);
    if (blurb) {
      blurb.hidden = false;
      blurb.textContent = d ? d.description : "도시가 처음 자라난 구시가지예요.";
    }
  };
  const c = canvas2.getContext("2d");
  canvas2.width = W;
  canvas2.height = H;
  function draw(time) {
    c.imageSmoothingEnabled = false;
    c.fillStyle = { dawn: "#37405c", morning: "#a5ad7b", day: "#90ab78", evening: "#8c8979", night: "#212b40" }[lightKey] || "#90ab78";
    c.fillRect(0, 0, viewW, viewH);
    c.save();
    c.translate(viewW / 2 + panX, viewH / 2 + panY);
    c.scale(zoom * fit, zoom * fit);
    c.translate(-W / 2, -H / 2);
    if (world) {
      c.drawImage(world.base, 0, 0);
      const shade = periods[lightKey || "day"].shade;
      if (shade[3]) {
        c.fillStyle = "rgba(" + shade.join(",") + ")";
        c.fillRect(0, 0, W, H);
      }
    } else if (scene) {
      if (eventBase) {
        let show = eventBase.show;
        if (show) {
          const age = eventMode === "auto" ? show.elapsed + Math.max(0, (Date.now() - eventAt) / 1e3) : (18 + (time - previewStart) / 1e3) % show.duration;
          show = age >= show.duration ? null : { ...show, elapsed: age };
        }
        scene.eventState = { banner: eventBase.banner, show };
      }
      paintTown(c, scene, time / 1e3);
      if (moving) for (const plot of sites) {
        const radius = 6 * scene.scale, mark = plot.lot === selectedSite;
        c.beginPath();
        c.arc(plot.sx, plot.sy, radius, 0, Math.PI * 2);
        c.fillStyle = mark ? "#dfaa51" : "#366657";
        c.fill();
        c.strokeStyle = "#fff6d6";
        c.lineWidth = scene.scale;
        c.stroke();
        c.fillStyle = "#fff6dc";
        c.font = "bold " + Math.max(5, 8 * scene.scale) + "px sans-serif";
        c.textAlign = "center";
        c.fillText("+", plot.sx, plot.sy + 2.8 * scene.scale);
      }
    }
    c.restore();
  }
  function clamp() {
    const mx = Math.max(0, (W * zoom * fit - viewW) / 2), my = Math.max(0, (H * zoom * fit - viewH) / 2);
    panX = Math.max(-mx, Math.min(mx, panX));
    panY = Math.max(-my, Math.min(my, panY));
  }
  function change(z) {
    zoom = Math.max(1, Math.min(8, z));
    clamp();
    draw(elapsed);
    const out = document.querySelector("#zoomValue");
    if (out) out.textContent = Number(zoom.toFixed(1)) + "×";
    const all = canvas2.parentElement.querySelector(".map-fit");
    if (all) all.hidden = zoom <= 1;
  }
  function pos(e) {
    const r = canvas2.getBoundingClientRect();
    return [(e.clientX - r.left) * viewW / r.width, (e.clientY - r.top) * viewH / r.height];
  }
  const distance2 = () => {
    const [a, b] = [...points.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  };
  canvas2.onpointerdown = (e) => {
    if (opts.mini) return;
    canvas2.setPointerCapture(e.pointerId);
    points.set(e.pointerId, pos(e));
    lastDrag = pos(e);
    dragged = points.size > 1 || false;
  };
  canvas2.onpointermove = (e) => {
    if (!points.has(e.pointerId)) return;
    const xy = pos(e), old = points.get(e.pointerId);
    const before = points.size === 2 ? distance2() : 0;
    points.set(e.pointerId, xy);
    if (before > 1) {
      change(zoom * distance2() / before);
      dragged = true;
    } else if (zoom > 1) {
      panX += xy[0] - old[0];
      panY += xy[1] - old[1];
      clamp();
      draw(elapsed);
    }
    if (lastDrag && Math.hypot(xy[0] - lastDrag[0], xy[1] - lastDrag[1]) > 5) dragged = true;
  };
  canvas2.onpointerup = (e) => {
    points.delete(e.pointerId);
    if (dragged || opts.mini) return;
    const p = pos(e), x = (p[0] - viewW / 2 - panX) / (zoom * fit) + W / 2, y = (p[1] - viewH / 2 - panY) / (zoom * fit) + H / 2;
    if (!world && scene) {
      if (moving) {
        if (saving) return;
        const pick = sites.map((o) => [o, Math.hypot(o.sx - x, o.sy - y)]).sort((a, b) => a[1] - b[1])[0];
        if (pick && pick[1] < Math.max(9 * scene.scale, 18 / (zoom * fit))) {
          const select = placement.querySelector("select");
          select.value = String(pick[0].lot);
          select.onchange();
        }
        return;
      }
      if (onSign(scene.academy, scene.scale, x, y) && opts.showPodium) {
        opts.showPodium();
        return;
      }
      const front = [...scene.objects].reverse();
      const hit = front.find((o) => {
        if (o.background || !o.label) return false;
        if (o.sprite) {
          const b = o.sprite;
          if (x <= b.left || x >= b.right || y <= b.top || y >= b.bottom) return false;
          const u = Math.floor((x - b.left) * b.image.width / b.width), v = Math.floor((y - b.top) * b.image.height / b.height);
          return b.image.getContext("2d").getImageData(u, v, 1, 1).data[3] > 32;
        }
        return Math.abs(x - o.sx) < o.dw * 0.44 && y > o.foot - o.dw * (o.gift ? o.gift.style === 13 ? 2.25 : 1.85 : o.hitHeight) && y < o.foot;
      });
      if (hit) {
        if (hit.gift) openPlacement(hit.gift);
        else if (buildable.has(hit.lot) && (!opts.goal || opts.demo)) openLot(hit);
        else opts.inspect?.(hit.label, hit.gift);
      }
      return;
    }
    if (!world) return;
    const near = [...world.pts].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (near && Math.hypot(near.x - x, near.y - y) < 35) opts.openTown(near.i);
  };
  canvas2.onpointercancel = (e) => points.delete(e.pointerId);
  const zoomOut = canvas2.parentElement.querySelector("#zoomValue");
  if (zoomOut) zoomOut.textContent = zoom + "×";
  const controls = canvas2.parentElement.querySelectorAll("[data-zoom]");
  controls.forEach((b) => b.onclick = () => change(b.dataset.zoom === "reset" ? 1 : zoom + Number(b.dataset.zoom)));
  const delay = opts.mini ? 120 : 66;
  function running() {
    return live && scene && inView && !motion.matches && !document.hidden && !document.querySelector("dialog[open]");
  }
  function tick() {
    if (!running()) return;
    const now = performance.now();
    elapsed += Math.min(now - previous, 250);
    previous = now;
    draw(elapsed);
    frame = setTimeout(tick, delay);
  }
  function update() {
    clearTimeout(frame);
    if (running()) {
      previous = performance.now();
      frame = setTimeout(tick, delay);
    }
  }
  const visibility = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    update();
  });
  visibility.observe(canvas2);
  const modals = new MutationObserver(update);
  document.querySelectorAll("dialog").forEach((d) => modals.observe(d, { attributes: true, attributeFilter: ["open"] }));
  document.addEventListener("visibilitychange", update);
  motion.addEventListener("change", update);
  function checkClock() {
    clearTimeout(clockTimer);
    const now = /* @__PURE__ */ new Date(), phase2 = opts.light && opts.light !== "auto" ? opts.light : koreanPeriod(now);
    if (phase2 !== lightKey && !opts.country) {
      scene = townScene(opts.seed, opts.kind, opts.stage, opts.gifts, opts.plan, phase2, opts.hours);
      updateTicker();
      if (opts.demo) scene.highlightLot = opts.gifts?.find((g) => g.lot >= 0)?.lot;
    }
    eventClock(now);
    lightKey = phase2;
    const badge = canvas2.parentElement.querySelector("#worldTime");
    if (badge) {
      const clock = String((now.getUTCHours() + 9) % 24).padStart(2, "0") + ":" + String(now.getUTCMinutes()).padStart(2, "0");
      const current = "한국 " + clock + " · " + periods[koreanPeriod(now)].label;
      badge.textContent = opts.light && opts.light !== "auto" ? periods[phase2].label + " 풍경" : current;
      const auto = canvas2.parentElement.querySelector("#cityLight option[value=auto]");
      if (auto) auto.textContent = current;
    }
    if (!document.hidden && live) {
      draw(elapsed);
      clockTimer = setTimeout(checkClock, 60050 - Date.now() % 6e4);
    }
  }
  function resize() {
    const r = canvas2.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const ratio = Math.min(2, devicePixelRatio || 1);
    const oldFit = fit;
    viewW = Math.round(r.width * ratio);
    viewH = Math.round(r.height * ratio);
    canvas2.width = viewW;
    canvas2.height = viewH;
    fit = Math.min(viewW / W, viewH / H);
    panX *= fit / oldFit;
    panY *= fit / oldFit;
    if (initial && cameraMemory?.key !== viewId && !opts.country && !opts.mini && !opts.overview) {
      zoom = 2.5;
      const target = scene?.focus;
      if (district) district.selectedIndex = -1;
      if (target) {
        panX = (W / 2 - target[0]) * fit * zoom;
        panY = (H / 2 - target[1]) * fit * zoom;
      }
    }
    initial = false;
    change(zoom);
  }
  document.addEventListener("visibilitychange", checkClock);
  if (opts.country) world = countryScene(opts.root, opts.count, opts.index, opts.currentStage, opts.towns, opts.countryHours);
  checkClock();
  resize();
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas2);
  if (scene && eventMode !== "auto" && !opts.mini) visitEvent();
  draw(0);
  update();
  dispose = () => {
    canvas2.removeEventListener("ticker-update", refreshSign);
    canvas2.removeEventListener("select-reward", chooseCollected);
    sizeObserver.disconnect();
    clearTimeout(clockTimer);
    document.removeEventListener("visibilitychange", checkClock);
    cameraMemory = { key: viewId, zoom, panX: panX / fit, panY: panY / fit };
    live = false;
    clearTimeout(frame);
    visibility.disconnect();
    modals.disconnect();
    document.removeEventListener("visibilitychange", update);
    motion.removeEventListener("change", update);
  };
}

// Pages작업본/mm/city.js
async function action(op, data = {}) {
  const r = await session2().rpc("mm_city", { op, data });
  if (r.error) throw Error(r.error.message);
  return r.data;
}
function planFor(seed, n) {
  const kind = biome(seed, n), m = models[kind], flip = hash(seed + "/" + n) >>> 0, mx = flip % 2 ? 1 : -1, my = flip % 4 < 2 ? 1 : -1, used = /* @__PURE__ */ new Set();
  const blocks = m.blocks.map(([x, y, zone], i) => {
    const h = hash(seed + "/plot/" + n + "/" + i) >>> 0;
    if (i >= 11) {
      const edge = /* @__PURE__ */ new Map();
      for (const xy of used) {
        const [u, v] = xy.split(",").map(Number);
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!used.has([u + a, v + b].join(","))) edge.set([u + a, v + b].join(","), [u + a, v + b]);
      }
      const candidates = [...edge.values()].sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1])).slice(0, 6);
      if (candidates.length) [x, y] = candidates[h % candidates.length];
    }
    used.add([x, y].join(","));
    return [x * mx, y * my, zone, h & 2147483647];
  });
  return { version: 1, kind, feature: m.feature, motif: m.name, guide: m.guide, axisX: mx === 1 ? 4 : 0, axisY: my === 1 ? 4 : 0, blocks };
}
async function city(root, s, current, requested) {
  const [c, weekly, topExam] = await Promise.all([action("get"), classroom("study-board", { period: "week" }), followup("podium")]);
  if (!current()) return;
  const total = s.seconds / 3600, latest = c.towns.length - 1, index = requested != null ? Math.max(0, Math.min(latest, Number(requested) || 0)) : latest, towns = c.towns.map((t2) => ({ index: t2.n, name: t2.name || townName(s.id, t2.n), plan: planFor(s.id, t2.n) })), t = towns[index], hours = Math.max(0, Math.min(240, total - index * 240)), stage = phase(hours * 36e5), opened = [1, 3, 5, 8, 11, 14][stage], plan = t.plan;
  const gifts = c.gifts.map((g, j) => {
    const style = (hash(g.exam + "/" + s.id) >>> 0) % rewards.length, sites = rewardSites(plan, style, opened);
    return { ...g, style, lot: sites.includes(g.lot) ? g.lot : sites[j % Math.max(1, sites.length)] ?? -1 };
  }).filter((g, i) => (g.town ?? Math.min(latest, Math.floor(i / 40))) === index);
  const top = (rows) => rows.filter((x) => x.rank <= 3).slice(0, 9).map((x) => x.rank + "등 " + x.nickname).join(" · "), ticker = ["이번 주 순공 " + (top(weekly) || "집계 중"), "테스트 " + (top(topExam) || "집계 중")];
  root.innerHTML = '<div class="world-shell mapArea"><canvas id="cityView" aria-label="마이시티 전경"></canvas><div class="mapTools"><span id="worldTime"></span><button data-zoom="-1">−</button><button data-zoom="reset" id="zoomValue">2.5×</button><button data-zoom="1">＋</button></div><div id="worldNote" class="mapNote" hidden></div><div id="rewardPlace" class="float" hidden></div></div><details><summary>' + esc2(t.name) + '</summary><form id="townName"><input aria-label="도시 이름" name="name" maxlength="16" required value="' + esc2(t.name) + '"><button>이름 저장</button></form><div class="actions">' + towns.map((v, i) => button2(v.name, "go:city/" + i)).join("") + (index === latest && hours >= 240 ? button2("다음 마을", "advance") : "") + '</div></details><dialog id="sign"><h2>학원 전광판</h2><p></p>' + button2("닫기", "close") + "</dialog>";
  const opts = { root: s.id, index, count: towns.length, currentStage: stage, seed: s.id + "-" + index, kind: plan.kind, stage, actual: stage, goal: false, country: false, mini: false, hours, opened, gifts, plan, towns, light: "auto", event: "auto", ticker: () => ticker, showPodium() {
    const d = root.querySelector("#sign");
    d.querySelector("p").textContent = ticker.join(" · ");
    d.showModal();
  }, inspect(name) {
    const el = root.querySelector("#worldNote");
    if (el) {
      el.hidden = false;
      el.textContent = name;
    }
  }, async moveGift(g, lot) {
    if (!rewardSites(plan, g.style, opened).includes(lot)) throw Error("옮길 위치를 확인하세요.");
    await action("move", { exam: g.exam, lot });
    go2("city/" + index);
  } };
  mountMap(root.querySelector("canvas"), opts);
  events2(root, { go: go2, close: () => root.querySelector("dialog").close(), advance: async () => {
    await action("advance", { current: latest });
    go2("city");
  } });
  root.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await action("name", { n: index, name: e.target.elements.namedItem("name").value });
      go2("city/" + index);
    } catch (err) {
      say2(err.message);
    }
  };
  return stopMap;
}
export {
  city
};
