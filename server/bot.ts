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
import {
  CONFIG,
  DATA_FILE,
  SIEGE_DATA_FILE,
  HISTORY_FILE,
  JAKARTA_TZ,
  log,
} from './config.js';
import { CUSTOM_ID_TO_ROLE, SIEGE_ROLE_BUTTONS } from './constants.js';
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
const voteReminderSent = new Set<string>();

function messageKey(prefix: string, name: string) {
  return prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name;
}

const SLASH_COMMANDS = [
  new SlashCommandBuilder().setName('open-node-war').setDescription('Open a Node War RSVP now'),
  new SlashCommandBuilder().setName('close-rsvp').setDescription('Close the current Node War RSVP'),
  new SlashCommandBuilder().setName('open-siege').setDescription('Open a Siege War RSVP in the configured channel'),
].map((command) => command.toJSON());

export async function registerSlashCommands(token?: string) {
  const activeToken = token || process.env.DISCORD_TOKEN;
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

  // Collect ONLY participants who already registered for Node War
  const registeredUserIds = new Set<string>();

  // Main roster
  if (session.memberData) {
    for (const members of Object.values(session.memberData)) {
      if (Array.isArray(members)) {
        for (const m of members) {
          if (m?.id && /^\d{17,20}$/.test(m.id)) {
            registeredUserIds.add(m.id);
          }
        }
      }
    }
  }

  // Waitlist roster
  if (session.memberWaitlist) {
    for (const members of Object.values(session.memberWaitlist)) {
      if (Array.isArray(members)) {
        for (const m of members) {
          if (m?.id && /^\d{17,20}$/.test(m.id)) {
            registeredUserIds.add(m.id);
          }
        }
      }
    }
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

  // Ping ONLY registered participants (chunked to ensure message stays well under 2000 characters)
  const mentions = userIdsList.map((id) => `<@${id}>`);
  const chunkSize = 40;

  for (let i = 0; i < mentions.length; i += chunkSize) {
    const chunkMentions = mentions.slice(i, i + chunkSize);
    const chunkIds = userIdsList.slice(i, i + chunkSize);

    let content = '';
    if (i === 0) {
      content = `🔔 **Node War In-Game Vote Reminder**\n${formattedMessage}\n\n**Node War Participants (${userIdsList.length}):**\n${chunkMentions.join(' ')}`;
    } else {
      content = `**Node War Participants (Continued):**\n${chunkMentions.join(' ')}`;
    }

    await channel.send({
      content,
      allowedMentions: {
        users: chunkIds, // ONLY ping these registered users
        roles: [],       // NEVER ping roles
        parse: [],       // NEVER parse @everyone or @here
      },
    });
  }

  log(
    'REMINDER',
    `Node War vote reminder pinged ${userIdsList.length} registered participant(s) for ${target} (${tier}).`
  );

  return {
    success: true,
    count: userIdsList.length,
    target,
    tier,
    message: `Reminder sent! Pinged ${userIdsList.length} registered Node War participant(s).`,
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

    // Automatically send reminder at 17:00 and 19:00 GMT+7 (Asia/Jakarta)
    if (now.hour() === 17 || now.hour() === 19) {
      const reminderKey = `${now.format('YYYY-MM-DD')}-${now.hour()}`;
      if (!voteReminderSent.has(reminderKey)) {
        voteReminderSent.add(reminderKey);
        log('REMINDER', `Triggering automated ${now.hour()}:00 GMT+7 Node War vote reminder...`);
        await sendVoteReminder();
      }
    }
  }, 60 * 1000);
}

// Bot event registrations
client.once(Events.ClientReady, () => {
  log('INFO', `Discord Bot logged in as ${client.user?.tag}`);
  registerSlashCommands().catch((error) => log('ERROR', `Could not register slash commands: ${error}`));
  restoreState();
  restoreState(SIEGE_DATA_FILE, 'siegeSession', 'siege');
  startScheduler();
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
    if (!role) return;
    const session =
      interaction.message.id === client.mainMsgId
        ? client.currentSession
        : interaction.message.id === client.siegeMainMsgId
        ? client.siegeSession
        : null;
    if (!session) return;
    await session.processRoleSelection(interaction, role);
  } catch (error) {
    log('ERROR', `Interaction failed: ${error}`);
    if (interaction.isChatInputCommand() && (interaction.deferred || interaction.replied)) {
      await interaction.editReply('⚠️ The command could not be completed. Please try again.').catch(() => {});
    }
  }
});

// Initial boot restoration even before bot logs in
restoreState();
restoreState(SIEGE_DATA_FILE, 'siegeSession', 'siege');
startScheduler();
