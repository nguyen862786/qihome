const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/images');
const files = fs.readdirSync(dir);

function getJpegSize(filePath) {
  const data = fs.readFileSync(filePath);
  let i = 0;
  if (data[i] !== 0xFF || data[i+1] !== 0xD8) {
    throw new Error('Not a JPEG');
  }
  i += 2;
  while (i < data.length) {
    if (data[i] !== 0xFF) {
      i++;
      continue;
    }
    const marker = data[i+1];
    if (marker === 0xC0 || marker === 0xC2) {
      // Start of Frame
      const height = (data[i+5] << 8) + data[i+6];
      const width = (data[i+7] << 8) + data[i+8];
      return { width, height };
    }
    // Skip segment
    const segmentLength = (data[i+2] << 8) + data[i+3];
    i += 2 + segmentLength;
  }
  throw new Error('SOF marker not found');
}

console.log('--- JPEG INSPECTION ---');
files.forEach(f => {
  if (f.endsWith('.jpg')) {
    try {
      const size = getJpegSize(path.join(dir, f));
      console.log(`${f}: ${size.width}x${size.height} (Aspect Ratio: ${(size.width/size.height).toFixed(2)})`);
    } catch (e) {
      console.log(`${f}: Error: ${e.message}`);
    }
  }
});
