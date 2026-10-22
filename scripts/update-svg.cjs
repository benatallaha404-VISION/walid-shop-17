const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '..', 'public', 'logo.png');
const b64 = fs.readFileSync(imgPath).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 917 708" width="100%" height="100%">
  <image href="data:image/png;base64,${b64}" width="917" height="708" />
</svg>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'hat-logo.svg'), svg, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), svg, 'utf8');
console.log('Successfully updated hat-logo.svg and favicon.svg');
