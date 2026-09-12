# Hosting on Wispbyte (Node.js / Pterodactyl)

This bot is **100% standalone** and connects directly to the **Discord Gateway via discord.js**.
- **NO Gemini API or Google AI keys required**: Everything runs on local rules, Discord buttons, and scheduled timers.
- **Discord Bot Token ONLY**: You only need your Discord Bot Token to run on Wispbyte.

---

## 1. Get Your Discord Bot Token & Required Intents
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your Bot application (or create one).
3. Go to the **Bot** tab:
   - Click **Reset Token** (or Copy Token).
   - Under **Privileged Gateway Intents**, turn **ON**:
     - ✅ **Server Members Intent** (Required for reading members & assigning Alliance roles)
     - ✅ **Message Content Intent**
4. Save changes.

---

## 2. Export Your Code from AI Studio
1. In Google AI Studio, click the **Settings / Menu** icon (top-right).
2. Select **Export to GitHub** or **Download as ZIP**.
3. If downloading as a ZIP, extract it on your local machine.

---

## 3. Prepare Your Wispbyte Server
1. Go to your **Wispbyte Game/Bot Panel**.
2. Select your **Node.js Bot Server** (Node.js 18 or 20+).
3. If Wispbyte offers location selection, choose **US or Singapore** for low ping to Discord's gateway.

---

## 4. Upload Files
1. Open the **Files** tab in your Wispbyte panel (or connect via SFTP).
2. Upload all project files:
   - `src/`
   - `server/`
   - `public/`
   - `server.ts`
   - `package.json`
   - `tsconfig.json`
   - `vite.config.ts`
   - `index.html`
   - `index.js`
   - `config.json`
   *(Do NOT upload `node_modules` — they will install automatically).*

---

## 5. Set Your Discord Bot Token
Choose whichever method is easiest on Wispbyte:

### Method A: Create a `.env` file (Recommended)
In the file manager, create a file named `.env` in the root folder with:
```env
DISCORD_TOKEN=your_bot_token_here
```

### Method B: Wispbyte Environment Variables
In your Wispbyte server's **Startup** or **Environment** tab, set:
- Variable: `DISCORD_TOKEN` (or `TOKEN`)
- Value: `your_bot_token_here`

### Method C: Put it in `config.json`
You can also directly add it into `config.json`:
```json
{
    "TOKEN": "your_bot_token_here",
    "SERVER_ID": "1543436950466330676",
    ...
}
```

---

## 6. Startup Configuration on Wispbyte
In the **Startup** tab:
- **Build / Pre-Run**: `npm install && npm run build`
- **Startup Command**: `npm start` (or `node index.js`)
- **Main File**: `index.js`

---

## 7. Start the Server
1. Go to the **Console** tab and click **Start**.
2. You will see:
   ```
   [HOST] Starting BDO Node War & Siege War Discord Bot
   [HOST] Mode: Standalone Discord Bot (No Gemini API needed; pure Discord Gateway)
   [BOT] Logging into Discord Gateway with provided token...
   [BOT] Discord client connected successfully as [YourBot#Tag]
   ```
3. Your bot is now 24/7 online in your Discord server! All slash commands (`/open-node-war`, `/close-rsvp`, `/open-siege`), button interactions, and automated daily timers will run continuously.

