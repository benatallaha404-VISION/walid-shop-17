const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'brand-logos');

if (!fs.existsSync(dir)) {
  console.log('Dir does not exist');
  process.exit(0);
}

// Ensure Nike SVG has real swoosh
const nikeSvg = `<svg viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg"><path d="M24 7.8L6.442 15.276c-1.456.616-2.679.925-3.668.925-1.12 0-1.933-.392-2.437-1.177-.317-.504-.41-1.143-.28-1.918.13-.775.476-1.6 1.036-2.478.467-.71 1.232-1.643 2.297-2.8a6.122 6.122 0 00-.784 1.848c-.28 1.195-.028 2.072.756 2.632.373.261.886.392 1.54.392.522 0 1.11-.084 1.764-.252L24 7.8z"/></svg>`;
fs.writeFileSync(path.join(dir, 'nike.svg'), nikeSvg, 'utf8');

// Ensure Tommy Hilfiger SVG has authentic colored flag and typography
const tommySvg = `<svg viewBox="0 0 220 50" xmlns="http://www.w3.org/2000/svg">
  <!-- Tommy Hilfiger Iconic Flag -->
  <g transform="translate(6, 12)">
    <rect x="0" y="0" width="38" height="6" fill="#00175a" />
    <rect x="0" y="6" width="19" height="14" fill="#ffffff" stroke="#e5e5e5" stroke-width="0.5" />
    <rect x="19" y="6" width="19" height="14" fill="#cc0c2f" />
    <rect x="0" y="20" width="38" height="6" fill="#00175a" />
    <rect x="0" y="0" width="38" height="26" fill="none" stroke="#00175a" stroke-width="1.2" />
  </g>
  <!-- Brand text -->
  <text x="54" y="29" font-family="'Century Gothic', 'Montserrat', 'Arial', sans-serif" font-weight="700" font-size="13" fill="#00175a" letter-spacing="2.5">TOMMY HILFIGER</text>
</svg>`;
fs.writeFileSync(path.join(dir, 'tommy.svg'), tommySvg, 'utf8');

const files = fs.readdirSync(dir);
files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  const before = content.length;
  // Remove opaque background paths
  content = content.replace(/<path[^>]*d="M0 0h192\.756v192\.756H0V0z"[^>]*\/>/gi, '');
  content = content.replace(/<path[^>]*fill="#fff"[^>]*d="M0 0h192\.756v192\.756H0V0z"[^>]*\/>/gi, '');
  content = content.replace(/<path[^>]*fill="#ffffff"[^>]*d="M0 0h192\.756v192\.756H0V0z"[^>]*\/>/gi, '');
  if (content.length !== before) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Cleaned white bg from:', f);
  }
});
console.log('Finished logo sanitization.');
