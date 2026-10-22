const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'brand-logos');

// Let's check each file's coordinates
function getBounds(svgStr) {
  const nums = [];
  const matches = svgStr.match(/-?\d+\.?\d*/g);
  if (!matches) return null;
  // Let's extract coordinates from paths
  // Or simpler: let's inspect the files specifically
}

// 1. armani.svg has text between x=0 to 192, y=75 to 118
// Let's crop viewBox to fit the logo tightly: viewBox="0 75 192.756 45"
let armani = fs.readFileSync(path.join(dir, 'armani.svg'), 'utf8');
armani = armani.replace(/viewBox="[^"]*"/, 'viewBox="0 76 192.756 40"');
fs.writeFileSync(path.join(dir, 'armani.svg'), armani, 'utf8');

// 2. calvin-klein.svg has text between x=0 to 192, y=80 to 112
// Tighten viewBox="0 80 192.756 32"
let calvin = fs.readFileSync(path.join(dir, 'calvin-klein.svg'), 'utf8');
calvin = calvin.replace(/viewBox="[^"]*"/, 'viewBox="0 80 192.756 32"');
fs.writeFileSync(path.join(dir, 'calvin-klein.svg'), calvin, 'utf8');

// 3. gucci.svg has text between x=0 to 192, y=82 to 114
let gucci = fs.readFileSync(path.join(dir, 'gucci.svg'), 'utf8');
gucci = gucci.replace(/viewBox="[^"]*"/, 'viewBox="10 82 172.756 32"');
fs.writeFileSync(path.join(dir, 'gucci.svg'), gucci, 'utf8');

// 4. lacoste.svg has crocodile from y=10 to 110, text from y=135 to 172
// Total height is y=10 to 175 -> viewBox="0 10 192.756 165"
let lacoste = fs.readFileSync(path.join(dir, 'lacoste.svg'), 'utf8');
lacoste = lacoste.replace(/viewBox="[^"]*"/, 'viewBox="0 10 192.756 165"');
fs.writeFileSync(path.join(dir, 'lacoste.svg'), lacoste, 'utf8');

console.log('Optimized viewBoxes successfully.');
