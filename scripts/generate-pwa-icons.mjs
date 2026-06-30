import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

function iconSvg(size) {
  const fontSize = Math.round(size * 0.36);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#03060E"/>
  <text x="50%" y="52%" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="${fontSize}" fill="#C9A84C" text-anchor="middle" dominant-baseline="middle">SH</text>
</svg>`);
}

for (const size of [192, 512]) {
  const out = join(publicDir, `icon-${size}.png`);
  await sharp(iconSvg(size)).png().toFile(out);
  console.log(`Created ${out}`);
}
