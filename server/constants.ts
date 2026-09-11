export const ROLE_EMOJIS: Record<string, string> = {
  "Main Ball": "⚔️",
  Shotcaller: "📢",
  Builder: "🔨",
  Elephant: "🐘",
  Flag: "🚩",
  FT: "🔥",
  Hwacha: "🏹",
  Shai: "🎵",
  "Witch/Wizard": "🧙",
};

export const DAY_KEYS: Record<number, string> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
};

export const ROLE_BUTTONS = [
  { role: "Main Ball", customId: "rsvp_main", emoji: "⚔️" },
  { role: "Builder", customId: "rsvp_builder", emoji: "🔨" },
  { role: "Elephant", customId: "rsvp_elephant", emoji: "🐘" },
  { role: "Flag", customId: "rsvp_flag", emoji: "🚩" },
  { role: "FT", customId: "rsvp_ft", emoji: "🔥" },
  { role: "Hwacha", customId: "rsvp_hwacha", emoji: "🏹" },
  { role: "Shai", customId: "rsvp_shai", emoji: "🎵" },
  { role: "Shotcaller", customId: "rsvp_shotcaller", emoji: "📢" },
];

export const SIEGE_ROLE_BUTTONS = [
  { role: "Builder", customId: "rsvp_builder", emoji: "🔨" },
  { role: "Elephant", customId: "rsvp_elephant", emoji: "🐘" },
  { role: "Flag", customId: "rsvp_flag", emoji: "🚩" },
  { role: "FT", customId: "rsvp_ft", emoji: "🔥" },
  { role: "Hwacha", customId: "rsvp_hwacha", emoji: "🏹" },
  { role: "Shai", customId: "rsvp_shai", emoji: "🎵" },
  { role: "Shotcaller", customId: "rsvp_shotcaller", emoji: "📢" },
  { role: "Witch/Wizard", customId: "rsvp_witch_wizard", emoji: "🧙" },
  { role: "Main Ball", customId: "rsvp_main", emoji: "⚔️" },
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
  FT: 2,
  Hwacha: 1,
  Shai: 3,
  Shotcaller: 1,
  "Witch/Wizard": 0,
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
