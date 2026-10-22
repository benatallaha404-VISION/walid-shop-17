const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const origPath = 'C:\\Users\\Bzbook\\.gemini\\antigravity-ide\\brain\\dc9ba1e2-737a-4dca-b542-9be6abf21354\\.user_uploaded\\media_1792615980595.png';
const buf = fs.readFileSync(origPath);

let pos = 8;
const idatChunks = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));

const w = 1024, h = 1024, bpp = 4;
const unfilter = Buffer.alloc(w * h * bpp);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

let srcPos = 0;
for (let y = 0; y < h; y++) {
  const filter = decompressed[srcPos++];
  const rowStart = y * w * bpp;
  const prevRowStart = (y - 1) * w * bpp;

  for (let x = 0; x < w * bpp; x++) {
    const raw = decompressed[srcPos++];
    const a = (x >= bpp) ? unfilter[rowStart + x - bpp] : 0;
    const b = (y > 0) ? unfilter[prevRowStart + x] : 0;
    const c = (x >= bpp && y > 0) ? unfilter[prevRowStart + x - bpp] : 0;

    let val = 0;
    if (filter === 0) val = raw;
    else if (filter === 1) val = (raw + a) & 0xff;
    else if (filter === 2) val = (raw + b) & 0xff;
    else if (filter === 3) val = (raw + Math.floor((a + b) / 2)) & 0xff;
    else if (filter === 4) val = (raw + paeth(a, b, c)) & 0xff;
    unfilter[rowStart + x] = val;
  }
}

// Find true bounding box of the black hat (alpha > 30)
let minX = w, maxX = 0, minY = h, maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * bpp;
    const alpha = unfilter[idx + 3];
    if (alpha > 30) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Bounding box:', { minX, maxX, minY, maxY });

// Add padding of 15px
const pad = 15;
minX = Math.max(0, minX - pad);
maxX = Math.min(w - 1, maxX + pad);
minY = Math.max(0, minY - pad);
maxY = Math.min(h - 1, maxY + pad);

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;
console.log('Cropped dimensions:', cropW, 'x', cropH);

// Build new raw rows with Filter 0 (None)
const newRawRows = [];
for (let y = minY; y <= maxY; y++) {
  const row = Buffer.alloc(1 + cropW * bpp);
  row[0] = 0; // Filter: 0 (None)
  for (let x = 0; x < cropW; x++) {
    const srcIdx = (y * w + (minX + x)) * bpp;
    const dstIdx = 1 + x * bpp;
    // Ensure the hat is solid jet black (#000000) with preserved alpha!
    const alpha = unfilter[srcIdx + 3];
    row[dstIdx] = 0;     // R = 0 (solid black)
    row[dstIdx + 1] = 0; // G = 0 (solid black)
    row[dstIdx + 2] = 0; // B = 0 (solid black)
    row[dstIdx + 3] = alpha; // Alpha
  }
  newRawRows.push(row);
}

const compressed = zlib.deflateSync(Buffer.concat(newRawRows), { level: 9 });

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(cropW, 0);
ihdr.writeUInt32BE(cropH, 4);
ihdr[8] = 8; // 8 bits
ihdr[9] = 6; // RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const finalPng = Buffer.concat([
  pngHeader,
  makeChunk('IHDR', ihdr),
  makeChunk('IDAT', compressed),
  makeChunk('IEND', Buffer.alloc(0))
]);

const outDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(outDir, 'logo.png'), finalPng);
fs.writeFileSync(path.join(outDir, 'hat-logo.png'), finalPng);

// Also generate high quality SVG embedding this clean black hat
const b64 = finalPng.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cropW} ${cropH}" width="100%" height="100%">
  <image href="data:image/png;base64,${b64}" width="${cropW}" height="${cropH}" />
</svg>`;
fs.writeFileSync(path.join(outDir, 'hat-logo.svg'), svg, 'utf8');
fs.writeFileSync(path.join(outDir, 'favicon.svg'), svg, 'utf8');

console.log('Successfully saved jet-black cropped hat logo PNG and SVG!');
