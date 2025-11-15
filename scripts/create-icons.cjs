const fs = require('fs');
const path = require('path');

// Read the SVG file
const svgPath = path.join(__dirname, '../src/assets/react.svg');
const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy SVG to icons directory
const iconSvgPath = path.join(iconsDir, 'icon.svg');
fs.copyFileSync(svgPath, iconSvgPath);

console.log('✅ Copied SVG to icons directory');
console.log('📝 To generate PNG icons:');
console.log('   1. Install sharp: npm install --save-dev sharp');
console.log('   2. Run: node scripts/generate-icons.mjs');
console.log('   Or use an online SVG to PNG converter (sizes: 16, 32, 48, 128)');
console.log('   Place the PNG files in public/icons/ as icon16.png, icon32.png, icon48.png, icon128.png');

