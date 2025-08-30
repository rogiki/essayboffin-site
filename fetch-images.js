// Node script to fetch Gumroad OG images and produce a transparent logo.
// Requires: node-fetch@2, jimp
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Jimp = require('jimp');

const outDir = path.join(__dirname, 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Replace these with your actual Gumroad product page URLs
const gumroadPages = [
  { name: 'premium-course', url: 'https://gumroad.com/l/REPLACE_PREMIUM' },
  { name: 'free-course', url: 'https://gumroad.com/l/REPLACE_FREE' }
];

async function fetchOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, { redirect: 'follow' });
    const text = await res.text();
    const m = text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
             || text.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    return m ? m[1] : null;
  } catch (e) {
    console.error('fetchOgImage error', e);
    return null;
  }
}

async function downloadToFile(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const buffer = await res.buffer();
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

async function makeLogoTransparent(srcPath, dstPath) {
  const img = await Jimp.read(srcPath);
  img.rgba(true);

  // Heuristic: treat near-white (and near-uniform background) as transparent.
  // Fine-tune threshold as needed.
  const threshold = 240; // 0-255: higher => stricter (closer to pure white)
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    // If pixel is near-white, make transparent
    if (r >= threshold && g >= threshold && b >= threshold) {
      this.bitmap.data[idx + 3] = 0;
    }
  });

  // Optional: trim empty borders — simple crop to content bbox
  const { width, height } = img.bitmap;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  img.scan(0, 0, width, height, function (x, y, idx) {
    if (this.bitmap.data[idx + 3] !== 0) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  });
  if (maxX >= minX && maxY >= minY) {
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const cropped = img.clone().crop(minX, minY, w, h);
    await cropped.writeAsync(dstPath);
  } else {
    // If entire image transparent, just write original
    await img.writeAsync(dstPath);
  }
}

(async () => {
  try {
    for (const p of gumroadPages) {
      const og = await fetchOgImage(p.url);
      if (!og) {
        console.warn(`No og:image found for ${p.url}`);
        continue;
      }
      const ext = path.extname(og).split('?')[0] || '.jpg';
      const outPath = path.join(outDir, `${p.name}${ext}`);
      console.log('Downloading', og, '->', outPath);
      await downloadToFile(og, outPath);
    }

    // If you have a logo image on a Gumroad page (or stored elsewhere), set the source:
    // Option A: use first gumroad asset as logo-original.jpg (if applicable)
    // Option B: replace logoSourceUrl with a direct URL to your logo
    const logoSourceUrl = null; // e.g. 'https://example.com/path/to/logo.jpg'
    const logoOriginalPath = path.join(outDir, 'logo-original.jpg');

    if (logoSourceUrl) {
      await downloadToFile(logoSourceUrl, logoOriginalPath);
    } else {
      // Try to reuse one of the downloaded images as a logo if present
      const candidate = path.join(outDir, 'premium-course.jpg');
      if (fs.existsSync(candidate)) {
        fs.copyFileSync(candidate, logoOriginalPath);
      } else {
        console.warn('No logo source available; skipping logo processing.');
      }
    }

    const logoOutPath = path.join(outDir, 'logo.png');
    if (fs.existsSync(logoOriginalPath)) {
      console.log('Processing logo to produce transparent PNG ->', logoOutPath);
      await makeLogoTransparent(logoOriginalPath, logoOutPath);
    } else {
      console.warn('logo-original.jpg not found; no logo.png produced.');
    }

    console.log('Done. Generated assets are in', outDir);
  } catch (err) {
    console.error('Error in fetch-images.js:', err);
    process.exitCode = 1;
  }
})();
