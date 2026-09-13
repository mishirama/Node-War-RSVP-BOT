import {
  Client,
  GatewayIntentBits,
  Events,
  AttachmentBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
} from 'discord.js';
import moment from 'moment-timezone';
import fs from 'fs';
import path from 'path';
import {
  CONFIG,
  DATA_FILE,
  SIEGE_DATA_FILE,
  HISTORY_FILE,
  JAKARTA_TZ,
  log,
  getDiscordToken,
} from './config.js';
import {
  CUSTOM_ID_TO_ROLE,
  SIEGE_ROLE_BUTTONS,
  DEFAULT_ROLE_LIMITS,
  DEFAULT_SIEGE_ROLE_LIMITS,
} from './constants.js';
import { getLimits, getSiegeLimits, isAuthorized } from './utils.js';
import { RSVPSession, MemberRecord } from './rsvpSession.js';

export interface BenchHistoryEntry {
  date: string;
  users: MemberRecord[];
}

export const client: any = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  sweepers: {
    messages: {
      interval: 300,
      lifetime: 900,
    },
  },
  rest: {
    timeout: 15000,
  },
});

client.mainMsg = null;
client.waitlistMsg = null;
client.mainMsgId = null;
client.waitlistMsgId = null;
client.currentSession = null;

client.siegeMainMsg = null;
client.siegeWaitlistMsg = null;
client.siegeMainMsgId = null;
client.siegeWaitlistMsgId = null;
client.siegeSession = null;

let lastPostDate: string | null = null;

const REMINDER_HISTORY_FILE = path.join(process.cwd(), 'reminder_history.json');

function loadReminderHistory(): Set<string> {
  try {
    if (fs.existsSync(REMINDER_HISTORY_FILE)) {
      const data = JSON.parse(fs.readFileSync(REMINDER_HISTORY_FILE, 'utf8'));
      if (Array.isArray(data)) {
        return new Set<string>(data);
      }
    }
  } catch {}
  return new Set<string>();
}

function saveReminderHistory(history: Set<string>) {
  try {
    const arr = Array.from(history).slice(-60);
    fs.writeFileSync(REMINDER_HISTORY_FILE, JSON.stringify(arr, null, 2));
  } catch (err) {
    log('WARN', `Could not save reminder history: ${err}`);
  }
}

const voteReminderSent = loadReminderHistory();
let isSendingVoteReminder = false;
let isSendingSiegeReminder = false;

function messageKey(prefix: string, name: string) {
  return prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name;
}

const SLASH_COMMANDS = [
  new SlashCommandBuilder().setName('open-node-war').setDescription('Open a Node War RSVP now'),
  new SlashCommandBuilder().setName('close-rsvp').setDescription('Close the current Node War RSVP'),
  new SlashCommandBuilder().setName('open-siege').setDescription('Open a Siege War RSVP in the configured channel'),
].map((command) => command.toJSON());

export async function registerSlashCommands(token?: string) {
  const activeToken = token || getDiscordToken();
  if (!activeToken || !CONFIG.SERVER_ID || !client.user?.id) return false;
  try {
    const rest = new REST({ version: '10' }).setToken(activeToken);
    await rest.put(Routes.applicationGuildCommands(client.user.id, String(CONFIG.SERVER_ID)), {
      body: SLASH_COMMANDS,
    });
    log('INFO', 'Slash commands registered for this server.');
    return true;
  } catch (err) {
    log('ERROR', `Could not register slash commands: ${err}`);
    return false;
  }
}

export function restoreState(dataFile = DATA_FILE, sessionKey = 'currentSession', messagePrefix = '') {
  if (!fs.existsSync(dataFile)) return null;
  try {
    const state = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const targetDate = moment.tz(state.target_date, JAKARTA_TZ).toDate();
    const session = new RSVPSession(
      client,
      state.session_type === 'siege' ? getSiegeLimits() : getLimits(targetDate),
      targetDate,
      {
        dataFile,
        title: state.session_type === 'siege' ? 'Siege War RSVP' : 'Node War RSVP',
        sessionType: state.session_type || 'node',
        messagePrefix,
        roleButtons: state.session_type === 'siege' ? SIEGE_ROLE_BUTTONS : undefined,
      }
    );

    for (const role of Object.keys(session.limits)) {
      if (state.data?.[role]) session.data[role] = state.data[role];
      if (state.waitlist?.[role]) session.waitlist[role] = state.waitlist[role];
      if (state.member_data?.[role]) session.memberData[role] = state.member_data[role];
      if (state.member_waitlist?.[role]) session.memberWaitlist[role] = state.member_waitlist[role];
    }
    session.sanitizeData();
    session.isClosed = state.is_closed || false;
    client[messageKey(messagePrefix, 'mainMsgId')] = state.main_msg_id || null;
    client[messageKey(messagePrefix, 'waitlistMsgId')] = state.waitlist_msg_id || null;
    client[sessionKey] = session;
    log('INFO', `Saved ${session.sessionType} state restored for ${state.target_date}`);
    return session;
  } catch (e) {
    log('ERROR', `Error restoring state from ${dataFile}: ${e}`);
    return null;
  }
}

export function getBenchHistory(): BenchHistoryEntry[] {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

export function recordBenchHistory(session: RSVPSession) {
  const history = getBenchHistory();
  const dateStr = moment(session.targetDate).format('YYYY-MM-DD');
  if (history.some((entry) => entry.date === dateStr)) return;
  const users = Object.values(session.memberWaitlist)
    .flat()
    .filter((member) => member?.id);
  history.push({ date: dateStr, users });
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(-10), null, 2));
  } catch (err) {
    log('ERROR', `Error recording bench history: ${err}`);
  }
}

export function getPriorityBenchUsers(): MemberRecord[] {
  const recent = getBenchHistory().slice(-3);
  if (recent.length < 3) return [];
  const everyDay = recent.reduce<MemberRecord[]>((ids, entry) => {
    const today = new Map(entry.users.map((member) => [member.id, member]));
    return ids.filter((member) => today.has(member.id)).map((member) => today.get(member.id)!);
  }, recent[0].users || []);
  return [...new Map(everyDay.map((member) => [member.id, member])).values()].slice(0, 5);
}

export async function postRSVP() {
  const now = moment().tz(JAKARTA_TZ);
  const targetDate = (now.hour() >= 21 ? now.clone().add(1, 'day') : now.clone()).toDate();

  const session = new RSVPSession(client, getLimits(targetDate), targetDate);
  const priorityUsers = getPriorityBenchUsers();
  for (const member of priorityUsers) {
    if (session.data['Main Ball'].length >= session.limits['Main Ball']) break;
    session.data['Main Ball'].push(member.name);
    session.memberData['Main Ball'].push(member);
  }
  client.currentSession = session;

  if (client.isReady && client.isReady()) {
    // If an existing post was in channel, remove its buttons to prevent stale clicks
    if (client.mainMsg) {
      await client.mainMsg.edit({ components: [] }).catch(() => {});
    }

    const ch = await client.channels.fetch(String(CONFIG.CHANNEL_ID || '0')).catch(() => null);
    if (ch && ch.isTextBased()) {
      const { mainEmb, waitEmb } = session.buildEmbeds();
      const mainMsg = await ch.send({
        content: `@everyone Node War Open!${
          priorityUsers.length
            ? `\n⭐ Priority Main Ball: ${priorityUsers.map((member) => `<@${member.id}>`).join(', ')}`
            : ''
        }`,
        allowedMentions: { parse: ['everyone', 'users'] },
        embeds: [mainEmb],
        components: session.buildComponents(),
      });
      const waitlistMsg = await ch.send({ embeds: [waitEmb] });
      client.mainMsg = mainMsg;
      client.waitlistMsg = waitlistMsg;
      client.mainMsgId = mainMsg.id;
      client.waitlistMsgId = waitlistMsg.id;
    }
  }

  session.saveState();
  log('RSVP', `Node War RSVP opened for ${moment(targetDate).format('YYYY-MM-DD')}`);
  return true;
}

export async function postSiege() {
  const targetDate = moment().tz(JAKARTA_TZ).toDate();
  const session = new RSVPSession(client, getSiegeLimits(), targetDate, {
    dataFile: SIEGE_DATA_FILE,
    title: 'Siege War RSVP',
    sessionType: 'siege',
    messagePrefix: 'siege',
    roleButtons: SIEGE_ROLE_BUTTONS,
  });
  client.siegeSession = session;

  if (client.isReady && client.isReady()) {
    // If an existing siege post was in channel, remove its buttons to prevent stale clicks
    if (client.siegeMainMsg) {
      await client.siegeMainMsg.edit({ components: [] }).catch(() => {});
    }

    const channel = await client.channels.fetch(String(CONFIG.SIEGE_CHANNEL_ID || '0')).catch(() => null);
    if (channel && channel.isTextBased()) {
      const { mainEmb, waitEmb } = session.buildEmbeds();
      const mainMsg = await channel.send({
        content: '@everyone Siege War Open!',
        allowedMentions: { parse: ['everyone'] },
        embeds: [mainEmb],
        components: session.buildComponents(),
      });
      const waitlistMsg = await channel.send({ embeds: [waitEmb] });
      client.siegeMainMsg = mainMsg;
      client.siegeWaitlistMsg = waitlistMsg;
      client.siegeMainMsgId = mainMsg.id;
      client.siegeWaitlistMsgId = waitlistMsg.id;
    }
  }

  session.saveState();
  log('SIEGE', `Siege War RSVP opened for ${moment(targetDate).format('YYYY-MM-DD')}`);
  return true;
}

export async function closeRSVP(logChannelOverride: any = null) {
  const session: RSVPSession | null = client.currentSession;
  if (!session) return false;
  session.isClosed = true;
  recordBenchHistory(session);

  try {
    if (client.isReady && client.isReady()) {
      if (!client.mainMsg && client.mainMsgId) {
        const ch = await client.channels.fetch(String(CONFIG.CHANNEL_ID || '0')).catch(() => null);
        if (ch && ch.isTextBased()) {
          client.mainMsg = await ch.messages.fetch(client.mainMsgId).catch(() => null);
        }
      }
      const { mainEmb } = session.buildEmbeds();
      if (client.mainMsg) {
        await client.mainMsg.edit({
          content: '🔒 CLOSED',
          embeds: [mainEmb],
          components: session.buildComponents(),
        });
      }

      const logCh =
        logChannelOverride ||
        (await client.channels.fetch(String(CONFIG.LOG_CHANNEL_ID || '0')).catch(() => null));
      if (logCh && logCh.isTextBased()) {
        const fn = `node${moment(session.targetDate).format('YYMMDD')}.json`;
        await logCh.send({
          content: `💾 Backup: \`${fn}\``,
          files: [new AttachmentBuilder(DATA_FILE, { name: fn })],
        });
      }
    }
    session.saveState();
    log('RSVP', 'Node War RSVP closed.');
  } catch (e) {
    log('ERROR', `Close RSVP failed: ${e}`);
  }
  return true;
}

export async function closeSiege() {
  const session: RSVPSession | null = client.siegeSession;
  if (!session) return false;
  session.isClosed = true;

  try {
    if (client.isReady && client.isReady()) {
      if (!client.siegeMainMsg && client.siegeMainMsgId) {
        const ch = await client.channels.fetch(String(CONFIG.SIEGE_CHANNEL_ID || '0')).catch(() => null);
        if (ch && ch.isTextBased()) {
          client.siegeMainMsg = await ch.messages.fetch(client.siegeMainMsgId).catch(() => null);
        }
      }
      const { mainEmb } = session.buildEmbeds();
      if (client.siegeMainMsg) {
        await client.siegeMainMsg.edit({
          content: '🔒 CLOSED',
          embeds: [mainEmb],
          components: session.buildComponents(),
        });
      }
    }
    session.saveState();
    log('SIEGE', 'Siege War RSVP closed.');
  } catch (e) {
    log('ERROR', `Close Siege failed: ${e}`);
  }
  return true;
}

export async function sendVoteReminder(customMessage?: string) {
  if (isSendingVoteReminder) {
    log('WARN', 'Node War reminder already in progress, skipping concurrent call.');
    return { success: false, reason: 'Reminder already being sent' };
  }
  isSendingVoteReminder = true;
  try {
    if (!client.isReady || !client.isReady()) {
      log('WARN', 'Discord client not ready. Reminder skipped.');
      return { success: false, reason: 'Discord bot client is not connected' };
    }

    const session = client.currentSession;
    if (!session) {
      log('REMINDER', 'No Node War session loaded. Reminder skipped.');
      return { success: false, reason: 'No Node War session is currently active' };
    }

    if (session.isClosed) {
      log('REMINDER', 'Node War session is already closed. Reminder skipped.');
      return { success: false, reason: 'Node War session is closed for today' };
    }

    const channelId = CONFIG.CHANNEL_ID;
    const channel = await client.channels.fetch(String(channelId || '0')).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      log('ERROR', `Cannot send reminder: channel ${channelId} not found or not text-based.`);
      return { success: false, reason: `Node War channel ${channelId} not found` };
    }

    // Allowed roles for reminder ping: shotcaller, builder, elephant, flag, ft, hwacha, shai, mainball
    const ALLOWED_REMINDER_ROLES = new Set([
      'shotcaller',
      'builder',
      'elephant',
      'flag',
      'ft',
      'hwacha',
      'shai',
      'mainball',
      'main ball',
    ]);

    // Build comprehensive waitlist exclusion sets (by ID and by name)
    const waitlistIds = new Set<string>();
    const waitlistNames = new Set<string>();

    if (session.memberWaitlist) {
      for (const members of Object.values(session.memberWaitlist)) {
        if (Array.isArray(members)) {
          for (const m of members) {
            if (m?.id) waitlistIds.add(m.id);
            if (m?.name) waitlistNames.add(m.name.toLowerCase().trim());
          }
        }
      }
    }

    if (session.waitlist) {
      for (const names of Object.values(session.waitlist)) {
        if (Array.isArray(names)) {
          for (const n of names) {
            if (typeof n === 'string' && n.trim()) {
              waitlistNames.add(n.toLowerCase().trim());
            }
          }
        }
      }
    }

    // Also treat any overflow members beyond role limits in session.memberData as waitlist
    if (session.memberData) {
      for (const [roleName, members] of Object.entries(session.memberData)) {
        const limit = session.limits[roleName] ?? DEFAULT_ROLE_LIMITS[roleName] ?? 0;
        if (Array.isArray(members) && members.length > limit) {
          const overflow = members.slice(limit);
          for (const m of overflow) {
            if (m?.id) waitlistIds.add(m.id);
            if (m?.name) waitlistNames.add(m.name.toLowerCase().trim());
          }
        }
      }
    }

    // Collect ONLY main roster participants for the specified roles (STRICTLY within role limit)
    const registeredUserIds = new Set<string>();

    if (session.memberData) {
      for (const [roleName, members] of Object.entries(session.memberData)) {
        const cleanRole = roleName.toLowerCase().trim();
        const strippedRole = cleanRole.replace(/[\s_-]+/g, '');
        if (
          (ALLOWED_REMINDER_ROLES.has(cleanRole) || ALLOWED_REMINDER_ROLES.has(strippedRole)) &&
          Array.isArray(members)
        ) {
          const limit = session.limits[roleName] ?? DEFAULT_ROLE_LIMITS[roleName] ?? 0;
          // ONLY take up to the role's maximum capacity
          const rosterMembers = members.slice(0, limit);

          for (const m of rosterMembers) {
            if (!m?.id || !/^\d{17,20}$/.test(m.id)) continue;
            // Exclude anyone present on any waitlist (by ID or name)
            if (waitlistIds.has(m.id)) continue;
            if (m.name && waitlistNames.has(m.name.toLowerCase().trim())) continue;

            registeredUserIds.add(m.id);
          }
        }
      }
    }

    // Final safety pass: strictly remove any waitlist IDs
    for (const wId of waitlistIds) {
      registeredUserIds.delete(wId);
    }

    // Determine day and tier
    const dayKey =
      ({ 0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT' } as Record<number, string>)[
        session.targetDate.getDay()
      ] || 'SUN';

    const dayNames: Record<string, string> = {
      SUN: 'Sunday',
      MON: 'Monday',
      TUE: 'Tuesday',
      WED: 'Wednesday',
      THU: 'Thursday',
      FRI: 'Friday',
      SAT: 'Saturday',
    };

    const tier = CONFIG[`${dayKey}_TIER`] === 'Tier 1' ? 'Tier 1' : 'Tier 2';
    const defaultTarget = tier === 'Tier 2' ? 'Calpheon or Ulukita' : 'Balenos or Serendia';
    const configuredTarget = CONFIG[`${dayKey}_VOTE_TARGET`]?.trim();
    const target = configuredTarget || defaultTarget;

    // Custom reminder message template
    const rawTemplate =
      customMessage?.trim() ||
      CONFIG.NW_REMINDER_MESSAGE?.trim() ||
      '⚠️ **Node War In-Game Vote Reminder**\nPlease **YES UP** on **{target}** for **{tier}**!\nMake sure to submit your vote in-game before the deadline.';

    const formattedMessage = rawTemplate
      .replace(/\{target\}/gi, target)
      .replace(/\{tier\}/gi, tier)
      .replace(/\{date\}/gi, moment(session.targetDate).format('YYYY-MM-DD'))
      .replace(/\{day\}/gi, dayNames[dayKey] || dayKey)
      .replace(/\{count\}/gi, String(registeredUserIds.size));

    const userIdsList = Array.from(registeredUserIds);

    if (userIdsList.length === 0) {
      // If nobody has registered yet, post reminder notice without pinging @everyone
      await channel.send({
        content: `🔔 **Node War In-Game Vote Reminder**\n${formattedMessage}\n\n*(Notice: No Node War participants currently registered on the roster).*`,
        allowedMentions: { parse: [] }, // STRICT: NO @everyone, NO roles
      });
      log('REMINDER', `Node War reminder sent (0 registered participants). Target: ${target} (${tier})`);
      return {
        success: true,
        count: 0,
        target,
        tier,
        message: `Reminder sent to Node War channel (0 participants currently registered)`,
      };
    }

    // STRICT: Send EXACTLY ONE message to Discord (never split or tripled)
    const baseHeader = `🔔 **Node War In-Game Vote Reminder**\n${formattedMessage}\n\n`;
    const participantsHeader = `**Node War Participants (${userIdsList.length}):**\n`;

    const pingedUserIds: string[] = [];
    const mentionStrings: string[] = [];
    const maxContentLength = 1950;
    let currentLength = baseHeader.length + participantsHeader.length;

    for (const id of userIdsList) {
      const mention = `<@${id}>`;
      const addedLen = (mentionStrings.length > 0 ? 1 : 0) + mention.length;
      if (currentLength + addedLen <= maxContentLength) {
        mentionStrings.push(mention);
        pingedUserIds.push(id);
        currentLength += addedLen;
      } else {
        break;
      }
    }

    const content = `${baseHeader}${participantsHeader}${mentionStrings.join(' ')}`;

    await channel.send({
      content,
      allowedMentions: {
        users: pingedUserIds,
        roles: [], // STRICT: NEVER PING ALLIANCE OR ANY ROLES
        parse: [], // NEVER parse @everyone or @here
      },
    });

    log(
      'REMINDER',
      `Node War vote reminder pinged ${userIdsList.length} registered participant(s) in a single message for ${target} (${tier}).`
    );

    return {
      success: true,
      count: userIdsList.length,
      target,
      tier,
      message: `Reminder sent! Pinged ${userIdsList.length} registered Node War participant(s) in 1 message.`,
    };
  } finally {
    isSendingVoteReminder = false;
  }
}

export async function sendSiegeReminder(customMessage?: string) {
  if (isSendingSiegeReminder) {
    log('WARN', 'Siege War reminder already in progress, skipping concurrent call.');
    return { success: false, reason: 'Siege reminder already being sent' };
  }
  isSendingSiegeReminder = true;
  try {
    if (!client.isReady || !client.isReady()) {
      log('WARN', 'Discord client not ready. Siege reminder skipped.');
      return { success: false, reason: 'Discord bot client is not connected' };
    }

    const session = client.siegeSession;
    if (!session) {
      log('REMINDER', 'No Siege War session loaded. Reminder skipped.');
      return { success: false, reason: 'No Siege War session is currently active' };
    }

  const channelId = CONFIG.SIEGE_CHANNEL_ID || CONFIG.CHANNEL_ID;
  const channel = await client.channels.fetch(String(channelId || '0')).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    log('ERROR', `Cannot send siege reminder: channel ${channelId} not found or not text-based.`);
    return { success: false, reason: `Siege War channel ${channelId} not found` };
  }

  // Build comprehensive waitlist exclusion sets (by ID and by name)
  const waitlistIds = new Set<string>();
  const waitlistNames = new Set<string>();

  if (session.memberWaitlist) {
    for (const members of Object.values(session.memberWaitlist)) {
      if (Array.isArray(members)) {
        for (const m of members) {
          if (m?.id) waitlistIds.add(m.id);
          if (m?.name) waitlistNames.add(m.name.toLowerCase().trim());
        }
      }
    }
  }

  if (session.waitlist) {
    for (const names of Object.values(session.waitlist)) {
      if (Array.isArray(names)) {
        for (const n of names) {
          if (typeof n === 'string' && n.trim()) {
            waitlistNames.add(n.toLowerCase().trim());
          }
        }
      }
    }
  }

  // Treat any overflow members beyond role limits in session.memberData as waitlist
  if (session.memberData) {
    for (const [roleName, members] of Object.entries(session.memberData)) {
      const limit = session.limits[roleName] ?? DEFAULT_SIEGE_ROLE_LIMITS[roleName] ?? 0;
      if (Array.isArray(members) && members.length > limit) {
        const overflow = members.slice(limit);
        for (const m of overflow) {
          if (m?.id) waitlistIds.add(m.id);
          if (m?.name) waitlistNames.add(m.name.toLowerCase().trim());
        }
      }
    }
  }

  // Collect ONLY main roster participants for Siege War (STRICTLY within role limit)
  const registeredUserIds = new Set<string>();

  if (session.memberData) {
    for (const [roleName, members] of Object.entries(session.memberData)) {
      if (Array.isArray(members)) {
        const limit = session.limits[roleName] ?? DEFAULT_SIEGE_ROLE_LIMITS[roleName] ?? 0;
        const rosterMembers = members.slice(0, limit);

        for (const m of rosterMembers) {
          if (!m?.id || !/^\d{17,20}$/.test(m.id)) continue;
          if (waitlistIds.has(m.id)) continue;
          if (m.name && waitlistNames.has(m.name.toLowerCase().trim())) continue;

          registeredUserIds.add(m.id);
        }
      }
    }
  }

  // Final safety pass: strictly remove any waitlist IDs
  for (const wId of waitlistIds) {
    registeredUserIds.delete(wId);
  }

  const defaultMsg =
    '⚔️ **Siege War In-Game Vote & Attendance Reminder**\nPlease **YES UP** at **Balenos Server** at **19:00 GMT+7**!\nMake sure you are geared, on time, and have submitted your vote in-game.';

  const formattedMessage = customMessage?.trim() || defaultMsg;
  const userIdsList = Array.from(registeredUserIds);

  if (userIdsList.length === 0) {
    await channel.send({
      content: `🔔 **Siege War In-Game Vote Reminder**\n${formattedMessage}\n\n*(Notice: No participants currently registered on the Siege War main roster).*`,
      allowedMentions: { parse: [] },
    });
    log('REMINDER', `Siege War reminder sent (0 registered participants).`);
    return {
      success: true,
      count: 0,
      message: `Reminder sent to Siege War channel (0 participants currently registered)`,
    };
  }

  // STRICT: Send EXACTLY ONE message to Discord (never split or tripled)
  const baseHeader = `🔔 **Siege War In-Game Vote Reminder**\n${formattedMessage}\n\n`;
  const participantsHeader = `**Siege War Registered Participants (${userIdsList.length}):**\n`;

  const pingedUserIds: string[] = [];
  const mentionStrings: string[] = [];
  const maxContentLength = 1950;
  let currentLength = baseHeader.length + participantsHeader.length;

  for (const id of userIdsList) {
    const mention = `<@${id}>`;
    const addedLen = (mentionStrings.length > 0 ? 1 : 0) + mention.length;
    if (currentLength + addedLen <= maxContentLength) {
      mentionStrings.push(mention);
      pingedUserIds.push(id);
      currentLength += addedLen;
    } else {
      break;
    }
  }

  const content = `${baseHeader}${participantsHeader}${mentionStrings.join(' ')}`;

  await channel.send({
    content,
    allowedMentions: {
      users: pingedUserIds,
      roles: [], // STRICT: NEVER PING ALLIANCE OR ANY ROLES
      parse: [], // NEVER parse @everyone or @here
    },
  });

    log(
      'REMINDER',
      `Siege War vote reminder pinged ${userIdsList.length} registered participant(s) in a single message.`
    );

    return {
      success: true,
      count: userIdsList.length,
      message: `Siege reminder sent! Pinged ${userIdsList.length} registered Siege War participant(s) in 1 message.`,
    };
  } finally {
    isSendingSiegeReminder = false;
  }
}

export async function giveAllMembersAllianceRole() {
  if (!client.isReady || !client.isReady()) {
    return { success: false, reason: 'Discord bot client is not connected' };
  }
  const guild = client.guilds.cache.get(String(CONFIG.SERVER_ID || '1543436950466330676'));
  if (!guild) {
    return { success: false, reason: 'Guild not found' };
  }
  const roleId = CONFIG.ALLIANCE_ROLE_ID || '1544708723912482896';
  const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
  if (!role) {
    return { success: false, reason: `Alliance role ${roleId} not found in guild` };
  }

  const members = await guild.members.fetch();
  let assignedCount = 0;
  let alreadyHasCount = 0;
  let errorCount = 0;
  let errorReason = '';

  for (const [, member] of members) {
    if (member.user.bot) continue;
    if (member.roles.cache.has(roleId)) {
      alreadyHasCount++;
      continue;
    }
    try {
      await member.roles.add(role);
      assignedCount++;
    } catch (e: any) {
      errorCount++;
      if (!errorReason) errorReason = e?.message || String(e);
      log('WARN', `Could not assign Alliance role to ${member.user.tag}: ${e?.message || e}`);
    }
  }

  log(
    'ROLE',
    `Assigned Alliance role to ${assignedCount} members (${alreadyHasCount} already had it, ${errorCount} errors)`
  );

  return {
    success: true,
    assignedCount,
    alreadyHasCount,
    errorCount,
    errorReason: errorCount > 0 ? errorReason : undefined,
    totalMembers: members.size,
    message: `Alliance role assigned to ${assignedCount} member(s). ${alreadyHasCount} already had the role.${
      errorCount > 0
        ? ` (${errorCount} could not be updated due to Discord role hierarchy: please ensure the bot role is dragged above the Alliance role in Server Settings > Roles)`
        : ''
    }`,
  };
}

let schedulerTimer: NodeJS.Timeout | null = null;

export function startScheduler() {
  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = setInterval(async () => {
    const now = moment().tz(JAKARTA_TZ);
    const today = now.format('YYYY-MM-DD');
    const isOpeningTime = now.hour() * 60 + now.minute() >= 21 * 60 + 30;
    if (isOpeningTime && lastPostDate !== today) {
      lastPostDate = now.format('YYYY-MM-DD');

      if (now.day() === 5) {
        // Friday -> no node war Saturday
        if (client.isReady && client.isReady()) {
          const ch = await client.channels.fetch(String(CONFIG.CHANNEL_ID || '0')).catch(() => null);
          if (ch && ch.isTextBased()) {
            await ch.send(
              `No Node War bot reservation today, stand by for free medals at siege time <@&${
                CONFIG.ALLIANCE_ROLE_ID || '0'
              }>`
            );
          }
        }
      } else if (!client.currentSession || client.currentSession.isClosed) {
        await postRSVP();
      }
    } else if (now.hour() === 20 && now.minute() === 0) {
      await closeRSVP();
    }

    // Automatically send reminder at exactly 17:00 and 19:00 GMT+7 (Asia/Jakarta)
    const isReminderHour = now.hour() === 17 || now.hour() === 19;
    const isReminderMinute = now.minute() === 0;

    if (isReminderHour && isReminderMinute) {
      const reminderKey = `${today}-${now.hour()}`;
      if (!voteReminderSent.has(reminderKey)) {
        voteReminderSent.add(reminderKey);
        saveReminderHistory(voteReminderSent);

        const isSaturday = now.day() === 6;
        if (isSaturday && client.siegeSession && !client.siegeSession.isClosed) {
          log('REMINDER', `Triggering automated ${now.hour()}:00 GMT+7 Siege War vote reminder (single ping)...`);
          await sendSiegeReminder();
        } else if (client.currentSession && !client.currentSession.isClosed) {
          log('REMINDER', `Triggering automated ${now.hour()}:00 GMT+7 Node War vote reminder (single ping)...`);
          await sendVoteReminder();
        }
      }
    }
  }, 30 * 1000);
}

// Bot event registrations
client.once(Events.ClientReady, async () => {
  log('INFO', `Discord Bot logged in as ${client.user?.tag}`);
  registerSlashCommands().catch((error) => log('ERROR', `Could not register slash commands: ${error}`));
  restoreState();
  restoreState(SIEGE_DATA_FILE, 'siegeSession', 'siege');
  startScheduler();

  // Sync state with live Discord messages if active
  syncFromDiscord().catch((e) => log('WARN', `Auto-sync on ready error: ${e?.message || e}`));

  // Pre-fetch messages so client.mainMsg and client.siegeMainMsg are live in memory
  try {
    if (CONFIG.CHANNEL_ID && client.mainMsgId) {
      const ch = await client.channels.fetch(String(CONFIG.CHANNEL_ID)).catch(() => null);
      if (ch && ch.isTextBased()) {
        client.mainMsg = await ch.messages.fetch(client.mainMsgId).catch(() => null);
        if (client.waitlistMsgId) {
          client.waitlistMsg = await ch.messages.fetch(client.waitlistMsgId).catch(() => null);
        }
      }
    }
    if (CONFIG.SIEGE_CHANNEL_ID && client.siegeMainMsgId) {
      const sCh = await client.channels.fetch(String(CONFIG.SIEGE_CHANNEL_ID)).catch(() => null);
      if (sCh && sCh.isTextBased()) {
        client.siegeMainMsg = await sCh.messages.fetch(client.siegeMainMsgId).catch(() => null);
        if (client.siegeWaitlistMsgId) {
          client.siegeWaitlistMsg = await sCh.messages.fetch(client.siegeWaitlistMsgId).catch(() => null);
        }
      }
    }

    // Refresh limits with timezone-aware calculations and update Discord embeds
    if (client.currentSession && !client.currentSession.isClosed) {
      client.currentSession.limits = getLimits(client.currentSession.targetDate);
      client.currentSession.triggerDiscordUpdate(100, true);
    }
  } catch (e) {
    log('WARN', `Could not pre-fetch messages on ready: ${e}`);
  }
});

client.on(Events.InteractionCreate, async (interaction: any) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (!isAuthorized(interaction.member)) {
        await interaction.reply({ content: '🚫 Unauthorized.', flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      if (interaction.commandName === 'open-node-war') {
        const opened = await postRSVP();
        await interaction.editReply(opened ? '✅ Node War RSVP opened.' : '⚠️ Failed to open Node War.');
      } else if (interaction.commandName === 'close-rsvp') {
        await closeRSVP();
        await interaction.editReply('✅ Node War RSVP closed.');
      } else if (interaction.commandName === 'open-siege') {
        const opened = await postSiege();
        await interaction.editReply(opened ? '✅ Siege War RSVP opened.' : '⚠️ Failed to open Siege War.');
      }
      return;
    }

    if (!interaction.isButton()) return;

    const role = CUSTOM_ID_TO_ROLE[interaction.customId];
    if (!role) {
      log('WARN', `Button customId ${interaction.customId} not recognized in CUSTOM_ID_TO_ROLE`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Unknown RSVP option.', flags: MessageFlags.Ephemeral }).catch(() => {});
      } else {
        await interaction.followUp({ content: '⚠️ Unknown RSVP option.', flags: MessageFlags.Ephemeral }).catch(() => {});
      }
      return;
    }

    // Smart session resolution
    let session: RSVPSession | null = null;
    let isSiege = false;

    if (interaction.message.id === client.mainMsgId) {
      session = client.currentSession;
      isSiege = false;
    } else if (interaction.message.id === client.siegeMainMsgId) {
      session = client.siegeSession;
      isSiege = true;
    } else if (interaction.channelId === CONFIG.SIEGE_CHANNEL_ID || interaction.customId === 'rsvp_witch_wizard') {
      session = client.siegeSession;
      isSiege = true;
    } else if (interaction.channelId === CONFIG.CHANNEL_ID) {
      session = client.currentSession;
      isSiege = false;
    } else {
      const title = interaction.message.embeds?.[0]?.title || '';
      if (title.toLowerCase().includes('siege')) {
        session = client.siegeSession;
        isSiege = true;
      } else if (title.toLowerCase().includes('node')) {
        session = client.currentSession;
        isSiege = false;
      } else {
        session = client.currentSession || client.siegeSession;
        isSiege = session === client.siegeSession;
      }
    }

    if (!session) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠️ This RSVP session is no longer active. Please check the latest announcement.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      } else {
        await interaction.followUp({
          content: '⚠️ This RSVP session is no longer active. Please check the latest announcement.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
      return;
    }

    // Dynamic message re-anchoring: update client message reference to the exact message the user clicked
    if (isSiege) {
      client.siegeMainMsg = interaction.message;
      client.siegeMainMsgId = interaction.message.id;
    } else {
      client.mainMsg = interaction.message;
      client.mainMsgId = interaction.message.id;
    }

    await session.processRoleSelection(interaction, role);
  } catch (error) {
    log('ERROR', `Interaction failed: ${error}`);
    if (interaction.isChatInputCommand() && (interaction.deferred || interaction.replied)) {
      await interaction.editReply('⚠️ The command could not be completed. Please try again.').catch(() => {});
    }
  }
});

function parseEmbedRoleMembers(embed: any): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!embed || !embed.fields) return result;
  for (const field of embed.fields) {
    let role = null;
    const name = field.name || '';
    if (name.includes('Main Ball')) role = 'Main Ball';
    else if (name.includes('Builder')) role = 'Builder';
    else if (name.includes('Elephant')) role = 'Elephant';
    else if (name.includes('Flag')) role = 'Flag';
    else if (name.includes('FT')) role = 'FT';
    else if (name.includes('Hwacha')) role = 'Hwacha';
    else if (name.includes('Shai')) role = 'Shai';
    else if (name.includes('Shotcaller')) role = 'Shotcaller';
    else if (name.includes('Witch') || name.includes('Wizard')) role = 'Witch/Wizard';

    if (!role) continue;
    const rawVal = String(field.value || '').trim();
    const stripped = rawVal.replace(/^[•\-\*\s]+/, '').trim();
    if (!stripped || stripped === '-' || stripped === '—' || stripped === '–' || stripped.toLowerCase() === 'none') {
      continue;
    }
    const lines = rawVal
      .split('\n')
      .map((l: string) => l.replace(/^[•\-\*\s]+/, '').trim())
      .filter((l: string) => {
        const clean = l.replace(/^[•\-\*\s]+/, '').trim();
        return (
          clean.length > 0 &&
          clean !== '-' &&
          clean !== '—' &&
          clean !== '–' &&
          !clean.toLowerCase().includes('no players') &&
          !clean.toLowerCase().includes('none') &&
          !clean.toLowerCase().includes('no backups')
        );
      });

    if (!result[role]) result[role] = [];
    result[role].push(...lines);
  }
  return result;
}

export async function syncFromDiscord(): Promise<{
  success: boolean;
  nodeCount: number;
  siegeCount: number;
  message: string;
}> {
  if (!client || !client.isReady || !client.isReady()) {
    return { success: false, nodeCount: 0, siegeCount: 0, message: 'Discord bot client is not connected' };
  }

  try {
    const guild = CONFIG.SERVER_ID ? await client.guilds.fetch(CONFIG.SERVER_ID).catch(() => null) : null;
    const nameMap = new Map<string, { id: string; name: string }>();
    if (guild) {
      const members = await guild.members.fetch().catch(() => null);
      if (members) {
        for (const [id, m] of members) {
          nameMap.set(m.displayName.toLowerCase(), { id, name: m.displayName });
          nameMap.set(m.user.username.toLowerCase(), { id, name: m.displayName });
        }
      }
    }

    const buildRecords = (roleMap: Record<string, string[]>) => {
      const recs: Record<string, MemberRecord[]> = {};
      for (const [role, names] of Object.entries(roleMap)) {
        recs[role] = names.map((n) => {
          const match = nameMap.get(n.toLowerCase());
          return {
            id: match ? match.id : `synced-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: match ? match.name : n,
          };
        });
      }
      return recs;
    };

    let nodeCount = 0;
    let siegeCount = 0;

    // 1. Sync Node War
    if (CONFIG.CHANNEL_ID) {
      const nodeCh: any = await client.channels.fetch(CONFIG.CHANNEL_ID).catch(() => null);
      if (nodeCh && nodeCh.messages) {
        const msgs = await nodeCh.messages.fetch({ limit: 15 }).catch(() => null);
        if (msgs) {
          let mainMsg: any = null;
          let waitMsg: any = null;
          for (const [, msg] of msgs) {
            for (const emb of msg.embeds || []) {
              if (emb.title && emb.title.includes('Node War RSVP') && !mainMsg) {
                mainMsg = msg;
              }
              if (emb.title && emb.title.includes('Waitlist') && !waitMsg) {
                waitMsg = msg;
              }
            }
            if (mainMsg && waitMsg) break;
          }

          if (mainMsg) {
            const data = {
              Builder: [],
              Elephant: [],
              Flag: [],
              FT: [],
              Hwacha: [],
              Shai: [],
              Shotcaller: [],
              'Main Ball': [],
              ...parseEmbedRoleMembers(mainMsg.embeds[0]),
            };
            const waitlist = {
              Builder: [],
              Elephant: [],
              Flag: [],
              FT: [],
              Hwacha: [],
              Shai: [],
              Shotcaller: [],
              'Main Ball': [],
              ...(waitMsg ? parseEmbedRoleMembers(waitMsg.embeds[0]) : {}),
            };
            const isClosed = Boolean(
              mainMsg.content?.includes('CLOSED') || mainMsg.embeds[0]?.description?.includes('CLOSED')
            );
            const targetDateStr = moment().tz(JAKARTA_TZ).format('YYYY-MM-DD');

            const nodeState = {
              target_date: targetDateStr,
              is_closed: isClosed,
              data,
              waitlist,
              member_data: buildRecords(data),
              member_waitlist: buildRecords(waitlist),
              session_type: 'node',
              main_msg_id: mainMsg.id,
              waitlist_msg_id: waitMsg?.id || null,
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(nodeState, null, 4));
            restoreState(DATA_FILE, 'currentSession', '');
            nodeCount = Object.values(data).reduce((s, a) => s + a.length, 0);
            log('INFO', `Synced ${nodeCount} Node War members from Discord message ${mainMsg.id}`);
          }
        }
      }
    }

    // 2. Sync Siege War
    if (CONFIG.SIEGE_CHANNEL_ID) {
      const siegeCh: any = await client.channels.fetch(CONFIG.SIEGE_CHANNEL_ID).catch(() => null);
      if (siegeCh && siegeCh.messages) {
        const msgs = await siegeCh.messages.fetch({ limit: 15 }).catch(() => null);
        if (msgs) {
          let mainMsg: any = null;
          let waitMsg: any = null;
          for (const [, msg] of msgs) {
            for (const emb of msg.embeds || []) {
              if (emb.title && emb.title.includes('Siege War RSVP') && !mainMsg) {
                mainMsg = msg;
              }
              if (emb.title && emb.title.includes('Waitlist') && !waitMsg) {
                waitMsg = msg;
              }
            }
            if (mainMsg && waitMsg) break;
          }

          if (mainMsg) {
            const data = {
              Builder: [],
              Elephant: [],
              Flag: [],
              FT: [],
              Hwacha: [],
              Shai: [],
              Shotcaller: [],
              'Witch/Wizard': [],
              'Main Ball': [],
              ...parseEmbedRoleMembers(mainMsg.embeds[0]),
            };
            const waitlist = {
              Builder: [],
              Elephant: [],
              Flag: [],
              FT: [],
              Hwacha: [],
              Shai: [],
              Shotcaller: [],
              'Witch/Wizard': [],
              'Main Ball': [],
              ...(waitMsg ? parseEmbedRoleMembers(waitMsg.embeds[0]) : {}),
            };
            const isClosed = Boolean(
              mainMsg.content?.includes('CLOSED') || mainMsg.embeds[0]?.description?.includes('CLOSED')
            );
            const targetDateStr = '2026-09-06';

            const siegeState = {
              target_date: targetDateStr,
              is_closed: isClosed,
              data,
              waitlist,
              member_data: buildRecords(data),
              member_waitlist: buildRecords(waitlist),
              session_type: 'siege',
              main_msg_id: mainMsg.id,
              waitlist_msg_id: waitMsg?.id || null,
            };
            fs.writeFileSync(SIEGE_DATA_FILE, JSON.stringify(siegeState, null, 4));
            restoreState(SIEGE_DATA_FILE, 'siegeSession', 'siege');
            siegeCount = Object.values(data).reduce((s, a) => s + a.length, 0);
            log('INFO', `Synced ${siegeCount} Siege War members from Discord message ${mainMsg.id}`);
          }
        }
      }
    }

    return {
      success: true,
      nodeCount,
      siegeCount,
      message: `Successfully synchronized from Discord: ${nodeCount} Node War members and ${siegeCount} Siege War members.`,
    };
  } catch (err: any) {
    log('ERROR', `Failed to sync from Discord: ${err?.message || err}`);
    return {
      success: false,
      nodeCount: 0,
      siegeCount: 0,
      message: err?.message || 'Sync failed',
    };
  }
}

// Initial boot restoration even before bot logs in
restoreState();
restoreState(SIEGE_DATA_FILE, 'siegeSession', 'siege');
startScheduler();
