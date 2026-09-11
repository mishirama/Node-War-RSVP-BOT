export const ROLE_EMOJIS: Record<string, string> = {
  "Main Ball": "⚔️",
  Shotcaller: "📢",
  Builder: "🔨",
  Elephant: "1543984913047486545",
  Flag: "1543984858894704710",
  FT: "1543984885432062092",
  Hwacha: "1543984939861803108",
  Shai: "1544203289393111080",
  "Witch/Wizard": "1544202932256252167",
  Witch: "1544202932256252167",
  Wizard: "1544202904817373224",
};

export function formatDiscordRoleEmoji(role: string, rawVal?: string): string {
  const val = rawVal ?? ROLE_EMOJIS[role] ?? '👤';
  if (role === 'Witch/Wizard' && (val === '🧙' || val === '1544202932256252167')) {
    return '<:Witch:1544202932256252167><:Wizard:1544202904817373224>';
  }
  if (!val) return '👤';
  const trimmed = String(val).trim();
  if (/^\d+$/.test(trimmed)) {
    const cleanRole = role.replace(/[^a-zA-Z0-9_]/g, '') || 'emoji';
    return `<:${cleanRole}:${trimmed}>`;
  }
  return trimmed;
}

export const DAY_KEYS: Record<number, string> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
};

export const ROLE_BUTTONS = [
  { role: "Main Ball", customId: "rsvp_main", emoji: ROLE_EMOJIS["Main Ball"] || "⚔️" },
  { role: "Builder", customId: "rsvp_builder", emoji: ROLE_EMOJIS["Builder"] || "🔨" },
  { role: "Elephant", customId: "rsvp_elephant", emoji: ROLE_EMOJIS["Elephant"] || "1543984913047486545" },
  { role: "Flag", customId: "rsvp_flag", emoji: ROLE_EMOJIS["Flag"] || "1543984858894704710" },
  { role: "FT", customId: "rsvp_ft", emoji: ROLE_EMOJIS["FT"] || "1543984885432062092" },
  { role: "Hwacha", customId: "rsvp_hwacha", emoji: ROLE_EMOJIS["Hwacha"] || "1543984939861803108" },
  { role: "Shai", customId: "rsvp_shai", emoji: ROLE_EMOJIS["Shai"] || "1544203289393111080" },
  { role: "Shotcaller", customId: "rsvp_shotcaller", emoji: ROLE_EMOJIS["Shotcaller"] || "📢" },
];

export const SIEGE_ROLE_BUTTONS = [
  { role: "Builder", customId: "rsvp_builder", emoji: ROLE_EMOJIS["Builder"] || "🔨" },
  { role: "Elephant", customId: "rsvp_elephant", emoji: ROLE_EMOJIS["Elephant"] || "1543984913047486545" },
  { role: "Flag", customId: "rsvp_flag", emoji: ROLE_EMOJIS["Flag"] || "1543984858894704710" },
  { role: "FT", customId: "rsvp_ft", emoji: ROLE_EMOJIS["FT"] || "1543984885432062092" },
  { role: "Hwacha", customId: "rsvp_hwacha", emoji: ROLE_EMOJIS["Hwacha"] || "1543984939861803108" },
  { role: "Shai", customId: "rsvp_shai", emoji: ROLE_EMOJIS["Shai"] || "1544203289393111080" },
  { role: "Shotcaller", customId: "rsvp_shotcaller", emoji: ROLE_EMOJIS["Shotcaller"] || "📢" },
  { role: "Witch/Wizard", customId: "rsvp_witch_wizard", emoji: ROLE_EMOJIS["Witch/Wizard"] || "1544202932256252167" },
  { role: "Main Ball", customId: "rsvp_main", emoji: ROLE_EMOJIS["Main Ball"] || "⚔️" },
];

export const CUSTOM_ID_TO_ROLE: Record<string, string> = Object.fromEntries(
  ROLE_BUTTONS.map((b) => [b.customId, b.role])
);
for (const button of SIEGE_ROLE_BUTTONS) {
  CUSTOM_ID_TO_ROLE[button.customId] = button.role;
}
CUSTOM_ID_TO_ROLE["rsvp_cancel"] = "Cancel";

export const DEFAULT_ROLE_LIMITS: Record<string, number> = {
  Builder: 1,
  Elephant: 1,
  Flag: 1,
  FT: 2,
  Hwacha: 1,
  Shai: 3,
  Shotcaller: 1,
};

export const ROLE_CONFIG_KEYS: Record<string, string> = {
  Builder: "LIMIT_BUILDER",
  Elephant: "LIMIT_ELEPHANT",
  Flag: "LIMIT_FLAG",
  FT: "LIMIT_FT",
  Hwacha: "LIMIT_HWACHA",
  Shai: "LIMIT_SHAI",
  Shotcaller: "LIMIT_SHOTCALLER",
};

export const SIEGE_ROLE_CONFIG_KEYS: Record<string, string> = {
  Builder: "SIEGE_LIMIT_BUILDER",
  Elephant: "SIEGE_LIMIT_ELEPHANT",
  Flag: "SIEGE_LIMIT_FLAG",
  FT: "SIEGE_LIMIT_FT",
  Hwacha: "SIEGE_LIMIT_HWACHA",
  Shai: "SIEGE_LIMIT_SHAI",
  Shotcaller: "SIEGE_LIMIT_SHOTCALLER",
  "Witch/Wizard": "SIEGE_LIMIT_WITCH_WIZARD",
};

export const DEFAULT_SIEGE_ROLE_LIMITS: Record<string, number> = {
  Builder: 1,
  Elephant: 1,
  Flag: 1,
  FT: 3,
  Hwacha: 2,
  Shai: 5,
  Shotcaller: 1,
  "Witch/Wizard": 5,
};

export const DEFAULT_MAIN_BALL_LIMITS: Record<string, Record<string, number>> = {
  SUN: { "Tier 1": 20, "Tier 2": 35 },
  MON: { "Tier 1": 15, "Tier 2": 25 },
  TUE: { "Tier 1": 20, "Tier 2": 25 },
  WED: { "Tier 1": 15, "Tier 2": 25 },
  THU: { "Tier 1": 20, "Tier 2": 25 },
  FRI: { "Tier 1": 15, "Tier 2": 35 },
};

export const MAIN_BALL_CONFIG_KEYS: Record<string, Record<string, string>> = {
  SUN: { "Tier 1": "MAINBALL_SUN_T1", "Tier 2": "MAINBALL_SUN_T2" },
  MON: { "Tier 1": "MAINBALL_MON_T1", "Tier 2": "MAINBALL_MON_T2" },
  TUE: { "Tier 1": "MAINBALL_TUE_T1", "Tier 2": "MAINBALL_TUE_T2" },
  WED: { "Tier 1": "MAINBALL_WED_T1", "Tier 2": "MAINBALL_WED_T2" },
  THU: { "Tier 1": "MAINBALL_THU_T1", "Tier 2": "MAINBALL_THU_T2" },
  FRI: { "Tier 1": "MAINBALL_FRI_T1", "Tier 2": "MAINBALL_FRI_T2" },
};

export const OFFICIAL_TOTAL_PAX: Record<string, Record<string, number>> = {
  SUN: { "Tier 1": 30, "Tier 2": 50 },
  MON: { "Tier 1": 25, "Tier 2": 40 },
  TUE: { "Tier 1": 30, "Tier 2": 40 },
  WED: { "Tier 1": 25, "Tier 2": 40 },
  THU: { "Tier 1": 30, "Tier 2": 40 },
  FRI: { "Tier 1": 25, "Tier 2": 50 },
};
