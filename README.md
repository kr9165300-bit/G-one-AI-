# G ONE AI Gaming — Gemini 3.5 Flash-Lite

Professional gaming-style G ONE AI frontend + Node/Express Gemini API backend.

## Render deployment
1. Upload the complete project to GitHub (keep `package.json`, `server.js`, `render.yaml`, and `public/` in the repository root).
2. Create a Render Web Service from the GitHub repository.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add Environment Variable:
   - `GEMINI_API_KEY` = your Google AI Studio API key
   - `GEMINI_MODEL` = `gemini-3.5-flash-lite`
   - `G_ONE_AI_API_KEY` = optional private key
6. Deploy and open `/health` to verify the server.

Never put a real API key in `index.html`, frontend JavaScript, or GitHub.
