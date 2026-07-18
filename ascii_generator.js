const fs = require('fs');
const Jimp = require('jimp');

const chars = " .:-=+*#%@";

async function generate() {
  const img = await Jimp.read('hammad-front.png');
  
  const imgAspect = img.bitmap.width / img.bitmap.height;
  // Consolas character aspect ratio is ~0.55 (width/height)
  let targetWidth = Math.round((imgAspect * 25) / 0.55);
  targetWidth = Math.min(targetWidth, 38);
  targetWidth = Math.max(targetWidth, 10);
  
  img.resize(targetWidth, 25);
  
  let darkLines = [];
  let lightLines = [];
  
  for (let y = 0; y < 25; y++) {
    let darkLine = "";
    let lightLine = "";
    for (let x = 0; x < targetWidth; x++) {
      const color = Jimp.intToRGBA(img.getPixelColor(x, y));
      // Grayscale calculation
      const gray = Math.round(0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
      
      // Map to char (0 to chars.length-1)
      const darkIdx = Math.floor((gray * (chars.length - 1)) / 255);
      const lightIdx = (chars.length - 1) - darkIdx;
      
      darkLine += chars[darkIdx];
      lightLine += chars[lightIdx];
    }
    darkLines.push(darkLine.padEnd(38, ' '));
    lightLines.push(lightLine.padEnd(38, ' '));
  }
  
  updateSvg('dark_mode.svg', darkLines, '#c9d1d9');
  updateSvg('light_mode.svg', lightLines, '#24292f');
}

function updateSvg(svgPath, lines, fillColor) {
  if (!fs.existsSync(svgPath)) {
    console.error("File not found: " + svgPath);
    return;
  }
  let content = fs.readFileSync(svgPath, 'utf8');
  let startTag = `<text x="15" y="30" fill="${fillColor}" class="ascii">`;
  let endTag = '</text>';
  
  let startIdx = content.indexOf(startTag);
  if (startIdx === -1) {
    startTag = '<text x="15" y="30"';
    startIdx = content.indexOf(startTag);
    if (startIdx !== -1) {
      let endBracket = content.indexOf('>', startIdx);
      startTag = content.substring(startIdx, endBracket + 1);
    }
  }
  
  if (startIdx === -1) {
    console.error("Could not find start tag in " + svgPath);
    return;
  }
  
  let endIdx = content.indexOf(endTag, startIdx);
  if (endIdx === -1) {
    console.error("Could not find end tag in " + svgPath);
    return;
  }
  
  let tspans = [];
  let yStart = 30;
  let yStep = 20;
  for (let i = 0; i < lines.length; i++) {
    let yVal = yStart + i * yStep;
    let safeLine = lines[i].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    tspans.push(`<tspan x="15" y="${yVal}">${safeLine}</tspan>`);
  }
  
  let newBlock = startTag + "\n" + tspans.join("\n") + "\n";
  let newContent = content.substring(0, startIdx) + newBlock + content.substring(endIdx);
  
  fs.writeFileSync(svgPath, newContent, 'utf8');
  console.log("Updated SVG " + svgPath);
}

generate().catch(console.error);
