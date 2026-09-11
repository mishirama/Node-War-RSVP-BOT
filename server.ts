import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  CONFIG,
  CONFIG_FILE,
  DATA_FILE,
  SIEGE_DATA_FILE,
  saveConfig,
  log,
  recentLogs,
} from './server/config.js';
import { getCapacityWarnings, getLimits, getSiegeLimits } from './server/utils.js';
import {
  client,
  postRSVP,
  closeRSVP,
  postSiege,
  closeSiege,
  sendVoteReminder,
  getBenchHistory,
  getPriorityBenchUsers,
  restoreState,
  syncFromDiscord,
} from './server/bot.js';
import {
  OFFICIAL_TOTAL_PAX,
  ROLE_EMOJIS,
  DEFAULT_ROLE_LIMITS,
  DEFAULT_SIEGE_ROLE_LIMITS,
} from './server/constants.js';

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), 'public')));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Bot & Server Status
  app.get('/api/status', (req, res) => {
    const isBotReady = Boolean(client && client.isReady && client.isReady());
    const guild = isBotReady && client.guilds?.cache ? client.guilds.cache.get(String(CONFIG.SERVER_ID)) : null;

    let guildsList: Array<{ id: string; name: string; memberCount?: number }> = [];
    let textChannels: Array<{ id: string; name: string }> = [];
    let roles: Array<{ id: string; name: string; color?: string }> = [];

    if (isBotReady && client.guilds?.cache) {
      guildsList = [...client.guilds.cache.values()].map((g: any) => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
      }));
      if (guild) {
        textChannels = [...guild.channels.cache.filter((c: any) => c.isTextBased()).values()].map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        roles = [...guild.roles.cache.values()]
          .sort((a: any, b: any) => b.position - a.position)
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            color: r.hexColor,
          }));
      }
    }

    const nodeSession = client.currentSession;
    const siegeSession = client.siegeSession;

    res.json({
      bot: {
        isReady: isBotReady,
        tag: isBotReady ? client.user?.tag : null,
        ping: isBotReady && typeof client.ws?.ping === 'number' && client.ws.ping >= 0 ? client.ws.ping : null,
        hasToken: Boolean(process.env.DISCORD_TOKEN),
        region: 'asia-southeast1 (Singapore)',
      },
      currentGuild: guild ? { id: guild.id, name: guild.name } : null,
      guilds: guildsList,
      channels: textChannels,
      roles,
      nodeSession: {
        active: Boolean(nodeSession),
        isClosed: nodeSession ? nodeSession.isClosed : true,
        targetDate: nodeSession ? nodeSession.targetDate : null,
      },
      siegeSession: {
        active: Boolean(siegeSession),
        isClosed: siegeSession ? siegeSession.isClosed : true,
        targetDate: siegeSession ? siegeSession.targetDate : null,
      },
    });
  });

  // Configuration
  app.get('/api/config', (req, res) => {
    const warnings = getCapacityWarnings();
    res.json({
      config: CONFIG,
      warnings,
      officialPax: OFFICIAL_TOTAL_PAX,
      defaultLimits: DEFAULT_ROLE_LIMITS,
      defaultSiegeLimits: DEFAULT_SIEGE_ROLE_LIMITS,
      roleEmojis: ROLE_EMOJIS,
    });
  });

  app.post('/api/config', async (req, res) => {
    try {
      const updates = req.body;
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'string' || typeof value === 'number') {
          CONFIG[key] = String(value).trim();
        }
      }
      saveConfig();

      // Refresh limits and sync embeds on active sessions
      if (client.siegeSession) {
        client.siegeSession.limits = getSiegeLimits();
        client.siegeSession.batchUpdateDiscord().catch(() => {});
      }
      if (client.currentSession) {
        client.currentSession.limits = getLimits(client.currentSession.targetDate);
        client.currentSession.batchUpdateDiscord().catch(() => {});
      }

      const warnings = getCapacityWarnings();
      log('CONFIG', 'Configuration updated from dashboard.');
      res.json({ success: true, config: CONFIG, warnings });
    } catch (err: any) {
      log('ERROR', `Config update failed: ${err}`);
      res.status(500).json({ success: false, error: err?.message || 'Update failed' });
    }
  });

  // Active Sessions Data
  app.get('/api/sessions', (req, res) => {
    let nodeData = null;
    let siegeData = null;

    if (fs.existsSync(DATA_FILE)) {
      try {
        nodeData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      } catch (e) {
        log('ERROR', `Failed reading ${DATA_FILE}`);
      }
    }
    if (fs.existsSync(SIEGE_DATA_FILE)) {
      try {
        siegeData = JSON.parse(fs.readFileSync(SIEGE_DATA_FILE, 'utf8'));
      } catch (e) {
        log('ERROR', `Failed reading ${SIEGE_DATA_FILE}`);
      }
    }

    const nodeLimits = client.currentSession ? client.currentSession.limits : getLimits(new Date());
    const siegeLimits = client.siegeSession ? client.siegeSession.limits : getSiegeLimits();

    res.json({
      node: {
        session: nodeData,
        limits: nodeLimits,
        isClosed: client.currentSession ? client.currentSession.isClosed : nodeData?.is_closed ?? true,
      },
      siege: {
        session: siegeData,
        limits: siegeLimits,
        isClosed: client.siegeSession ? client.siegeSession.isClosed : siegeData?.is_closed ?? true,
      },
    });
  });

  // Bot Actions: Open/Close/Remind
  app.post('/api/actions/open-node-war', async (req, res) => {
    try {
      const ok = await postRSVP();
      res.json({ success: ok, message: 'Node War RSVP opened' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to open Node War' });
    }
  });

  app.post('/api/actions/close-node-war', async (req, res) => {
    try {
      await closeRSVP();
      res.json({ success: true, message: 'Node War RSVP closed' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to close Node War' });
    }
  });

  app.post('/api/actions/open-siege', async (req, res) => {
    try {
      const ok = await postSiege();
      res.json({ success: ok, message: 'Siege War RSVP opened' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to open Siege War' });
    }
  });

  app.post('/api/actions/close-siege', async (req, res) => {
    try {
      await closeSiege();
      res.json({ success: true, message: 'Siege War RSVP closed' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to close Siege War' });
    }
  });

  app.post('/api/actions/send-reminder', async (req, res) => {
    try {
      const { customMessage } = req.body || {};
      const result = await sendVoteReminder(customMessage);
      if (result && !result.success) {
        return res.status(400).json(result);
      }
      res.json({
        success: true,
        message: result?.message || 'Vote reminder sent to registered Node War participants',
        details: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to send reminders' });
    }
  });

  // Manual Roster Management (Add/Remove member in web UI)
  app.post('/api/roster/assign', async (req, res) => {
    try {
      const { type, role, name, id } = req.body;
      if (!name || !role) {
        return res.status(400).json({ success: false, error: 'Name and role are required' });
      }
      const session = type === 'siege' ? client.siegeSession : client.currentSession;
      if (!session) {
        return res.status(400).json({ success: false, error: 'No active session found' });
      }
      const result = session.assignMember(role, name, id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to assign member' });
    }
  });

  app.post('/api/roster/remove', async (req, res) => {
    try {
      const { type, nameOrId } = req.body;
      if (!nameOrId) {
        return res.status(400).json({ success: false, error: 'Member identifier required' });
      }
      const session = type === 'siege' ? client.siegeSession : client.currentSession;
      if (!session) {
        return res.status(400).json({ success: false, error: 'No active session found' });
      }
      const removed = session.removeMember(nameOrId);
      res.json({ success: removed, message: removed ? 'Member removed' : 'Member not found' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to remove member' });
    }
  });

  // Bench History & Priority
  app.get('/api/bench-history', (req, res) => {
    const history = getBenchHistory();
    const priority = getPriorityBenchUsers();
    res.json({ history, priority });
  });

  // Logs
  app.get('/api/logs', (req, res) => {
    res.json({ logs: recentLogs });
  });

  // Backup Download
  app.get('/api/backup/:type', (req, res) => {
    const type = req.params.type;
    const filePath = type === 'siege' ? SIEGE_DATA_FILE : DATA_FILE;
    if (fs.existsSync(filePath)) {
      res.download(filePath, `${type}-backup-${new Date().toISOString().slice(0, 10)}.json`);
    } else {
      res.status(404).json({ error: 'Backup not found' });
    }
  });

  // Sync with Discord live messages
  app.post('/api/sync-discord', async (req, res) => {
    try {
      const result = await syncFromDiscord();
      res.json(result);
    } catch (err: any) {
      log('ERROR', `Discord sync endpoint error: ${err}`);
      res.status(500).json({ success: false, error: err?.message || 'Sync failed' });
    }
  });

  // Bot Login trigger if token added or changed
  app.post('/api/bot/login', async (req, res) => {
    const token = req.body?.token || process.env.DISCORD_TOKEN;
    if (!token) {
      return res.status(400).json({ success: false, error: 'No Discord token provided' });
    }
    try {
      process.env.DISCORD_TOKEN = token;
      if (!client.isReady || !client.isReady()) {
        await client.login(token);
        log('BOT', 'Discord client connected successfully.');
      }
      res.json({ success: true, tag: client.user?.tag });
    } catch (err: any) {
      log('ERROR', `Discord login error: ${err}`);
      res.status(500).json({ success: false, error: err?.message || 'Failed to login to Discord' });
    }
  });

  // --- VITE DEV / PRODUCTION STATIC FALLBACK ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- START SERVER & DISCORD CLIENT ---
  server.listen(PORT, '0.0.0.0', () => {
    log('WEB', `Command center dashboard running at http://0.0.0.0:${PORT}`);
  });

  // Attempt Discord bot login if token exists
  const token = process.env.DISCORD_TOKEN;
  if (token) {
    try {
      log('BOT', 'Logging into Discord Gateway with provided token...');
      await client.login(token);
    } catch (err) {
      log('ERROR', `Discord login error on startup: ${err}`);
    }
  } else {
    log('BOT', 'No DISCORD_TOKEN found in environment. Bot is in Standby/Dashboard mode.');
  }
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
