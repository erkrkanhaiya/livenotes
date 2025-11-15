import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../src/assets/react.svg');
const iconsDir = path.join(__dirname, '../public/icons');

const sizes = [16, 32, 48, 128];

async function createIcons() {
  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of sizes) {
    await sharp(svgPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(iconsDir, `icon${size}.png`));
    console.log(`✅ Created icon${size}.png`);
  }
  
  console.log('🎉 All icons generated successfully!');
}

createIcons().catch(console.error);

