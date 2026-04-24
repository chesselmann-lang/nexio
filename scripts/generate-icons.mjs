/**
 * Nexio PWA Icon Generator
 * Run once: node scripts/generate-icons.mjs
 * Requires: npm install -D sharp
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SVG = readFileSync(resolve(ROOT, "public/icons/icon.svg"));

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of SIZES) {
  await sharp(SVG)
    .resize(size, size)
    .png()
    .toFile(resolve(ROOT, `public/icons/icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Also generate favicon
await sharp(SVG).resize(32, 32).png().toFile(resolve(ROOT, "public/favicon.png"));
console.log("✓ favicon.png");
console.log("\nAlle Icons generiert! ✅");
