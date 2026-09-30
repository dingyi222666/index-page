#!/usr/bin/env node
/**
 * Compress game screenshots with Squoosh (Google Chrome Labs, @squoosh/cli +
 * @squoosh/lib) and write them into public/games as web-friendly JPEGs.
 *
 *   node scripts/optimize-games.mjs [manifest.json]
 *
 * The manifest is a JSON file shaped like:
 *   {
 *     "outDir": "public/games",
 *     "quality": 78,
 *     "maxWidth": 1920,
 *     "jobs": [{
 *       "input": "dist/games/foo.png",
 *       "output": "game-1.jpg",
 *       "crop": { "left": 1120, "top": 1024, "width": 1920, "height": 1080 }
 *     }]
 *   }
 *
 * `crop` is optional and is applied to the source before resizing.
 * Every job is re-encoded with mozjpeg and downscaled to `maxWidth` wide
 * (never upscaled); portrait shots keep their aspect ratio.
 *
 * Squoosh predates Node 18/21 and needs scripts/squoosh-polyfill.cjs loaded in
 * the main thread *and* in its encoder worker threads, hence the re-exec below.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const polyfill = path.join(__dirname, 'squoosh-polyfill.cjs');

// Re-exec once with the polyfill preloaded so worker threads inherit it too.
if (!process.env.SQUOOSH_POLYFILLED) {
  const result = spawnSync(
    process.execPath,
    ['--require', polyfill, fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: { ...process.env, SQUOOSH_POLYFILLED: '1' },
    },
  );
  process.exit(result.status ?? 1);
}

const { ImagePool } = await import('@squoosh/lib');
const { promises: fsp } = await import('node:fs');
const zlib = await import('node:zlib');

/* ------------------------------------------------------------------ *
 * Cropping
 *
 * libSquoosh only ships resize/quant/rotate preprocessors — there is no
 * crop step — so a job can ask for a crop rectangle (in source pixels) and
 * we slice the decoded RGBA bitmap ourselves, re-encode it as a throwaway
 * in-memory PNG, and hand that back to squoosh for the real JPEG encode.
 * ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng({ data, width, height }) {
  const rgba = Buffer.from(data.buffer, data.byteOffset, data.length);
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (none)
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: truecolour + alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function cropBitmap(bitmap, { left = 0, top = 0, width, height }) {
  if (left < 0 || top < 0 || left + width > bitmap.width || top + height > bitmap.height) {
    throw new Error(
      `crop ${width}x${height}+${left}+${top} is outside ${bitmap.width}x${bitmap.height}`,
    );
  }
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = ((top + y) * bitmap.width + left) * 4;
    out.set(bitmap.data.subarray(from, from + width * 4), y * width * 4);
  }
  return { data: out, width, height };
}

const manifestPath = process.argv[2] ?? path.join(__dirname, 'games-manifest.json');
const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));

const quality = manifest.quality ?? 78;
const maxWidth = manifest.maxWidth ?? 1920;
const outDir = path.resolve(root, manifest.outDir ?? 'public/games');

await fsp.mkdir(outDir, { recursive: true });

const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
const pool = new ImagePool();
const rows = [];

for (const job of manifest.jobs) {
  const input = path.resolve(root, job.input);
  const output = path.join(outDir, job.output);
  const buffer = await fsp.readFile(input);

  let image = pool.ingestImage(buffer);
  // squoosh exposes pixel dimensions on the decoded bitmap, not the wrapper.
  let bitmap = (await image.decoded).bitmap;
  const source = `${bitmap.width}x${bitmap.height} ${kb(buffer.length)}`;

  if (job.crop) {
    image = pool.ingestImage(encodePng(cropBitmap(bitmap, job.crop)));
    bitmap = (await image.decoded).bitmap;
  }

  const resize = bitmap.width > maxWidth ? { width: maxWidth } : undefined;
  await image.preprocess(resize ? { resize } : {});
  const after = (await image.decoded).bitmap;
  await image.encode({ mozjpeg: { quality } });

  const encoded = await image.encodedWith.mozjpeg;
  await fsp.writeFile(output, encoded.binary);

  rows.push({
    output: path.relative(root, output),
    from: source,
    to: `${after.width}x${after.height} ${kb(encoded.binary.length)}`,
  });
}

await pool.close();

const pad = Math.max(...rows.map((r) => r.output.length));
console.log('Squoosh (mozjpeg) results:\n');
for (const r of rows) {
  console.log(`  ${r.output.padEnd(pad)}  ${r.from.padEnd(24)} -> ${r.to}`);
}
