import fs from 'fs';
import path from 'path';
import moment from 'moment-timezone';

export const JAKARTA_TZ = 'Asia/Jakarta';
export const CONFIG_FILE = path.join(process.cwd(), 'config.json');
export const DATA_FILE = path.join(process.cwd(), 'rsvp_data.json');
export const HISTORY_FILE = path.join(process.cwd(), 'rsvp_history.json');
export const SIEGE_DATA_FILE = path.join(process.cwd(), 'siege_data.json');

export interface LogEntry {
  id: string;
  time: string;
  category: string;
  message: string;
}

export const recentLogs: LogEntry[] = [];

export function log(category: string, message: string) {
  const time = moment().tz(JAKARTA_TZ).format('HH:mm:ss');
  console.log(`[${time}] [${category.padEnd(7)}] ${message}`);
  recentLogs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time,
    category,
    message,
  });
  if (recentLogs.length > 200) {
    recentLogs.pop();
  }
}

export const DEFAULT_CONFIG: Record<string, string> = {
  SERVER_ID: '1543436950466330676',
  CHANNEL_ID: '1543437822520856738',
  LOG_CHANNEL_ID: '1543437822520856738',
  AUTHORIZED_ROLE_ID: '1547627722992521308',
  ALLIANCE_ROLE_ID: '1544708723912482896',
  SIEGE_CHANNEL_ID: '1547628216246603816',
  SIEGE_TOTAL_PAX: '100',
  SIEGE_LIMIT_BUILDER: '1',
  SIEGE_LIMIT_ELEPHANT: '1',
  SIEGE_LIMIT_FLAG: '1',
  SIEGE_LIMIT_FT: '2',
  SIEGE_LIMIT_HWACHA: '1',
  SIEGE_LIMIT_SHAI: '4',
  SIEGE_LIMIT_SHOTCALLER: '3',
  SIEGE_LIMIT_WITCH_WIZARD: '5',
  SUN_TIER: 'Tier 2',
  MON_TIER: 'Tier 2',
  TUE_TIER: 'Tier 2',
  WED_TIER: 'Tier 2',
  THU_TIER: 'Tier 2',
  FRI_TIER: 'Tier 2',
  SUN_VOTE_TARGET: '',
  MON_VOTE_TARGET: '',
  TUE_VOTE_TARGET: '',
  WED_VOTE_TARGET: '',
  THU_VOTE_TARGET: '',
  FRI_VOTE_TARGET: '',
  LIMIT_BUILDER: '1',
  LIMIT_ELEPHANT: '1',
  LIMIT_FLAG: '1',
  LIMIT_FT: '2',
  LIMIT_HWACHA: '1',
  LIMIT_SHAI: '3',
  LIMIT_SHOTCALLER: '1',
  MAINBALL_SUN_T1: '20',
  MAINBALL_SUN_T2: '35',
  MAINBALL_MON_T1: '15',
  MAINBALL_MON_T2: '25',
  MAINBALL_TUE_T1: '20',
  MAINBALL_TUE_T2: '25',
  MAINBALL_WED_T1: '15',
  MAINBALL_WED_T2: '25',
  MAINBALL_THU_T1: '20',
  MAINBALL_THU_T2: '25',
  MAINBALL_FRI_T1: '15',
  MAINBALL_FRI_T2: '35',
  NW_REMINDER_MESSAGE:
    '⚠️ **Node War In-Game Vote Reminder**\nPlease **YES UP** on **{target}** for **{tier}**!\nMake sure to submit your vote in-game before the deadline.',
};

export function loadConfig(): Record<string, string> {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 4));
    return { ...DEFAULT_CONFIG };
  }
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export const CONFIG = loadConfig();

/**
 * Resolves the Discord Bot Token from environment variables (.env / Wispbyte panel)
 * or config.json. No Gemini API or external AI keys needed.
 */
export function getDiscordToken(): string {
  const token = (
    process.env.DISCORD_TOKEN ||
    process.env.TOKEN ||
    process.env.BOT_TOKEN ||
    CONFIG.DISCORD_TOKEN ||
    CONFIG.TOKEN ||
    ''
  ).trim();

  if (token && !process.env.DISCORD_TOKEN) {
    process.env.DISCORD_TOKEN = token;
  }
  return token;
}

export function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(CONFIG, null, 4));
}
