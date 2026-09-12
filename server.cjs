var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs4 = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// server/config.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_moment_timezone = __toESM(require("moment-timezone"), 1);
var JAKARTA_TZ = "Asia/Jakarta";
var CONFIG_FILE = import_path.default.join(process.cwd(), "config.json");
var DATA_FILE = import_path.default.join(process.cwd(), "rsvp_data.json");
var HISTORY_FILE = import_path.default.join(process.cwd(), "rsvp_history.json");
var SIEGE_DATA_FILE = import_path.default.join(process.cwd(), "siege_data.json");
var recentLogs = [];
function log(category, message) {
  const time = (0, import_moment_timezone.default)().tz(JAKARTA_TZ).format("HH:mm:ss");
  console.log(`[${time}] [${category.padEnd(7)}] ${message}`);
  recentLogs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time,
    category,
    message
  });
  if (recentLogs.length > 200) {
    recentLogs.pop();
  }
}
var DEFAULT_CONFIG = {
  SERVER_ID: "1543436950466330676",
  CHANNEL_ID: "1543437822520856738",
  LOG_CHANNEL_ID: "1543437822520856738",
  AUTHORIZED_ROLE_ID: "1547627722992521308",
  ALLIANCE_ROLE_ID: "1547627722992521308",
  SIEGE_CHANNEL_ID: "1547628216246603816",
  SIEGE_TOTAL_PAX: "100",
  SIEGE_LIMIT_BUILDER: "1",
  SIEGE_LIMIT_ELEPHANT: "1",
  SIEGE_LIMIT_FLAG: "1",
  SIEGE_LIMIT_FT: "2",
  SIEGE_LIMIT_HWACHA: "1",
  SIEGE_LIMIT_SHAI: "4",
  SIEGE_LIMIT_SHOTCALLER: "3",
  SIEGE_LIMIT_WITCH_WIZARD: "5",
  SUN_TIER: "Tier 2",
  MON_TIER: "Tier 2",
  TUE_TIER: "Tier 2",
  WED_TIER: "Tier 2",
  THU_TIER: "Tier 2",
  FRI_TIER: "Tier 2",
  SUN_VOTE_TARGET: "",
  MON_VOTE_TARGET: "",
  TUE_VOTE_TARGET: "",
  WED_VOTE_TARGET: "",
  THU_VOTE_TARGET: "",
  FRI_VOTE_TARGET: "",
  LIMIT_BUILDER: "1",
  LIMIT_ELEPHANT: "1",
  LIMIT_FLAG: "1",
  LIMIT_FT: "2",
  LIMIT_HWACHA: "1",
  LIMIT_SHAI: "3",
  LIMIT_SHOTCALLER: "1",
  MAINBALL_SUN_T1: "20",
  MAINBALL_SUN_T2: "35",
  MAINBALL_MON_T1: "15",
  MAINBALL_MON_T2: "25",
  MAINBALL_TUE_T1: "20",
  MAINBALL_TUE_T2: "25",
  MAINBALL_WED_T1: "15",
  MAINBALL_WED_T2: "25",
  MAINBALL_THU_T1: "20",
  MAINBALL_THU_T2: "25",
  MAINBALL_FRI_T1: "15",
  MAINBALL_FRI_T2: "35",
  NW_REMINDER_MESSAGE: "\u26A0\uFE0F **Node War In-Game Vote Reminder**\nPlease **YES UP** on **{target}** for **{tier}**!\nMake sure to submit your vote in-game before the deadline."
};
function loadConfig() {
  if (!import_fs.default.existsSync(CONFIG_FILE)) {
    import_fs.default.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 4));
    return { ...DEFAULT_CONFIG };
  }
  try {
    const config = JSON.parse(import_fs.default.readFileSync(CONFIG_FILE, "utf8"));
    let changed = false;
    for (const legacyKey of ["TOKEN", "WEB_PASSWORD"]) {
      if (Object.hasOwn(config, legacyKey)) {
        delete config[legacyKey];
        changed = true;
      }
    }
    if (changed) {
      import_fs.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
    }
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
var CONFIG = loadConfig();
function saveConfig() {
  import_fs.default.writeFileSync(CONFIG_FILE, JSON.stringify(CONFIG, null, 4));
}

// server/utils.ts
var import_discord = require("discord.js");

// server/constants.ts
var ROLE_EMOJIS = {
  "Main Ball": "\u2694\uFE0F",
  Shotcaller: "\u{1F4E2}",
  Builder: "\u{1F528}",
  Elephant: "1543984913047486545",
  Flag: "1543984858894704710",
  FT: "1543984885432062092",
  Hwacha: "1543984939861803108",
  Shai: "1544203289393111080",
  "Witch/Wizard": "1544202932256252167",
  Witch: "1544202932256252167",
  Wizard: "1544202904817373224"
};
function formatDiscordRoleEmoji(role, rawVal) {
  const val = rawVal ?? ROLE_EMOJIS[role] ?? "\u{1F464}";
  if (role === "Witch/Wizard" && (val === "\u{1F9D9}" || val === "1544202932256252167")) {
    return "<:Witch:1544202932256252167><:Wizard:1544202904817373224>";
  }
  if (!val) return "\u{1F464}";
  const trimmed = String(val).trim();
  if (/^\d+$/.test(trimmed)) {
    const cleanRole = role.replace(/[^a-zA-Z0-9_]/g, "") || "emoji";
    return `<:${cleanRole}:${trimmed}>`;
  }
  return trimmed;
}
var DAY_KEYS = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI"
};
var ROLE_BUTTONS = [
  { role: "Main Ball", customId: "rsvp_main", emoji: ROLE_EMOJIS["Main Ball"] || "\u2694\uFE0F" },
  { role: "Builder", customId: "rsvp_builder", emoji: ROLE_EMOJIS["Builder"] || "\u{1F528}" },
  { role: "Elephant", customId: "rsvp_elephant", emoji: ROLE_EMOJIS["Elephant"] || "1543984913047486545" },
  { role: "Flag", customId: "rsvp_flag", emoji: ROLE_EMOJIS["Flag"] || "1543984858894704710" },
  { role: "FT", customId: "rsvp_ft", emoji: ROLE_EMOJIS["FT"] || "1543984885432062092" },
  { role: "Hwacha", customId: "rsvp_hwacha", emoji: ROLE_EMOJIS["Hwacha"] || "1543984939861803108" },
  { role: "Shai", customId: "rsvp_shai", emoji: ROLE_EMOJIS["Shai"] || "1544203289393111080" },
  { role: "Shotcaller", customId: "rsvp_shotcaller", emoji: ROLE_EMOJIS["Shotcaller"] || "\u{1F4E2}" }
];
var SIEGE_ROLE_BUTTONS = [
  { role: "Builder", customId: "rsvp_builder", emoji: ROLE_EMOJIS["Builder"] || "\u{1F528}" },
  { role: "Elephant", customId: "rsvp_elephant", emoji: ROLE_EMOJIS["Elephant"] || "1543984913047486545" },
  { role: "Flag", customId: "rsvp_flag", emoji: ROLE_EMOJIS["Flag"] || "1543984858894704710" },
  { role: "FT", customId: "rsvp_ft", emoji: ROLE_EMOJIS["FT"] || "1543984885432062092" },
  { role: "Hwacha", customId: "rsvp_hwacha", emoji: ROLE_EMOJIS["Hwacha"] || "1543984939861803108" },
  { role: "Shai", customId: "rsvp_shai", emoji: ROLE_EMOJIS["Shai"] || "1544203289393111080" },
  { role: "Shotcaller", customId: "rsvp_shotcaller", emoji: ROLE_EMOJIS["Shotcaller"] || "\u{1F4E2}" },
  { role: "Witch/Wizard", customId: "rsvp_witch_wizard", emoji: ROLE_EMOJIS["Witch/Wizard"] || "1544202932256252167" },
  { role: "Main Ball", customId: "rsvp_main", emoji: ROLE_EMOJIS["Main Ball"] || "\u2694\uFE0F" }
];
var CUSTOM_ID_TO_ROLE = Object.fromEntries(
  ROLE_BUTTONS.map((b) => [b.customId, b.role])
);
for (const button of SIEGE_ROLE_BUTTONS) {
  CUSTOM_ID_TO_ROLE[button.customId] = button.role;
}
CUSTOM_ID_TO_ROLE["rsvp_cancel"] = "Cancel";
var DEFAULT_ROLE_LIMITS = {
  Builder: 1,
  Elephant: 1,
  Flag: 1,
  FT: 2,
  Hwacha: 1,
  Shai: 3,
  Shotcaller: 1
};
var ROLE_CONFIG_KEYS = {
  Builder: "LIMIT_BUILDER",
  Elephant: "LIMIT_ELEPHANT",
  Flag: "LIMIT_FLAG",
  FT: "LIMIT_FT",
  Hwacha: "LIMIT_HWACHA",
  Shai: "LIMIT_SHAI",
  Shotcaller: "LIMIT_SHOTCALLER"
};
var SIEGE_ROLE_CONFIG_KEYS = {
  Builder: "SIEGE_LIMIT_BUILDER",
  Elephant: "SIEGE_LIMIT_ELEPHANT",
  Flag: "SIEGE_LIMIT_FLAG",
  FT: "SIEGE_LIMIT_FT",
  Hwacha: "SIEGE_LIMIT_HWACHA",
  Shai: "SIEGE_LIMIT_SHAI",
  Shotcaller: "SIEGE_LIMIT_SHOTCALLER",
  "Witch/Wizard": "SIEGE_LIMIT_WITCH_WIZARD"
};
var DEFAULT_SIEGE_ROLE_LIMITS = {
  Builder: 1,
  Elephant: 1,
  Flag: 1,
  FT: 3,
  Hwacha: 2,
  Shai: 5,
  Shotcaller: 1,
  "Witch/Wizard": 5
};
var DEFAULT_MAIN_BALL_LIMITS = {
  SUN: { "Tier 1": 20, "Tier 2": 35 },
  MON: { "Tier 1": 15, "Tier 2": 25 },
  TUE: { "Tier 1": 20, "Tier 2": 25 },
  WED: { "Tier 1": 15, "Tier 2": 25 },
  THU: { "Tier 1": 20, "Tier 2": 25 },
  FRI: { "Tier 1": 15, "Tier 2": 35 }
};
var MAIN_BALL_CONFIG_KEYS = {
  SUN: { "Tier 1": "MAINBALL_SUN_T1", "Tier 2": "MAINBALL_SUN_T2" },
  MON: { "Tier 1": "MAINBALL_MON_T1", "Tier 2": "MAINBALL_MON_T2" },
  TUE: { "Tier 1": "MAINBALL_TUE_T1", "Tier 2": "MAINBALL_TUE_T2" },
  WED: { "Tier 1": "MAINBALL_WED_T1", "Tier 2": "MAINBALL_WED_T2" },
  THU: { "Tier 1": "MAINBALL_THU_T1", "Tier 2": "MAINBALL_THU_T2" },
  FRI: { "Tier 1": "MAINBALL_FRI_T1", "Tier 2": "MAINBALL_FRI_T2" }
};
var OFFICIAL_TOTAL_PAX = {
  SUN: { "Tier 1": 30, "Tier 2": 50 },
  MON: { "Tier 1": 25, "Tier 2": 40 },
  TUE: { "Tier 1": 30, "Tier 2": 40 },
  WED: { "Tier 1": 25, "Tier 2": 40 },
  THU: { "Tier 1": 30, "Tier 2": 40 },
  FRI: { "Tier 1": 25, "Tier 2": 50 }
};

// server/utils.ts
function getLimits(targetDate) {
  const weekday = targetDate.getDay();
  const dayPrefix = DAY_KEYS[weekday] || "MON";
  const tier = CONFIG[`${dayPrefix}_TIER`] || "Tier 1";
  const limits = {};
  for (const [role, configKey] of Object.entries(ROLE_CONFIG_KEYS)) {
    const configured = parseInt(CONFIG[configKey], 10);
    limits[role] = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_ROLE_LIMITS[role];
  }
  const mainBallKey = MAIN_BALL_CONFIG_KEYS[dayPrefix]?.[tier] || "MAINBALL_MON_T1";
  const configuredMainBall = parseInt(CONFIG[mainBallKey], 10);
  limits["Main Ball"] = Number.isFinite(configuredMainBall) && configuredMainBall > 0 ? configuredMainBall : DEFAULT_MAIN_BALL_LIMITS[dayPrefix]?.[tier] || 20;
  const total = Object.values(limits).reduce((a, b) => a + b, 0);
  log("RSVP", `Squad limits compiled for ${dayPrefix} (${tier}) -> Total: ${total} slots.`);
  return limits;
}
function getSiegeLimits() {
  const limits = {};
  let remaining = 100;
  for (const [role, key] of Object.entries(SIEGE_ROLE_CONFIG_KEYS)) {
    const configured = parseInt(CONFIG[key], 10);
    const requested = Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_SIEGE_ROLE_LIMITS[role];
    limits[role] = Math.min(requested, remaining);
    remaining -= limits[role];
  }
  const specialRoleTotal = Object.values(limits).reduce((total2, value) => total2 + value, 0);
  const configuredTotal = parseInt(CONFIG.SIEGE_TOTAL_PAX, 10);
  const total = Number.isFinite(configuredTotal) ? Math.min(Math.max(configuredTotal, specialRoleTotal), 100) : 100;
  limits["Main Ball"] = total - specialRoleTotal;
  return limits;
}
function isAuthorized(member) {
  if (!member) return false;
  const authId = String(CONFIG.AUTHORIZED_ROLE_ID || "0");
  if (authId !== "0" && member.roles.cache.has(authId)) return true;
  return member.permissions.has(import_discord.PermissionsBitField.Flags.Administrator);
}
function configuredLimit(value, fallback) {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function getCapacityWarnings(config = CONFIG) {
  const specialRoleTotal = Object.entries(ROLE_CONFIG_KEYS).reduce(
    (total, [role, key]) => total + configuredLimit(config[key], DEFAULT_ROLE_LIMITS[role]),
    0
  );
  return Object.entries(OFFICIAL_TOTAL_PAX).flatMap(([day, totals]) => {
    const tier = config[`${day}_TIER`] === "Tier 2" ? "Tier 2" : "Tier 1";
    const mainBallKey = MAIN_BALL_CONFIG_KEYS[day]?.[tier];
    const mainBall = configuredLimit(config[mainBallKey], DEFAULT_MAIN_BALL_LIMITS[day]?.[tier] || 20);
    const expected = totals[tier];
    const actual = specialRoleTotal + mainBall;
    if (actual <= expected) return [];
    return [{ day, tier, expected, actual, difference: actual - expected }];
  });
}

// server/bot.ts
var import_discord3 = require("discord.js");
var import_moment_timezone3 = __toESM(require("moment-timezone"), 1);
var import_fs3 = __toESM(require("fs"), 1);

// server/rsvpSession.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_moment_timezone2 = __toESM(require("moment-timezone"), 1);
var import_discord2 = require("discord.js");

// server/events.ts
var import_events = require("events");
var sessionEvents = new import_events.EventEmitter();
sessionEvents.setMaxListeners(100);
function notifySessionUpdate(sessionType) {
  sessionEvents.emit("session_update", { sessionType, timestamp: Date.now() });
}

// server/rsvpSession.ts
var RSVPSession = class {
  constructor(client2, limits, targetDate, options = {}) {
    this._updateTimer = null;
    this._updatePending = false;
    this._updateInFlight = false;
    this.client = client2;
    this.limits = limits;
    this.targetDate = targetDate;
    this.dataFile = options.dataFile || DATA_FILE;
    this.title = options.title || "Node War RSVP";
    this.sessionType = options.sessionType || "node";
    this.messagePrefix = options.messagePrefix || "";
    this.roleButtons = options.roleButtons || ROLE_BUTTONS;
    this.data = {};
    this.waitlist = {};
    this.memberData = {};
    this.memberWaitlist = {};
    for (const role of Object.keys(limits)) {
      this.data[role] = [];
      this.waitlist[role] = [];
      this.memberData[role] = [];
      this.memberWaitlist[role] = [];
    }
    this.isClosed = false;
    this._updateRunning = false;
  }
  messageKey(name) {
    return this.messagePrefix ? `${this.messagePrefix}${name[0].toUpperCase()}${name.slice(1)}` : name;
  }
  saveState() {
    try {
      import_fs2.default.writeFileSync(
        this.dataFile,
        JSON.stringify(
          {
            target_date: (0, import_moment_timezone2.default)(this.targetDate).format("YYYY-MM-DD"),
            is_closed: this.isClosed,
            data: this.data,
            waitlist: this.waitlist,
            member_data: this.memberData,
            member_waitlist: this.memberWaitlist,
            session_type: this.sessionType,
            main_msg_id: this.client?.[this.messageKey("mainMsgId")] || null,
            waitlist_msg_id: this.client?.[this.messageKey("waitlistMsgId")] || null
          },
          null,
          4
        )
      );
      notifySessionUpdate(this.sessionType);
    } catch (err) {
      log("ERROR", `Failed to save state to ${this.dataFile}: ${err}`);
    }
  }
  buildEmbeds() {
    const color = this.isClosed ? 15548997 : 5793266;
    const weekday = this.targetDate.getDay();
    const dayPrefix = DAY_KEYS[weekday] || "MON";
    const tier = CONFIG[`${dayPrefix}_TIER`] || "Tier 1";
    const totalSlots = Object.values(this.limits).reduce((a, b) => a + b, 0);
    const mainEmb = new import_discord2.EmbedBuilder().setTitle(`${this.title}${this.sessionType === "node" ? ` - ${tier}` : ""} (${totalSlots} Slot)`).setDescription(
      `**Event Date:** ${(0, import_moment_timezone2.default)(this.targetDate).format("dddd, DD-MM-YYYY")}
` + (this.isClosed ? "\u274C CLOSED" : "Click buttons to join!")
    ).setColor(color);
    for (const [role, users] of Object.entries(this.data)) {
      const limit = this.limits[role] ?? 0;
      if (!users.length) {
        mainEmb.addFields({
          name: `${formatDiscordRoleEmoji(role)} ${role} (0/${limit})`,
          value: "-",
          inline: true
        });
        continue;
      }
      const userChunks = [];
      let currentChunk = [];
      let currentLen = 0;
      for (const u of users) {
        const line = `\u2022 ${u}`;
        if (currentChunk.length > 0 && currentLen + line.length + 1 > 900) {
          userChunks.push(currentChunk);
          currentChunk = [line];
          currentLen = line.length;
        } else {
          currentChunk.push(line);
          currentLen += line.length + 1;
        }
      }
      if (currentChunk.length > 0) {
        userChunks.push(currentChunk);
      }
      userChunks.forEach((chunk, chunkIdx) => {
        const fieldName = chunkIdx === 0 ? `${formatDiscordRoleEmoji(role)} ${role} (${users.length}/${limit})` : `${formatDiscordRoleEmoji(role)} ${role} (Cont. ${chunkIdx + 1})`;
        mainEmb.addFields({
          name: fieldName,
          value: chunk.join("\n"),
          inline: true
        });
      });
    }
    const totalReg = Object.values(this.data).reduce((a, arr) => a + arr.length, 0);
    mainEmb.addFields({
      name: "\u{1F4CA} Summary",
      value: `**Total Registered: ${totalReg}/${totalSlots}**`,
      inline: false
    });
    const anyWaitlist = Object.values(this.waitlist).some((arr) => arr.length);
    const waitEmb = new import_discord2.EmbedBuilder().setTitle("\u{1F4CB} Waitlist / Backups").setColor(16426522);
    if (anyWaitlist) {
      waitEmb.setDescription("Players currently in backup queue:");
    } else {
      waitEmb.setDescription("No backups currently in queue.");
    }
    for (const [role, users] of Object.entries(this.waitlist)) {
      if (!users.length) continue;
      const userChunks = [];
      let currentChunk = [];
      let currentLen = 0;
      for (const u of users) {
        const line = `\u2022 ${u}`;
        if (currentChunk.length > 0 && currentLen + line.length + 1 > 900) {
          userChunks.push(currentChunk);
          currentChunk = [line];
          currentLen = line.length;
        } else {
          currentChunk.push(line);
          currentLen += line.length + 1;
        }
      }
      if (currentChunk.length > 0) {
        userChunks.push(currentChunk);
      }
      userChunks.forEach((chunk, chunkIdx) => {
        const fieldName = chunkIdx === 0 ? `${formatDiscordRoleEmoji(role)} ${role} Backups (${users.length})` : `${formatDiscordRoleEmoji(role)} ${role} Backups (Cont. ${chunkIdx + 1})`;
        waitEmb.addFields({
          name: fieldName,
          value: chunk.join("\n"),
          inline: true
        });
      });
    }
    return { mainEmb, waitEmb };
  }
  buildComponents() {
    const buttons = this.roleButtons.map((b) => {
      const btn = new import_discord2.ButtonBuilder().setCustomId(b.customId).setLabel(b.role).setStyle(import_discord2.ButtonStyle.Primary).setDisabled(this.isClosed);
      const emojiVal = b.emoji || ROLE_EMOJIS[b.role];
      if (emojiVal) {
        const trimmed = typeof emojiVal === "string" ? emojiVal.trim() : emojiVal.id || "";
        if (/^\d+$/.test(trimmed)) {
          btn.setEmoji({ id: trimmed });
        } else {
          btn.setEmoji(emojiVal);
        }
      }
      return btn;
    });
    buttons.push(
      new import_discord2.ButtonBuilder().setCustomId("rsvp_cancel").setLabel("Cancel").setEmoji("\u274C").setStyle(import_discord2.ButtonStyle.Secondary).setDisabled(this.isClosed)
    );
    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new import_discord2.ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }
    return rows;
  }
  triggerDiscordUpdate(delayMs = 100) {
    this._updatePending = true;
    if (this._updateTimer) clearTimeout(this._updateTimer);
    this._updateTimer = setTimeout(() => {
      this._updateTimer = null;
      this._flushDiscordUpdate().catch(() => {
      });
    }, delayMs);
  }
  async _flushDiscordUpdate() {
    if (this._updateInFlight) {
      return;
    }
    this._updateInFlight = true;
    this._updatePending = false;
    try {
      if (!this.client?.isReady || !this.client.isReady()) {
        this.saveState();
        return;
      }
      const { mainEmb, waitEmb } = this.buildEmbeds();
      const channelId = String(
        this.sessionType === "siege" ? CONFIG.SIEGE_CHANNEL_ID || "0" : CONFIG.CHANNEL_ID || "0"
      );
      if (channelId !== "0") {
        const ch = this.client.channels.cache.get(channelId) || await this.client.channels.fetch(channelId).catch(() => null);
        if (ch && ch.isTextBased()) {
          const mainMsgKey = this.messageKey("mainMsg");
          const mainMsgIdKey = this.messageKey("mainMsgId");
          const waitlistMsgKey = this.messageKey("waitlistMsg");
          const waitlistMsgIdKey = this.messageKey("waitlistMsgId");
          if (!this.client[mainMsgKey] && this.client[mainMsgIdKey]) {
            this.client[mainMsgKey] = ch.messages.cache.get(this.client[mainMsgIdKey]) || await ch.messages.fetch(this.client[mainMsgIdKey]).catch((e) => {
              log("WARN", `Could not fetch main message ${this.client[mainMsgIdKey]}: ${e?.message || e}`);
              return null;
            });
          }
          if (!this.client[waitlistMsgKey] && this.client[waitlistMsgIdKey]) {
            this.client[waitlistMsgKey] = ch.messages.cache.get(this.client[waitlistMsgIdKey]) || await ch.messages.fetch(this.client[waitlistMsgIdKey]).catch((e) => {
              log("WARN", `Could not fetch waitlist message ${this.client[waitlistMsgIdKey]}: ${e?.message || e}`);
              return null;
            });
          }
        }
      }
      const mainMsg = this.client[this.messageKey("mainMsg")];
      const waitlistMsg = this.client[this.messageKey("waitlistMsg")];
      const edits = [];
      if (mainMsg) {
        edits.push(
          mainMsg.edit({ embeds: [mainEmb], components: this.buildComponents() }).catch((err) => {
            log("ERROR", `Failed to edit main message: ${err?.message || err}`);
            if (err?.code === 10008) {
              this.client[this.messageKey("mainMsg")] = null;
              this.client[this.messageKey("mainMsgId")] = null;
            }
          })
        );
      }
      if (waitlistMsg) {
        edits.push(
          waitlistMsg.edit({ embeds: [waitEmb] }).catch((err) => {
            log("ERROR", `Failed to edit waitlist message: ${err?.message || err}`);
            if (err?.code === 10008) {
              this.client[this.messageKey("waitlistMsg")] = null;
              this.client[this.messageKey("waitlistMsgId")] = null;
            }
          })
        );
      }
      if (edits.length > 0) {
        await Promise.all(edits);
      }
      this.saveState();
      log("SUCCESS", `RSVP Embeds updated on Discord for ${this.sessionType}.`);
    } catch (e) {
      log("ERROR", `Batch update failed: ${e}`);
    } finally {
      this._updateInFlight = false;
      if (this._updatePending) {
        this.triggerDiscordUpdate(100);
      }
    }
  }
  async batchUpdateDiscord() {
    this.triggerDiscordUpdate(50);
  }
  findMemberIndex(roleList = [], memberList = [], userId = "", name = "") {
    if (!roleList || !roleList.length) return -1;
    const cleanUserId = String(userId || "").trim();
    const cleanName = String(name || "").toLowerCase().trim();
    if (cleanUserId && memberList?.length) {
      const idIdx = memberList.findIndex((m) => m && String(m.id).trim() === cleanUserId);
      if (idIdx !== -1) return idIdx;
    }
    if (cleanName) {
      const nameIdx = roleList.findIndex((savedName, idx) => {
        const lowerSaved = String(savedName || "").toLowerCase().trim();
        const savedMemberName = String(memberList?.[idx]?.name || "").toLowerCase().trim();
        return lowerSaved === cleanName || savedMemberName === cleanName || cleanName.length >= 3 && (lowerSaved.endsWith(cleanName) || cleanName.endsWith(lowerSaved));
      });
      if (nameIdx !== -1) return nameIdx;
    }
    return -1;
  }
  promoteWaitlist(specificRole) {
    const rolesToCheck = specificRole ? [specificRole] : Object.keys(this.limits);
    const promotedNames = [];
    for (const r of rolesToCheck) {
      const limit = this.limits[r] || 0;
      if (!this.data[r]) this.data[r] = [];
      if (!this.memberData[r]) this.memberData[r] = [];
      if (!this.waitlist[r]) this.waitlist[r] = [];
      if (!this.memberWaitlist[r]) this.memberWaitlist[r] = [];
      while (this.data[r].length < limit && this.waitlist[r].length > 0) {
        const nextUser = this.waitlist[r].shift();
        let nextMember = this.memberWaitlist[r]?.length > 0 ? this.memberWaitlist[r].shift() : null;
        if (!nextMember || !nextMember.name) {
          nextMember = {
            id: `promoted-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: nextUser
          };
        }
        this.data[r].push(nextUser);
        this.memberData[r].push(nextMember);
        promotedNames.push(nextUser);
        log(
          "SUCCESS",
          `[${this.sessionType.toUpperCase()}] Promoted ${nextUser} from ${r} waitlist into roster (${this.data[r].length}/${limit})`
        );
      }
    }
    if (promotedNames.length > 0) {
      this.saveState();
      this.triggerDiscordUpdate(100);
    }
    return promotedNames;
  }
  async processRoleSelection(interaction, role) {
    if (this.isClosed) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "\u{1F512} This RSVP is currently closed.",
          flags: import_discord2.MessageFlags.Ephemeral
        }).catch(() => {
        });
      } else {
        await interaction.followUp({
          content: "\u{1F512} This RSVP is currently closed.",
          flags: import_discord2.MessageFlags.Ephemeral
        }).catch(() => {
        });
      }
      return;
    }
    const userId = interaction.user.id;
    const displayName = interaction.member?.displayName || interaction.user.username;
    const member = { id: userId, name: displayName };
    if (role !== "Cancel") {
      const currentRoleIdx = this.findMemberIndex(
        this.data[role] || [],
        this.memberData[role] || [],
        userId,
        displayName
      );
      if (currentRoleIdx !== -1) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `\u2139\uFE0F You are already registered for **${role}**!`,
            flags: import_discord2.MessageFlags.Ephemeral
          }).catch(() => {
          });
        } else {
          await interaction.followUp({
            content: `\u2139\uFE0F You are already registered for **${role}**!`,
            flags: import_discord2.MessageFlags.Ephemeral
          }).catch(() => {
          });
        }
        return;
      }
      const currentWaitIdx = this.findMemberIndex(
        this.waitlist[role] || [],
        this.memberWaitlist[role] || [],
        userId,
        displayName
      );
      if (currentWaitIdx !== -1) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `\u2139\uFE0F You are already on the **${role}** waitlist (Position #${currentWaitIdx + 1}).`,
            flags: import_discord2.MessageFlags.Ephemeral
          }).catch(() => {
          });
        } else {
          await interaction.followUp({
            content: `\u2139\uFE0F You are already on the **${role}** waitlist (Position #${currentWaitIdx + 1}).`,
            flags: import_discord2.MessageFlags.Ephemeral
          }).catch(() => {
          });
        }
        return;
      }
    }
    let removedFromRole = null;
    let wasWaitlisted = false;
    let waitlistPromoted = false;
    for (const r of Object.keys(this.limits)) {
      const idx = this.findMemberIndex(
        this.data[r] || [],
        this.memberData[r] || [],
        userId,
        displayName
      );
      if (idx !== -1) {
        this.data[r].splice(idx, 1);
        if (this.memberData[r]?.length > idx) {
          this.memberData[r].splice(idx, 1);
        }
        removedFromRole = r;
        wasWaitlisted = false;
        const promoted = this.promoteWaitlist(r);
        if (promoted.length > 0) {
          waitlistPromoted = true;
        }
      }
      const wIdx = this.findMemberIndex(
        this.waitlist[r] || [],
        this.memberWaitlist[r] || [],
        userId,
        displayName
      );
      if (wIdx !== -1) {
        this.waitlist[r].splice(wIdx, 1);
        if (this.memberWaitlist[r]?.length > wIdx) {
          this.memberWaitlist[r].splice(wIdx, 1);
        }
        removedFromRole = r;
        wasWaitlisted = true;
      }
    }
    let feedback = "";
    if (role === "Cancel") {
      if (removedFromRole) {
        if (wasWaitlisted) {
          feedback = `\u274C You have been removed from the **${removedFromRole}** waitlist.`;
        } else {
          feedback = `\u274C You have cancelled your registration for **${removedFromRole}**.`;
        }
      } else {
        feedback = "\u2139\uFE0F You are not currently registered for any role.";
      }
    } else {
      const limit = this.limits[role] || 0;
      if (!this.data[role]) this.data[role] = [];
      if (!this.memberData[role]) this.memberData[role] = [];
      if (!this.waitlist[role]) this.waitlist[role] = [];
      if (!this.memberWaitlist[role]) this.memberWaitlist[role] = [];
      if (this.data[role].length < limit) {
        this.data[role].push(displayName);
        this.memberData[role].push(member);
        feedback = `\u2705 You have successfully registered for **${role}**! (${this.data[role].length}/${limit})`;
      } else {
        this.waitlist[role].push(displayName);
        this.memberWaitlist[role].push(member);
        const position = this.waitlist[role].length;
        feedback = `\u26A0\uFE0F **${role}** is currently full (${this.data[role].length}/${limit}). You have been placed on the **Waitlist** (Position #${position}). If a slot opens up, you will automatically be promoted!`;
      }
    }
    this.client[this.messageKey("mainMsg")] = interaction.message;
    this.client[this.messageKey("mainMsgId")] = interaction.message.id;
    this.saveState();
    const { mainEmb } = this.buildEmbeds();
    const components = this.buildComponents();
    let updatedViaInteraction = false;
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.update({ embeds: [mainEmb], components });
        updatedViaInteraction = true;
      } catch (updateErr) {
        log("WARN", `Fast-path interaction.update failed: ${updateErr}`);
      }
    }
    if (feedback) {
      try {
        if (updatedViaInteraction || interaction.deferred) {
          await interaction.followUp({ content: feedback, flags: import_discord2.MessageFlags.Ephemeral });
        } else if (!interaction.replied) {
          await interaction.reply({ content: feedback, flags: import_discord2.MessageFlags.Ephemeral });
        }
      } catch {
      }
    }
    if (!updatedViaInteraction || waitlistPromoted || this.client[this.messageKey("waitlistMsgId")]) {
      this.triggerDiscordUpdate(50);
    }
  }
  // Programmatic assignment from Web UI
  assignMember(role, name, id = `web-${Date.now()}`) {
    if (this.isClosed) return { success: false, message: "Session is closed" };
    const member = { id, name: name.trim() };
    const user = member.name;
    for (const r of Object.keys(this.limits)) {
      const idx = this.findMemberIndex(this.data[r] || [], this.memberData[r] || [], member.id, user);
      if (idx !== -1) {
        this.data[r].splice(idx, 1);
        if (this.memberData[r]?.length > idx) {
          this.memberData[r].splice(idx, 1);
        }
        this.promoteWaitlist(r);
      }
      const wIdx = this.findMemberIndex(this.waitlist[r] || [], this.memberWaitlist[r] || [], member.id, user);
      if (wIdx !== -1) {
        this.waitlist[r].splice(wIdx, 1);
        if (this.memberWaitlist[r]?.length > wIdx) {
          this.memberWaitlist[r].splice(wIdx, 1);
        }
      }
    }
    if (role === "Cancel") {
      this.saveState();
      this.triggerDiscordUpdate(100);
      return { success: true, message: `Removed ${user}` };
    }
    if (!this.limits[role] && this.limits[role] !== 0) {
      return { success: false, message: `Invalid role ${role}` };
    }
    let status = "roster";
    if (this.data[role].length < this.limits[role]) {
      this.data[role].push(user);
      this.memberData[role].push(member);
    } else {
      this.waitlist[role].push(user);
      this.memberWaitlist[role].push(member);
      status = "waitlist";
    }
    this.saveState();
    this.triggerDiscordUpdate(100);
    return { success: true, status, message: `${user} added to ${role} (${status})` };
  }
  removeMember(nameOrId) {
    let removed = false;
    for (const r of Object.keys(this.limits)) {
      const idx = this.findMemberIndex(this.data[r] || [], this.memberData[r] || [], nameOrId, nameOrId);
      if (idx !== -1) {
        this.data[r].splice(idx, 1);
        if (this.memberData[r]?.length > idx) {
          this.memberData[r].splice(idx, 1);
        }
        this.promoteWaitlist(r);
        removed = true;
      }
      const wIdx = this.findMemberIndex(this.waitlist[r] || [], this.memberWaitlist[r] || [], nameOrId, nameOrId);
      if (wIdx !== -1) {
        this.waitlist[r].splice(wIdx, 1);
        if (this.memberWaitlist[r]?.length > wIdx) {
          this.memberWaitlist[r].splice(wIdx, 1);
        }
        removed = true;
      }
    }
    if (removed) {
      this.saveState();
      this.triggerDiscordUpdate(100);
    }
    return removed;
  }
};

// server/bot.ts
var client = new import_discord3.Client({
  intents: [
    import_discord3.GatewayIntentBits.Guilds,
    import_discord3.GatewayIntentBits.GuildMembers,
    import_discord3.GatewayIntentBits.GuildMessages,
    import_discord3.GatewayIntentBits.MessageContent
  ],
  sweepers: {
    messages: {
      interval: 300,
      lifetime: 900
    }
  },
  rest: {
    timeout: 15e3
  }
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
var lastPostDate = null;
var voteReminderSent = /* @__PURE__ */ new Set();
function messageKey(prefix, name) {
  return prefix ? `${prefix}${name[0].toUpperCase()}${name.slice(1)}` : name;
}
var SLASH_COMMANDS = [
  new import_discord3.SlashCommandBuilder().setName("open-node-war").setDescription("Open a Node War RSVP now"),
  new import_discord3.SlashCommandBuilder().setName("close-rsvp").setDescription("Close the current Node War RSVP"),
  new import_discord3.SlashCommandBuilder().setName("open-siege").setDescription("Open a Siege War RSVP in the configured channel")
].map((command) => command.toJSON());
async function registerSlashCommands(token) {
  const activeToken = token || process.env.DISCORD_TOKEN;
  if (!activeToken || !CONFIG.SERVER_ID || !client.user?.id) return false;
  try {
    const rest = new import_discord3.REST({ version: "10" }).setToken(activeToken);
    await rest.put(import_discord3.Routes.applicationGuildCommands(client.user.id, String(CONFIG.SERVER_ID)), {
      body: SLASH_COMMANDS
    });
    log("INFO", "Slash commands registered for this server.");
    return true;
  } catch (err) {
    log("ERROR", `Could not register slash commands: ${err}`);
    return false;
  }
}
function restoreState(dataFile = DATA_FILE, sessionKey = "currentSession", messagePrefix = "") {
  if (!import_fs3.default.existsSync(dataFile)) return null;
  try {
    const state = JSON.parse(import_fs3.default.readFileSync(dataFile, "utf8"));
    const targetDate = import_moment_timezone3.default.tz(state.target_date, JAKARTA_TZ).toDate();
    const session = new RSVPSession(
      client,
      state.session_type === "siege" ? getSiegeLimits() : getLimits(targetDate),
      targetDate,
      {
        dataFile,
        title: state.session_type === "siege" ? "Siege War RSVP" : "Node War RSVP",
        sessionType: state.session_type || "node",
        messagePrefix,
        roleButtons: state.session_type === "siege" ? SIEGE_ROLE_BUTTONS : void 0
      }
    );
    for (const role of Object.keys(session.limits)) {
      if (state.data?.[role]) session.data[role] = state.data[role];
      if (state.waitlist?.[role]) session.waitlist[role] = state.waitlist[role];
      if (state.member_data?.[role]) session.memberData[role] = state.member_data[role];
      if (state.member_waitlist?.[role]) session.memberWaitlist[role] = state.member_waitlist[role];
    }
    session.isClosed = state.is_closed || false;
    client[messageKey(messagePrefix, "mainMsgId")] = state.main_msg_id || null;
    client[messageKey(messagePrefix, "waitlistMsgId")] = state.waitlist_msg_id || null;
    client[sessionKey] = session;
    log("INFO", `Saved ${session.sessionType} state restored for ${state.target_date}`);
    return session;
  } catch (e) {
    log("ERROR", `Error restoring state from ${dataFile}: ${e}`);
    return null;
  }
}
function getBenchHistory() {
  if (!import_fs3.default.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(import_fs3.default.readFileSync(HISTORY_FILE, "utf8"));
  } catch {
    return [];
  }
}
function recordBenchHistory(session) {
  const history = getBenchHistory();
  const dateStr = (0, import_moment_timezone3.default)(session.targetDate).format("YYYY-MM-DD");
  if (history.some((entry) => entry.date === dateStr)) return;
  const users = Object.values(session.memberWaitlist).flat().filter((member) => member?.id);
  history.push({ date: dateStr, users });
  try {
    import_fs3.default.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(-10), null, 2));
  } catch (err) {
    log("ERROR", `Error recording bench history: ${err}`);
  }
}
function getPriorityBenchUsers() {
  const recent = getBenchHistory().slice(-3);
  if (recent.length < 3) return [];
  const everyDay = recent.reduce((ids, entry) => {
    const today = new Map(entry.users.map((member) => [member.id, member]));
    return ids.filter((member) => today.has(member.id)).map((member) => today.get(member.id));
  }, recent[0].users || []);
  return [...new Map(everyDay.map((member) => [member.id, member])).values()].slice(0, 5);
}
async function postRSVP() {
  const now = (0, import_moment_timezone3.default)().tz(JAKARTA_TZ);
  const targetDate = (now.hour() >= 21 ? now.clone().add(1, "day") : now.clone()).toDate();
  const session = new RSVPSession(client, getLimits(targetDate), targetDate);
  const priorityUsers = getPriorityBenchUsers();
  for (const member of priorityUsers) {
    if (session.data["Main Ball"].length >= session.limits["Main Ball"]) break;
    session.data["Main Ball"].push(member.name);
    session.memberData["Main Ball"].push(member);
  }
  client.currentSession = session;
  if (client.isReady && client.isReady()) {
    if (client.mainMsg) {
      await client.mainMsg.edit({ components: [] }).catch(() => {
      });
    }
    const ch = await client.channels.fetch(String(CONFIG.CHANNEL_ID || "0")).catch(() => null);
    if (ch && ch.isTextBased()) {
      const { mainEmb, waitEmb } = session.buildEmbeds();
      const mainMsg = await ch.send({
        content: `@everyone Node War Open!${priorityUsers.length ? `
\u2B50 Priority Main Ball: ${priorityUsers.map((member) => `<@${member.id}>`).join(", ")}` : ""}`,
        allowedMentions: { parse: ["everyone", "users"] },
        embeds: [mainEmb],
        components: session.buildComponents()
      });
      const waitlistMsg = await ch.send({ embeds: [waitEmb] });
      client.mainMsg = mainMsg;
      client.waitlistMsg = waitlistMsg;
      client.mainMsgId = mainMsg.id;
      client.waitlistMsgId = waitlistMsg.id;
    }
  }
  session.saveState();
  log("RSVP", `Node War RSVP opened for ${(0, import_moment_timezone3.default)(targetDate).format("YYYY-MM-DD")}`);
  return true;
}
async function postSiege() {
  const targetDate = (0, import_moment_timezone3.default)().tz(JAKARTA_TZ).toDate();
  const session = new RSVPSession(client, getSiegeLimits(), targetDate, {
    dataFile: SIEGE_DATA_FILE,
    title: "Siege War RSVP",
    sessionType: "siege",
    messagePrefix: "siege",
    roleButtons: SIEGE_ROLE_BUTTONS
  });
  client.siegeSession = session;
  if (client.isReady && client.isReady()) {
    if (client.siegeMainMsg) {
      await client.siegeMainMsg.edit({ components: [] }).catch(() => {
      });
    }
    const channel = await client.channels.fetch(String(CONFIG.SIEGE_CHANNEL_ID || "0")).catch(() => null);
    if (channel && channel.isTextBased()) {
      const { mainEmb, waitEmb } = session.buildEmbeds();
      const mainMsg = await channel.send({
        content: "@everyone Siege War Open!",
        allowedMentions: { parse: ["everyone"] },
        embeds: [mainEmb],
        components: session.buildComponents()
      });
      const waitlistMsg = await channel.send({ embeds: [waitEmb] });
      client.siegeMainMsg = mainMsg;
      client.siegeWaitlistMsg = waitlistMsg;
      client.siegeMainMsgId = mainMsg.id;
      client.siegeWaitlistMsgId = waitlistMsg.id;
    }
  }
  session.saveState();
  log("SIEGE", `Siege War RSVP opened for ${(0, import_moment_timezone3.default)(targetDate).format("YYYY-MM-DD")}`);
  return true;
}
async function closeRSVP(logChannelOverride = null) {
  const session = client.currentSession;
  if (!session) return false;
  session.isClosed = true;
  recordBenchHistory(session);
  try {
    if (client.isReady && client.isReady()) {
      if (!client.mainMsg && client.mainMsgId) {
        const ch = await client.channels.fetch(String(CONFIG.CHANNEL_ID || "0")).catch(() => null);
        if (ch && ch.isTextBased()) {
          client.mainMsg = await ch.messages.fetch(client.mainMsgId).catch(() => null);
        }
      }
      const { mainEmb } = session.buildEmbeds();
      if (client.mainMsg) {
        await client.mainMsg.edit({
          content: "\u{1F512} CLOSED",
          embeds: [mainEmb],
          components: session.buildComponents()
        });
      }
      const logCh = logChannelOverride || await client.channels.fetch(String(CONFIG.LOG_CHANNEL_ID || "0")).catch(() => null);
      if (logCh && logCh.isTextBased()) {
        const fn = `node${(0, import_moment_timezone3.default)(session.targetDate).format("YYMMDD")}.json`;
        await logCh.send({
          content: `\u{1F4BE} Backup: \`${fn}\``,
          files: [new import_discord3.AttachmentBuilder(DATA_FILE, { name: fn })]
        });
      }
    }
    session.saveState();
    log("RSVP", "Node War RSVP closed.");
  } catch (e) {
    log("ERROR", `Close RSVP failed: ${e}`);
  }
  return true;
}
async function closeSiege() {
  const session = client.siegeSession;
  if (!session) return false;
  session.isClosed = true;
  try {
    if (client.isReady && client.isReady()) {
      if (!client.siegeMainMsg && client.siegeMainMsgId) {
        const ch = await client.channels.fetch(String(CONFIG.SIEGE_CHANNEL_ID || "0")).catch(() => null);
        if (ch && ch.isTextBased()) {
          client.siegeMainMsg = await ch.messages.fetch(client.siegeMainMsgId).catch(() => null);
        }
      }
      const { mainEmb } = session.buildEmbeds();
      if (client.siegeMainMsg) {
        await client.siegeMainMsg.edit({
          content: "\u{1F512} CLOSED",
          embeds: [mainEmb],
          components: session.buildComponents()
        });
      }
    }
    session.saveState();
    log("SIEGE", "Siege War RSVP closed.");
  } catch (e) {
    log("ERROR", `Close Siege failed: ${e}`);
  }
  return true;
}
async function sendVoteReminder(customMessage) {
  if (!client.isReady || !client.isReady()) {
    log("WARN", "Discord client not ready. Reminder skipped.");
    return { success: false, reason: "Discord bot client is not connected" };
  }
  const session = client.currentSession;
  if (!session) {
    log("REMINDER", "No Node War session loaded. Reminder skipped.");
    return { success: false, reason: "No Node War session is currently active" };
  }
  if (session.isClosed) {
    log("REMINDER", "Node War session is already closed. Reminder skipped.");
    return { success: false, reason: "Node War session is closed for today" };
  }
  const channelId = CONFIG.CHANNEL_ID;
  const channel = await client.channels.fetch(String(channelId || "0")).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    log("ERROR", `Cannot send reminder: channel ${channelId} not found or not text-based.`);
    return { success: false, reason: `Node War channel ${channelId} not found` };
  }
  const registeredUserIds = /* @__PURE__ */ new Set();
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
  const dayKey = { 0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" }[session.targetDate.getDay()] || "SUN";
  const dayNames = {
    SUN: "Sunday",
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THU: "Thursday",
    FRI: "Friday",
    SAT: "Saturday"
  };
  const tier = CONFIG[`${dayKey}_TIER`] === "Tier 1" ? "Tier 1" : "Tier 2";
  const defaultTarget = tier === "Tier 2" ? "Calpheon or Ulukita" : "Balenos or Serendia";
  const configuredTarget = CONFIG[`${dayKey}_VOTE_TARGET`]?.trim();
  const target = configuredTarget || defaultTarget;
  const rawTemplate = customMessage?.trim() || CONFIG.NW_REMINDER_MESSAGE?.trim() || "\u26A0\uFE0F **Node War In-Game Vote Reminder**\nPlease **YES UP** on **{target}** for **{tier}**!\nMake sure to submit your vote in-game before the deadline.";
  const formattedMessage = rawTemplate.replace(/\{target\}/gi, target).replace(/\{tier\}/gi, tier).replace(/\{date\}/gi, (0, import_moment_timezone3.default)(session.targetDate).format("YYYY-MM-DD")).replace(/\{day\}/gi, dayNames[dayKey] || dayKey).replace(/\{count\}/gi, String(registeredUserIds.size));
  const userIdsList = Array.from(registeredUserIds);
  if (userIdsList.length === 0) {
    await channel.send({
      content: `\u{1F514} **Node War In-Game Vote Reminder**
${formattedMessage}

*(Notice: No Node War participants currently registered on the roster).*`,
      allowedMentions: { parse: [] }
      // STRICT: NO @everyone, NO roles
    });
    log("REMINDER", `Node War reminder sent (0 registered participants). Target: ${target} (${tier})`);
    return {
      success: true,
      count: 0,
      target,
      tier,
      message: `Reminder sent to Node War channel (0 participants currently registered)`
    };
  }
  const mentions = userIdsList.map((id) => `<@${id}>`);
  const chunkSize = 40;
  for (let i = 0; i < mentions.length; i += chunkSize) {
    const chunkMentions = mentions.slice(i, i + chunkSize);
    const chunkIds = userIdsList.slice(i, i + chunkSize);
    let content = "";
    if (i === 0) {
      content = `\u{1F514} **Node War In-Game Vote Reminder**
${formattedMessage}

**Node War Participants (${userIdsList.length}):**
${chunkMentions.join(" ")}`;
    } else {
      content = `**Node War Participants (Continued):**
${chunkMentions.join(" ")}`;
    }
    await channel.send({
      content,
      allowedMentions: {
        users: chunkIds,
        // ONLY ping these registered users
        roles: [],
        // NEVER ping roles
        parse: []
        // NEVER parse @everyone or @here
      }
    });
  }
  log(
    "REMINDER",
    `Node War vote reminder pinged ${userIdsList.length} registered participant(s) for ${target} (${tier}).`
  );
  return {
    success: true,
    count: userIdsList.length,
    target,
    tier,
    message: `Reminder sent! Pinged ${userIdsList.length} registered Node War participant(s).`
  };
}
var schedulerTimer = null;
function startScheduler() {
  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = setInterval(async () => {
    const now = (0, import_moment_timezone3.default)().tz(JAKARTA_TZ);
    const today = now.format("YYYY-MM-DD");
    const isOpeningTime = now.hour() * 60 + now.minute() >= 21 * 60 + 30;
    if (isOpeningTime && lastPostDate !== today) {
      lastPostDate = now.format("YYYY-MM-DD");
      if (now.day() === 5) {
        if (client.isReady && client.isReady()) {
          const ch = await client.channels.fetch(String(CONFIG.CHANNEL_ID || "0")).catch(() => null);
          if (ch && ch.isTextBased()) {
            await ch.send(
              `No Node War bot reservation today, stand by for free medals at siege time <@&${CONFIG.ALLIANCE_ROLE_ID || "0"}>`
            );
          }
        }
      } else if (!client.currentSession || client.currentSession.isClosed) {
        await postRSVP();
      }
    } else if (now.hour() === 20 && now.minute() === 0) {
      await closeRSVP();
    }
    if (now.hour() === 17 || now.hour() === 19) {
      const reminderKey = `${now.format("YYYY-MM-DD")}-${now.hour()}`;
      if (!voteReminderSent.has(reminderKey)) {
        voteReminderSent.add(reminderKey);
        log("REMINDER", `Triggering automated ${now.hour()}:00 GMT+7 Node War vote reminder...`);
        await sendVoteReminder();
      }
    }
  }, 60 * 1e3);
}
client.once(import_discord3.Events.ClientReady, async () => {
  log("INFO", `Discord Bot logged in as ${client.user?.tag}`);
  registerSlashCommands().catch((error) => log("ERROR", `Could not register slash commands: ${error}`));
  restoreState();
  restoreState(SIEGE_DATA_FILE, "siegeSession", "siege");
  startScheduler();
  syncFromDiscord().catch((e) => log("WARN", `Auto-sync on ready error: ${e?.message || e}`));
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
  } catch (e) {
    log("WARN", `Could not pre-fetch messages on ready: ${e}`);
  }
});
client.on(import_discord3.Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (!isAuthorized(interaction.member)) {
        await interaction.reply({ content: "\u{1F6AB} Unauthorized.", flags: import_discord3.MessageFlags.Ephemeral });
        return;
      }
      await interaction.deferReply({ flags: import_discord3.MessageFlags.Ephemeral });
      if (interaction.commandName === "open-node-war") {
        const opened = await postRSVP();
        await interaction.editReply(opened ? "\u2705 Node War RSVP opened." : "\u26A0\uFE0F Failed to open Node War.");
      } else if (interaction.commandName === "close-rsvp") {
        await closeRSVP();
        await interaction.editReply("\u2705 Node War RSVP closed.");
      } else if (interaction.commandName === "open-siege") {
        const opened = await postSiege();
        await interaction.editReply(opened ? "\u2705 Siege War RSVP opened." : "\u26A0\uFE0F Failed to open Siege War.");
      }
      return;
    }
    if (!interaction.isButton()) return;
    const role = CUSTOM_ID_TO_ROLE[interaction.customId];
    if (!role) {
      log("WARN", `Button customId ${interaction.customId} not recognized in CUSTOM_ID_TO_ROLE`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "\u26A0\uFE0F Unknown RSVP option.", flags: import_discord3.MessageFlags.Ephemeral }).catch(() => {
        });
      } else {
        await interaction.followUp({ content: "\u26A0\uFE0F Unknown RSVP option.", flags: import_discord3.MessageFlags.Ephemeral }).catch(() => {
        });
      }
      return;
    }
    let session = null;
    let isSiege = false;
    if (interaction.message.id === client.mainMsgId) {
      session = client.currentSession;
      isSiege = false;
    } else if (interaction.message.id === client.siegeMainMsgId) {
      session = client.siegeSession;
      isSiege = true;
    } else if (interaction.channelId === CONFIG.SIEGE_CHANNEL_ID || interaction.customId === "rsvp_witch_wizard") {
      session = client.siegeSession;
      isSiege = true;
    } else if (interaction.channelId === CONFIG.CHANNEL_ID) {
      session = client.currentSession;
      isSiege = false;
    } else {
      const title = interaction.message.embeds?.[0]?.title || "";
      if (title.toLowerCase().includes("siege")) {
        session = client.siegeSession;
        isSiege = true;
      } else if (title.toLowerCase().includes("node")) {
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
          content: "\u26A0\uFE0F This RSVP session is no longer active. Please check the latest announcement.",
          flags: import_discord3.MessageFlags.Ephemeral
        }).catch(() => {
        });
      } else {
        await interaction.followUp({
          content: "\u26A0\uFE0F This RSVP session is no longer active. Please check the latest announcement.",
          flags: import_discord3.MessageFlags.Ephemeral
        }).catch(() => {
        });
      }
      return;
    }
    if (isSiege) {
      client.siegeMainMsg = interaction.message;
      client.siegeMainMsgId = interaction.message.id;
    } else {
      client.mainMsg = interaction.message;
      client.mainMsgId = interaction.message.id;
    }
    await session.processRoleSelection(interaction, role);
  } catch (error) {
    log("ERROR", `Interaction failed: ${error}`);
    if (interaction.isChatInputCommand() && (interaction.deferred || interaction.replied)) {
      await interaction.editReply("\u26A0\uFE0F The command could not be completed. Please try again.").catch(() => {
      });
    }
  }
});
function parseEmbedRoleMembers(embed) {
  const result = {};
  if (!embed || !embed.fields) return result;
  for (const field of embed.fields) {
    let role = null;
    const name = field.name || "";
    if (name.includes("Main Ball")) role = "Main Ball";
    else if (name.includes("Builder")) role = "Builder";
    else if (name.includes("Elephant")) role = "Elephant";
    else if (name.includes("Flag")) role = "Flag";
    else if (name.includes("FT")) role = "FT";
    else if (name.includes("Hwacha")) role = "Hwacha";
    else if (name.includes("Shai")) role = "Shai";
    else if (name.includes("Shotcaller")) role = "Shotcaller";
    else if (name.includes("Witch") || name.includes("Wizard")) role = "Witch/Wizard";
    if (!role) continue;
    const lines = String(field.value || "").split("\n").map((l) => l.replace(/^•\s*/, "").trim()).filter((l) => l.length > 0 && !l.includes("No players") && !l.includes("None") && !l.includes("No backups"));
    if (!result[role]) result[role] = [];
    result[role].push(...lines);
  }
  return result;
}
async function syncFromDiscord() {
  if (!client || !client.isReady || !client.isReady()) {
    return { success: false, nodeCount: 0, siegeCount: 0, message: "Discord bot client is not connected" };
  }
  try {
    const guild = CONFIG.SERVER_ID ? await client.guilds.fetch(CONFIG.SERVER_ID).catch(() => null) : null;
    const nameMap = /* @__PURE__ */ new Map();
    if (guild) {
      const members = await guild.members.fetch().catch(() => null);
      if (members) {
        for (const [id, m] of members) {
          nameMap.set(m.displayName.toLowerCase(), { id, name: m.displayName });
          nameMap.set(m.user.username.toLowerCase(), { id, name: m.displayName });
        }
      }
    }
    const buildRecords = (roleMap) => {
      const recs = {};
      for (const [role, names] of Object.entries(roleMap)) {
        recs[role] = names.map((n) => {
          const match = nameMap.get(n.toLowerCase());
          return {
            id: match ? match.id : `synced-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: match ? match.name : n
          };
        });
      }
      return recs;
    };
    let nodeCount = 0;
    let siegeCount = 0;
    if (CONFIG.CHANNEL_ID) {
      const nodeCh = await client.channels.fetch(CONFIG.CHANNEL_ID).catch(() => null);
      if (nodeCh && nodeCh.messages) {
        const msgs = await nodeCh.messages.fetch({ limit: 15 }).catch(() => null);
        if (msgs) {
          let mainMsg = null;
          let waitMsg = null;
          for (const [, msg] of msgs) {
            for (const emb of msg.embeds || []) {
              if (emb.title && emb.title.includes("Node War RSVP") && !mainMsg) {
                mainMsg = msg;
              }
              if (emb.title && emb.title.includes("Waitlist") && !waitMsg) {
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
              "Main Ball": [],
              ...parseEmbedRoleMembers(mainMsg.embeds[0])
            };
            const waitlist = {
              Builder: [],
              Elephant: [],
              Flag: [],
              FT: [],
              Hwacha: [],
              Shai: [],
              Shotcaller: [],
              "Main Ball": [],
              ...waitMsg ? parseEmbedRoleMembers(waitMsg.embeds[0]) : {}
            };
            const isClosed = Boolean(
              mainMsg.content?.includes("CLOSED") || mainMsg.embeds[0]?.description?.includes("CLOSED")
            );
            const targetDateStr = (0, import_moment_timezone3.default)().tz(JAKARTA_TZ).format("YYYY-MM-DD");
            const nodeState = {
              target_date: targetDateStr,
              is_closed: isClosed,
              data,
              waitlist,
              member_data: buildRecords(data),
              member_waitlist: buildRecords(waitlist),
              session_type: "node",
              main_msg_id: mainMsg.id,
              waitlist_msg_id: waitMsg?.id || null
            };
            import_fs3.default.writeFileSync(DATA_FILE, JSON.stringify(nodeState, null, 4));
            restoreState(DATA_FILE, "currentSession", "");
            nodeCount = Object.values(data).reduce((s, a) => s + a.length, 0);
            log("INFO", `Synced ${nodeCount} Node War members from Discord message ${mainMsg.id}`);
          }
        }
      }
    }
    if (CONFIG.SIEGE_CHANNEL_ID) {
      const siegeCh = await client.channels.fetch(CONFIG.SIEGE_CHANNEL_ID).catch(() => null);
      if (siegeCh && siegeCh.messages) {
        const msgs = await siegeCh.messages.fetch({ limit: 15 }).catch(() => null);
        if (msgs) {
          let mainMsg = null;
          let waitMsg = null;
          for (const [, msg] of msgs) {
            for (const emb of msg.embeds || []) {
              if (emb.title && emb.title.includes("Siege War RSVP") && !mainMsg) {
                mainMsg = msg;
              }
              if (emb.title && emb.title.includes("Waitlist") && !waitMsg) {
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
              "Witch/Wizard": [],
              "Main Ball": [],
              ...parseEmbedRoleMembers(mainMsg.embeds[0])
            };
            const waitlist = {
              Builder: [],
              Elephant: [],
              Flag: [],
              FT: [],
              Hwacha: [],
              Shai: [],
              Shotcaller: [],
              "Witch/Wizard": [],
              "Main Ball": [],
              ...waitMsg ? parseEmbedRoleMembers(waitMsg.embeds[0]) : {}
            };
            const isClosed = Boolean(
              mainMsg.content?.includes("CLOSED") || mainMsg.embeds[0]?.description?.includes("CLOSED")
            );
            const targetDateStr = "2026-09-06";
            const siegeState = {
              target_date: targetDateStr,
              is_closed: isClosed,
              data,
              waitlist,
              member_data: buildRecords(data),
              member_waitlist: buildRecords(waitlist),
              session_type: "siege",
              main_msg_id: mainMsg.id,
              waitlist_msg_id: waitMsg?.id || null
            };
            import_fs3.default.writeFileSync(SIEGE_DATA_FILE, JSON.stringify(siegeState, null, 4));
            restoreState(SIEGE_DATA_FILE, "siegeSession", "siege");
            siegeCount = Object.values(data).reduce((s, a) => s + a.length, 0);
            log("INFO", `Synced ${siegeCount} Siege War members from Discord message ${mainMsg.id}`);
          }
        }
      }
    }
    return {
      success: true,
      nodeCount,
      siegeCount,
      message: `Successfully synchronized from Discord: ${nodeCount} Node War members and ${siegeCount} Siege War members.`
    };
  } catch (err) {
    log("ERROR", `Failed to sync from Discord: ${err?.message || err}`);
    return {
      success: false,
      nodeCount: 0,
      siegeCount: 0,
      message: err?.message || "Sync failed"
    };
  }
}
restoreState();
restoreState(SIEGE_DATA_FILE, "siegeSession", "siege");
startScheduler();

// server.ts
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const server = import_http.default.createServer(app);
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use(import_express.default.urlencoded({ extended: true }));
  app.use(import_express.default.static(import_path2.default.join(process.cwd(), "public")));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/status", (req, res) => {
    const isBotReady = Boolean(client && client.isReady && client.isReady());
    const guild = isBotReady && client.guilds?.cache ? client.guilds.cache.get(String(CONFIG.SERVER_ID)) : null;
    let guildsList = [];
    let textChannels = [];
    let roles = [];
    if (isBotReady && client.guilds?.cache) {
      guildsList = [...client.guilds.cache.values()].map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount
      }));
      if (guild) {
        textChannels = [...guild.channels.cache.filter((c) => c.isTextBased()).values()].map((c) => ({
          id: c.id,
          name: c.name
        }));
        roles = [...guild.roles.cache.values()].sort((a, b) => b.position - a.position).map((r) => ({
          id: r.id,
          name: r.name,
          color: r.hexColor
        }));
      }
    }
    const nodeSession = client.currentSession;
    const siegeSession = client.siegeSession;
    res.json({
      bot: {
        isReady: isBotReady,
        tag: isBotReady ? client.user?.tag : null,
        ping: isBotReady && typeof client.ws?.ping === "number" && client.ws.ping >= 0 ? client.ws.ping : null,
        hasToken: Boolean(process.env.DISCORD_TOKEN),
        region: "asia-southeast1 (Singapore)"
      },
      currentGuild: guild ? { id: guild.id, name: guild.name } : null,
      guilds: guildsList,
      channels: textChannels,
      roles,
      nodeSession: {
        active: Boolean(nodeSession),
        isClosed: nodeSession ? nodeSession.isClosed : true,
        targetDate: nodeSession ? nodeSession.targetDate : null
      },
      siegeSession: {
        active: Boolean(siegeSession),
        isClosed: siegeSession ? siegeSession.isClosed : true,
        targetDate: siegeSession ? siegeSession.targetDate : null
      }
    });
  });
  app.get("/api/config", (req, res) => {
    const warnings = getCapacityWarnings();
    res.json({
      config: CONFIG,
      warnings,
      officialPax: OFFICIAL_TOTAL_PAX,
      defaultLimits: DEFAULT_ROLE_LIMITS,
      defaultSiegeLimits: DEFAULT_SIEGE_ROLE_LIMITS,
      roleEmojis: ROLE_EMOJIS
    });
  });
  app.post("/api/config", async (req, res) => {
    try {
      const updates = req.body;
      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === "string" || typeof value === "number") {
          CONFIG[key] = String(value).trim();
        }
      }
      saveConfig();
      if (client.siegeSession) {
        client.siegeSession.limits = getSiegeLimits();
        client.siegeSession.batchUpdateDiscord().catch(() => {
        });
      }
      if (client.currentSession) {
        client.currentSession.limits = getLimits(client.currentSession.targetDate);
        client.currentSession.batchUpdateDiscord().catch(() => {
        });
      }
      const warnings = getCapacityWarnings();
      log("CONFIG", "Configuration updated from dashboard.");
      res.json({ success: true, config: CONFIG, warnings });
    } catch (err) {
      log("ERROR", `Config update failed: ${err}`);
      res.status(500).json({ success: false, error: err?.message || "Update failed" });
    }
  });
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const handler = (payload) => {
      res.write(`data: ${JSON.stringify({ type: "session_update", ...payload })}

`);
    };
    sessionEvents.on("session_update", handler);
    res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}

`);
    const pingTimer = setInterval(() => {
      res.write(": ping\n\n");
    }, 15e3);
    req.on("close", () => {
      clearInterval(pingTimer);
      sessionEvents.off("session_update", handler);
    });
  });
  app.get("/api/sessions", (req, res) => {
    let nodeData = null;
    let siegeData = null;
    if (import_fs4.default.existsSync(DATA_FILE)) {
      try {
        nodeData = JSON.parse(import_fs4.default.readFileSync(DATA_FILE, "utf8"));
      } catch (e) {
        log("ERROR", `Failed reading ${DATA_FILE}`);
      }
    }
    if (import_fs4.default.existsSync(SIEGE_DATA_FILE)) {
      try {
        siegeData = JSON.parse(import_fs4.default.readFileSync(SIEGE_DATA_FILE, "utf8"));
      } catch (e) {
        log("ERROR", `Failed reading ${SIEGE_DATA_FILE}`);
      }
    }
    const nodeLimits = client.currentSession ? client.currentSession.limits : getLimits(/* @__PURE__ */ new Date());
    const siegeLimits = client.siegeSession ? client.siegeSession.limits : getSiegeLimits();
    res.json({
      node: {
        session: nodeData,
        limits: nodeLimits,
        isClosed: client.currentSession ? client.currentSession.isClosed : nodeData?.is_closed ?? true
      },
      siege: {
        session: siegeData,
        limits: siegeLimits,
        isClosed: client.siegeSession ? client.siegeSession.isClosed : siegeData?.is_closed ?? true
      }
    });
  });
  app.post("/api/actions/open-node-war", async (req, res) => {
    try {
      const ok = await postRSVP();
      res.json({ success: ok, message: "Node War RSVP opened" });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to open Node War" });
    }
  });
  app.post("/api/actions/close-node-war", async (req, res) => {
    try {
      await closeRSVP();
      res.json({ success: true, message: "Node War RSVP closed" });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to close Node War" });
    }
  });
  app.post("/api/actions/open-siege", async (req, res) => {
    try {
      const ok = await postSiege();
      res.json({ success: ok, message: "Siege War RSVP opened" });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to open Siege War" });
    }
  });
  app.post("/api/actions/close-siege", async (req, res) => {
    try {
      await closeSiege();
      res.json({ success: true, message: "Siege War RSVP closed" });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to close Siege War" });
    }
  });
  app.post("/api/actions/send-reminder", async (req, res) => {
    try {
      const { customMessage } = req.body || {};
      const result = await sendVoteReminder(customMessage);
      if (result && !result.success) {
        return res.status(400).json(result);
      }
      res.json({
        success: true,
        message: result?.message || "Vote reminder sent to registered Node War participants",
        details: result
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to send reminders" });
    }
  });
  app.post("/api/roster/assign", async (req, res) => {
    try {
      const { type, role, name, id } = req.body;
      if (!name || !role) {
        return res.status(400).json({ success: false, error: "Name and role are required" });
      }
      const session = type === "siege" ? client.siegeSession : client.currentSession;
      if (!session) {
        return res.status(400).json({ success: false, error: "No active session found" });
      }
      const result = session.assignMember(role, name, id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to assign member" });
    }
  });
  app.post("/api/roster/remove", async (req, res) => {
    try {
      const { type, nameOrId } = req.body;
      if (!nameOrId) {
        return res.status(400).json({ success: false, error: "Member identifier required" });
      }
      const session = type === "siege" ? client.siegeSession : client.currentSession;
      if (!session) {
        return res.status(400).json({ success: false, error: "No active session found" });
      }
      const removed = session.removeMember(nameOrId);
      res.json({ success: removed, message: removed ? "Member removed" : "Member not found" });
    } catch (err) {
      res.status(500).json({ success: false, error: err?.message || "Failed to remove member" });
    }
  });
  app.get("/api/bench-history", (req, res) => {
    const history = getBenchHistory();
    const priority = getPriorityBenchUsers();
    res.json({ history, priority });
  });
  app.get("/api/logs", (req, res) => {
    res.json({ logs: recentLogs });
  });
  app.get("/api/backup/:type", (req, res) => {
    const type = req.params.type;
    const filePath = type === "siege" ? SIEGE_DATA_FILE : DATA_FILE;
    if (import_fs4.default.existsSync(filePath)) {
      res.download(filePath, `${type}-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`);
    } else {
      res.status(404).json({ error: "Backup not found" });
    }
  });
  app.post("/api/sync-discord", async (req, res) => {
    try {
      const result = await syncFromDiscord();
      res.json(result);
    } catch (err) {
      log("ERROR", `Discord sync endpoint error: ${err}`);
      res.status(500).json({ success: false, error: err?.message || "Sync failed" });
    }
  });
  app.post("/api/bot/login", async (req, res) => {
    const token2 = req.body?.token || process.env.DISCORD_TOKEN;
    if (!token2) {
      return res.status(400).json({ success: false, error: "No Discord token provided" });
    }
    try {
      process.env.DISCORD_TOKEN = token2;
      if (!client.isReady || !client.isReady()) {
        await client.login(token2);
        log("BOT", "Discord client connected successfully.");
      }
      res.json({ success: true, tag: client.user?.tag });
    } catch (err) {
      log("ERROR", `Discord login error: ${err}`);
      res.status(500).json({ success: false, error: err?.message || "Failed to login to Discord" });
    }
  });
  const distPath = import_path2.default.join(process.cwd(), "dist");
  const distIndex = import_path2.default.join(distPath, "index.html");
  if (process.env.NODE_ENV === "production" || import_fs4.default.existsSync(distIndex)) {
    if (import_fs4.default.existsSync(distPath)) {
      app.use(import_express.default.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(distIndex);
      });
    }
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: {
            server
          }
        },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      log("WARN", `Vite dev server could not be started: ${viteErr}`);
      if (import_fs4.default.existsSync(distPath)) {
        app.use(import_express.default.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(distIndex);
        });
      }
    }
  }
  server.listen(PORT, "0.0.0.0", () => {
    log("WEB", `Command center dashboard running at http://0.0.0.0:${PORT}`);
  });
  const token = process.env.DISCORD_TOKEN;
  if (token) {
    try {
      log("BOT", "Logging into Discord Gateway with provided token...");
      await client.login(token);
    } catch (err) {
      log("ERROR", `Discord login error on startup: ${err}`);
    }
  } else {
    log("BOT", "No DISCORD_TOKEN found in environment. Bot is in Standby/Dashboard mode.");
  }
}
startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
});
//# sourceMappingURL=server.cjs.map
