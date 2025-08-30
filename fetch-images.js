/**
 * fetch-images.js
 *
 * Usage:
 *   npm install node-fetch@2 jimp
 *   node fetch-images.js
 *
 * What it does:
 * - Fetches the Gumroad product pages you provided and tries to extract the OG image (og:image).
 * - Downloads the product thumbnails into ./assets/free-course.jpg and ./assets/premium-course.jpg
 * - Downloads the Twitter profile image and attempts a best-effort background removal by turning near-white pixels transparent, saving as ./assets/logo.png
 *
 * NOTE:
 * - This is a best-effort local approach for background removal (simple threshold-based). For perfect results use a specialized API (remove.bg) or manual editing.
 */
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Jimp = require('jimp');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

async function download(url, filepath) {
  console.log('Downloading', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = await res.buffer();
  fs.writeFileSync(filepath, buffer);
  console.log('Saved to', filepath);
}

async function fetchOgImageFromPage(pageUrl) {
  console.log('Fetching page:', pageUrl);
  const res = await fetch(pageUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${pageUrl}`);
  const text = await res.text();
  // crude OG image extraction
  const m = text.match(/<meta property="og:image" content="([^"]+)"/i) || text.match(/<meta name="twitter:image" content="([^"]+)"/i);
  if (m && m[1]) return m[1];
  // fallback: look for img srcs referencing gumroadusercontent
  const m2 = text.match(/https?:\/\/[^\"]*gumroadusercontent[^\"']*\.(?:png|jpg|jpeg)/i);
  if (m2) return m2[0];
  throw new Error('OG image not found on page: ' + pageUrl);
}

async function makeLogoTransparent(inputPath, outputPath) {
  const image = await Jimp.read(inputPath);
  // Convert near-white background to transparent — naive approach
  image.rgba(true);
  const threshold = 240; // pixel component value above which we'll consider it background
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const aIdx = idx + 3;
    // if pixel is near white/light, make it transparent
    if (r >= threshold && g >= threshold && b >= threshold) {
      image.bitmap.data[aIdx] = 0;
    }
  });
  await image.writeAsync(outputPath);
  console.log('Saved transparent logo to', outputPath);
}

(async () => {
  try {
    // Gumroad product pages you provided
    const premiumPage = 'https://essayboffin.gumroad.com/l/phouc';
    const freePage = 'https://essayboffin.gumroad.com/l/fnzbmq';
    const twitterLogo = 'https://pbs.twimg.com/profile_images/1957012042600034304/bes8Ve0-_400x400.jpg';

    // Premium
    try {
      const premiumImage = await fetchOgImageFromPage(premiumPage);
      const premPath = path.join(assetsDir, 'premium-course.jpg');
      await download(premiumImage, premPath);
    } catch (err) {
      console.warn('Premium image fetch failed:', err.message);
    }

    // Free
    try {
      const freeImage = await fetchOgImageFromPage(freePage);
      const freePath = path.join(assetsDir, 'free-course.jpg');
      await download(freeImage, freePath);
    } catch (err) {
      console.warn('Free image fetch failed:', err.message);
    }

    // Logo: download original and attempt background removal
    const originalLogoPath = path.join(assetsDir, 'logo-original.jpg');
    await download(twitterLogo, originalLogoPath);
    const logoPngPath = path.join(assetsDir, 'logo.png');
    await makeLogoTransparent(originalLogoPath, logoPngPath);

    console.log('Done. Check the assets/ folder for images.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();