export interface MemberRecord {
  id: string;
  name: string;
}

export interface SessionData {
  target_date: string;
  is_closed: boolean;
  data: Record<string, string[]>;
  waitlist: Record<string, string[]>;
  member_data?: Record<string, MemberRecord[]>;
  member_waitlist?: Record<string, MemberRecord[]>;
  session_type?: 'node' | 'siege';
  main_msg_id?: string | null;
  waitlist_msg_id?: string | null;
}

export interface CapacityWarning {
  day: string;
  tier: string;
  expected: number;
  actual: number;
  difference: number;
}

export interface BotStatus {
  bot: {
    isReady: boolean;
    tag: string | null;
    ping: number | null;
    hasToken: boolean;
  };
  currentGuild: { id: string; name: string } | null;
  guilds: Array<{ id: string; name: string; memberCount?: number }>;
  channels: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string; color?: string }>;
  nodeSession: {
    active: boolean;
    isClosed: boolean;
    targetDate: string | null;
  };
  siegeSession: {
    active: boolean;
    isClosed: boolean;
    targetDate: string | null;
  };
}

export interface AppConfig {
  SERVER_ID: string;
  CHANNEL_ID: string;
  LOG_CHANNEL_ID: string;
  AUTHORIZED_ROLE_ID: string;
  ALLIANCE_ROLE_ID: string;
  SIEGE_CHANNEL_ID: string;
  SIEGE_TOTAL_PAX: string;
  SIEGE_LIMIT_BUILDER: string;
  SIEGE_LIMIT_ELEPHANT: string;
  SIEGE_LIMIT_FLAG: string;
  SIEGE_LIMIT_FT: string;
  SIEGE_LIMIT_HWACHA: string;
  SIEGE_LIMIT_SHAI: string;
  SIEGE_LIMIT_SHOTCALLER: string;
  SIEGE_LIMIT_WITCH_WIZARD: string;
  SUN_TIER: string;
  MON_TIER: string;
  TUE_TIER: string;
  WED_TIER: string;
  THU_TIER: string;
  FRI_TIER: string;
  SUN_VOTE_TARGET: string;
  MON_VOTE_TARGET: string;
  TUE_VOTE_TARGET: string;
  WED_VOTE_TARGET: string;
  THU_VOTE_TARGET: string;
  FRI_VOTE_TARGET: string;
  LIMIT_BUILDER: string;
  LIMIT_ELEPHANT: string;
  LIMIT_FLAG: string;
  LIMIT_FT: string;
  LIMIT_HWACHA: string;
  LIMIT_SHAI: string;
  LIMIT_SHOTCALLER: string;
  MAINBALL_SUN_T1: string;
  MAINBALL_SUN_T2: string;
  MAINBALL_MON_T1: string;
  MAINBALL_MON_T2: string;
  MAINBALL_TUE_T1: string;
  MAINBALL_TUE_T2: string;
  MAINBALL_WED_T1: string;
  MAINBALL_WED_T2: string;
  MAINBALL_THU_T1: string;
  MAINBALL_THU_T2: string;
  MAINBALL_FRI_T1: string;
  MAINBALL_FRI_T2: string;
  [key: string]: string;
}

export interface BenchHistoryEntry {
  date: string;
  users: MemberRecord[];
}

export interface LogEntry {
  id: string;
  time: string;
  category: string;
  message: string;
}
