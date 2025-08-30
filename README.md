# EssayBoffin — Static site prototype

Quick start:

1. Clone this repository or import it to Vercel for a static deployment.
2. (Optional) Run the helper script to download Gumroad thumbnails and produce a transparent logo:

   - Node >= 16
   - npm install node-fetch@2 jimp
   - node fetch-images.js

3. Commit any generated images in the assets/ folder (premium-course.jpg, free-course.jpg, logo.png) and push.

Notes:

- The logo background removal uses a simple threshold-based technique and is best-effort. For perfect results use a dedicated background-removal service or provide a transparent PNG.
- The assistance form opens mailto: or wa.me links — no server-side secrets required.

---