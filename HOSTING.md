# Hosting on Wispbyte (Pterodactyl / Node.js)

This guide walks you through deploying this Discord Bot + Web Dashboard on **Wispbyte** (or any Pterodactyl-based host).

---

## 1. Export Your Code from AI Studio
1. In Google AI Studio, click the **Settings / Menu** icon (top-right).
2. Select **Export to GitHub** or **Download as ZIP**.
3. If downloading as ZIP, extract it on your computer.

---

## 2. Prepare Your Wispbyte Server
1. Go to your **Wispbyte Game/Bot Panel**.
2. Create or select your **Node.js Bot Server** (Node.js 18 or 20+ recommended).
3. If Wispbyte offers server location options, choose a **US location** (e.g. US East or US Central) to get **low Discord Gateway ping (20–60ms)**!

---

## 3. Upload Files
1. Open the **Files** tab in your Wispbyte panel (or connect via SFTP).
2. Upload all the files from this project:
   - `src/`
   - `server/`
   - `public/`
   - `server.ts`
   - `package.json`
   - `tsconfig.json`
   - `vite.config.ts`
   - `index.html`
   - `index.js`
   - `config.json` (contains your bot settings)
   *(Note: Do not upload `node_modules` – they will install automatically).*

---

## 4. Set Environment Variables
In your Wispbyte panel (under **Startup** or create a `.env` file in the root):
```env
DISCORD_TOKEN=your_bot_token_here
PORT=3000
```
*(Optional: If your Wispbyte server assigns you a specific port like `25565` or `8080`, set `PORT` to that port number).*

---

## 5. Startup Configuration
In Wispbyte's **Startup** tab:
- **Build Command / Pre-Run**: `npm install && npm run build`
- **Startup Command**: `npm start` (or `node index.js`)
- **Main File**: `index.js`

---

## 6. Start the Server
1. In the **Console** tab, click **Start**.
2. The server will run `npm start`, connect to Discord with your token, and launch the web dashboard!
