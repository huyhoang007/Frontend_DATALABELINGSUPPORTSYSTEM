import fs from "node:fs/promises";
import path from "node:path";

const IMAGE_WIDTH = 384;
const IMAGE_HEIGHT = 216;

function parseArgs(argv) {
  const args = { dryRun: false, manifest: "demo/demo-seed.manifest.json" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--manifest") args.manifest = argv[i + 1];
    else if (arg === "--output-root") args.outputRoot = argv[i + 1];
    else if (arg === "--project") args.project = argv[i + 1];
  }
  return args;
}

function mulberry32(seed) {
  return function rng() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function createCanvas(width, height, color) {
  const pixels = new Uint8Array(width * height * 3);
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = color[0];
    pixels[i + 1] = color[1];
    pixels[i + 2] = color[2];
  }
  return { width, height, pixels };
}

function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const idx = (y * canvas.width + x) * 3;
  canvas.pixels[idx] = color[0];
  canvas.pixels[idx + 1] = color[1];
  canvas.pixels[idx + 2] = color[2];
}

function fillRect(canvas, x, y, width, height, color) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(canvas.width, Math.floor(x + width));
  const y1 = Math.min(canvas.height, Math.floor(y + height));
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      setPixel(canvas, xx, yy, color);
    }
  }
}

function fillCircle(canvas, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if ((dx * dx) + (dy * dy) <= r2) setPixel(canvas, x, y, color);
    }
  }
}

function drawGradient(canvas, topColor, bottomColor) {
  for (let y = 0; y < canvas.height; y += 1) {
    const t = y / Math.max(1, canvas.height - 1);
    const color = [
      Math.round(topColor[0] * (1 - t) + bottomColor[0] * t),
      Math.round(topColor[1] * (1 - t) + bottomColor[1] * t),
      Math.round(topColor[2] * (1 - t) + bottomColor[2] * t)
    ];
    fillRect(canvas, 0, y, canvas.width, 1, color);
  }
}

function addNoise(canvas, rng, amount = 5) {
  for (let i = 0; i < canvas.pixels.length; i += 3) {
    const delta = Math.floor((rng() - 0.5) * amount);
    canvas.pixels[i] = clamp(canvas.pixels[i] + delta);
    canvas.pixels[i + 1] = clamp(canvas.pixels[i + 1] + delta);
    canvas.pixels[i + 2] = clamp(canvas.pixels[i + 2] + delta);
  }
}

function drawVehicle(canvas, x, y, scale, bodyColor) {
  fillRect(canvas, x, y, 44 * scale, 14 * scale, bodyColor);
  fillRect(canvas, x + (10 * scale), y - (10 * scale), 22 * scale, 10 * scale, bodyColor.map((v) => clamp(v + 16)));
  fillCircle(canvas, x + (10 * scale), y + (16 * scale), 4 * scale, [20, 20, 20]);
  fillCircle(canvas, x + (34 * scale), y + (16 * scale), 4 * scale, [20, 20, 20]);
}

function drawPerson(canvas, x, y, scale, bodyColor) {
  fillCircle(canvas, x, y, 5 * scale, [235, 214, 190]);
  fillRect(canvas, x - (4 * scale), y + (5 * scale), 8 * scale, 16 * scale, bodyColor);
  fillRect(canvas, x - (6 * scale), y + (20 * scale), 4 * scale, 12 * scale, [60, 60, 60]);
  fillRect(canvas, x + (2 * scale), y + (20 * scale), 4 * scale, 12 * scale, [60, 60, 60]);
}

function drawTraffic(canvas, rng) {
  drawGradient(canvas, [163, 216, 255], [233, 242, 255]);
  fillRect(canvas, 0, canvas.height * 0.58, canvas.width, canvas.height * 0.42, [71, 85, 105]);
  for (let i = 0; i < 6; i += 1) fillRect(canvas, 24 + (i * 62), 150, 32, 6, [250, 204, 21]);
  for (let i = 0; i < 5; i += 1) fillRect(canvas, 18 + (i * 70), 58 + (rng() * 26), 48, 78, [148, 163, 184]);
  for (let i = 0; i < 5; i += 1) drawVehicle(canvas, 20 + (i * 68), 134 + ((i % 2) * 16), 1 + (rng() * 0.2), [30 + Math.floor(rng() * 140), 80 + Math.floor(rng() * 120), 120 + Math.floor(rng() * 100)]);
  for (let i = 0; i < 3; i += 1) drawPerson(canvas, 40 + (i * 90), 120, 1, [31, 41, 55]);
}

function drawParking(canvas, rng) {
  drawGradient(canvas, [198, 232, 255], [240, 246, 255]);
  fillRect(canvas, 0, 90, canvas.width, canvas.height - 90, [94, 109, 126]);
  for (let row = 0; row < 2; row += 1) {
    for (let i = 0; i < 5; i += 1) {
      const x = 20 + (i * 70);
      const y = 105 + (row * 54);
      fillRect(canvas, x, y, 56, 34, [220, 220, 220]);
      fillRect(canvas, x + 2, y + 2, 52, 30, [108, 117, 125]);
      if (rng() > 0.45) drawVehicle(canvas, x + 6, y + 10, 0.9, [130 + Math.floor(rng() * 90), 70 + Math.floor(rng() * 90), 60 + Math.floor(rng() * 110)]);
    }
  }
  fillRect(canvas, 300, 68, 34, 64, [71, 85, 105]);
  fillRect(canvas, 334, 84, 28, 8, [239, 68, 68]);
}

function drawRetail(canvas, rng) {
  drawGradient(canvas, [244, 237, 228], [255, 250, 245]);
  for (let shelf = 0; shelf < 3; shelf += 1) {
    const y = 70 + (shelf * 42);
    fillRect(canvas, 24, y, 320, 6, [120, 98, 76]);
    for (let p = 0; p < 16; p += 1) fillRect(canvas, 28 + (p * 20), y - 18 - (rng() * 6), 12, 18 + (rng() * 6), [120 + Math.floor(rng() * 80), 50 + Math.floor(rng() * 120), 90 + Math.floor(rng() * 120)]);
  }
  drawPerson(canvas, 72, 128, 1.2, [15, 23, 42]);
  drawPerson(canvas, 148, 126, 1.1, [2, 132, 199]);
  fillRect(canvas, 220, 130, 28, 18, [107, 114, 128]);
  fillRect(canvas, 224, 134, 20, 10, [14, 165, 233]);
}

function drawWarehouse(canvas, rng) {
  drawGradient(canvas, [209, 213, 219], [241, 245, 249]);
  for (let rack = 0; rack < 3; rack += 1) {
    const x = 26 + (rack * 112);
    fillRect(canvas, x, 58, 8, 110, [82, 82, 91]);
    fillRect(canvas, x + 72, 58, 8, 110, [82, 82, 91]);
    for (let level = 0; level < 3; level += 1) {
      fillRect(canvas, x, 84 + (level * 28), 80, 4, [107, 114, 128]);
      for (let box = 0; box < 3; box += 1) fillRect(canvas, x + 10 + (box * 20), 66 + (level * 28), 16, 16, [180 + Math.floor(rng() * 30), 120 + Math.floor(rng() * 30), 60 + Math.floor(rng() * 30)]);
    }
  }
  drawVehicle(canvas, 242, 142, 1.1, [234, 179, 8]);
  drawPerson(canvas, 305, 130, 1.1, [22, 163, 74]);
}

function drawSafety(canvas, rng) {
  drawGradient(canvas, [189, 228, 255], [245, 250, 255]);
  fillRect(canvas, 0, 142, canvas.width, 74, [194, 178, 128]);
  for (let i = 0; i < 5; i += 1) {
    fillRect(canvas, 26 + (i * 68), 156, 18, 30, [251, 146, 60]);
    fillCircle(canvas, 35 + (i * 68), 156, 9, [254, 215, 170]);
  }
  for (let i = 0; i < 3; i += 1) {
    drawPerson(canvas, 82 + (i * 92), 116, 1.2, [245, 158, 11]);
    fillRect(canvas, 77 + (i * 92), 109, 10, 4, [250, 204, 21]);
  }
  fillRect(canvas, 260, 120, 72, 8, [220, 38, 38]);
  fillRect(canvas, 260, 128, 72, 8, [255, 255, 255]);
}

function drawScene(project, index) {
  const seed = hashString(`${project.slug}:${index}`);
  const rng = mulberry32(seed);
  const domain = project.slug.split("-")[0];
  const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT, [255, 255, 255]);
  if (domain === "urban") drawTraffic(canvas, rng);
  else if (domain === "parking") drawParking(canvas, rng);
  else if (domain === "retail") drawRetail(canvas, rng);
  else if (domain === "warehouse") drawWarehouse(canvas, rng);
  else drawSafety(canvas, rng);
  addNoise(canvas, rng, 10);
  return canvas;
}

function encodeBmp(canvas) {
  const rowStride = canvas.width * 3;
  const rowPadding = (4 - (rowStride % 4)) % 4;
  const pixelArraySize = (rowStride + rowPadding) * canvas.height;
  const fileSize = 54 + pixelArraySize;
  const buffer = Buffer.alloc(fileSize);
  buffer.write("BM", 0, 2, "ascii");
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(canvas.width, 18);
  buffer.writeInt32LE(canvas.height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(0, 30);
  buffer.writeUInt32LE(pixelArraySize, 34);
  buffer.writeInt32LE(2835, 38);
  buffer.writeInt32LE(2835, 42);

  let offset = 54;
  for (let y = canvas.height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const idx = (y * canvas.width + x) * 3;
      buffer[offset++] = canvas.pixels[idx + 2];
      buffer[offset++] = canvas.pixels[idx + 1];
      buffer[offset++] = canvas.pixels[idx];
    }
    offset += rowPadding;
  }
  return buffer;
}

async function ensureDir(dirPath, dryRun) {
  if (!dryRun) await fs.mkdir(dirPath, { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await fs.readFile(args.manifest, "utf8"));
  const baseRoot = args.outputRoot || manifest.settings.generatedAssetRoot || "demo-assets/generated";
  const selectedProjects = args.project ? manifest.projects.filter((project) => project.slug === args.project) : manifest.projects;
  if (selectedProjects.length === 0) throw new Error(`Không tìm thấy project phù hợp với --project=${args.project}`);

  const summary = [];
  for (const project of selectedProjects) {
    for (const batch of project.batches) {
      const batchDir = path.resolve(baseRoot, project.slug, batch.name);
      await ensureDir(batchDir, args.dryRun);
      summary.push({ project: project.slug, batch: batch.name, count: batch.count, dir: batchDir });
      if (args.dryRun) continue;
      for (let i = 0; i < batch.count; i += 1) {
        const fileName = `img-${String(i + 1).padStart(3, "0")}.bmp`;
        const filePath = path.join(batchDir, fileName);
        try {
          await fs.access(filePath);
        } catch {
          const scene = drawScene(project, i + 1);
          await fs.writeFile(filePath, encodeBmp(scene));
        }
      }
    }
  }

  console.log(JSON.stringify({
    mode: args.dryRun ? "dry-run" : "write",
    outputRoot: path.resolve(baseRoot),
    projects: summary
  }, null, 2));
}

main().catch((error) => {
  console.error("[demo:assets] failed:", error.message);
  process.exitCode = 1;
});
