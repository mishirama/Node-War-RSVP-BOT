import fs from 'fs';
import moment from 'moment-timezone';
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  Client,
  Message,
  MessageFlags,
} from 'discord.js';
import { CONFIG, DATA_FILE, log } from './config.js';
import {
  ROLE_EMOJIS,
  DAY_KEYS,
  ROLE_BUTTONS,
  formatDiscordRoleEmoji,
  DEFAULT_ROLE_LIMITS,
  DEFAULT_SIEGE_ROLE_LIMITS,
  getCanonicalRoles,
} from './constants.js';
import { notifySessionUpdate } from './events.js';

export interface MemberRecord {
  id: string;
  name: string;
}

export interface RSVPOptions {
  dataFile?: string;
  title?: string;
  sessionType?: 'node' | 'siege';
  messagePrefix?: string;
  roleButtons?: Array<{ role: string; customId: string; emoji: string | { id: string; name: string } }>;
}

export class RSVPSession {
  client: any;
  limits: Record<string, number>;
  targetDate: Date;
  dataFile: string;
  title: string;
  sessionType: 'node' | 'siege';
  messagePrefix: string;
  roleButtons: Array<{ role: string; customId: string; emoji: string | { id: string; name: string } }>;
  data: Record<string, string[]>;
  waitlist: Record<string, string[]>;
  memberData: Record<string, MemberRecord[]>;
  memberWaitlist: Record<string, MemberRecord[]>;
  isClosed: boolean;
  _updateRunning: boolean;

  constructor(client: any, limits: Record<string, number>, targetDate: Date, options: RSVPOptions = {}) {
    this.client = client;
    this.limits = limits;
    this.targetDate = targetDate;
    this.dataFile = options.dataFile || DATA_FILE;
    this.title = options.title || 'Node War RSVP';
    this.sessionType = options.sessionType || 'node';
    this.messagePrefix = options.messagePrefix || '';
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

  messageKey(name: string) {
    return this.messagePrefix
      ? `${this.messagePrefix}${name[0].toUpperCase()}${name.slice(1)}`
      : name;
  }

  sanitizeData() {
    const isInvalid = (name: any) => {
      if (!name) return true;
      const t = String(name || '').replace(/^[•\-\*\s]+/, '').trim();
      return (
        !t ||
        t === '-' ||
        t === '—' ||
        t === '–' ||
        t.toLowerCase() === 'none' ||
        t.toLowerCase().includes('no players') ||
        t.toLowerCase().includes('no backups')
      );
    };
    for (const role of Object.keys(this.data)) {
      if (Array.isArray(this.data[role])) {
        this.data[role] = this.data[role]
          .filter((n) => !isInvalid(n))
          .map((n) => String(n).replace(/^[•\-\*\s]+/, '').trim());
      }
      if (Array.isArray(this.memberData[role])) {
        this.memberData[role] = this.memberData[role]
          .filter((m) => m && !isInvalid(m.name))
          .map((m) => ({ ...m, name: String(m.name).replace(/^[•\-\*\s]+/, '').trim() }));
      }
    }
    for (const role of Object.keys(this.waitlist)) {
      if (Array.isArray(this.waitlist[role])) {
        this.waitlist[role] = this.waitlist[role]
          .filter((n) => !isInvalid(n))
          .map((n) => String(n).replace(/^[•\-\*\s]+/, '').trim());
      }
      if (Array.isArray(this.memberWaitlist[role])) {
        this.memberWaitlist[role] = this.memberWaitlist[role]
          .filter((m) => m && !isInvalid(m.name))
          .map((m) => ({ ...m, name: String(m.name).replace(/^[•\-\*\s]+/, '').trim() }));
      }
    }
  }

  saveState() {
    try {
      this.sanitizeData();
      const canonicalRoles = getCanonicalRoles(
        this.sessionType,
        Array.from(new Set([...Object.keys(this.limits), ...Object.keys(this.data)]))
      );

      const orderedData: Record<string, string[]> = {};
      const orderedWaitlist: Record<string, string[]> = {};
      const orderedMemberData: Record<string, MemberRecord[]> = {};
      const orderedMemberWaitlist: Record<string, MemberRecord[]> = {};

      for (const r of canonicalRoles) {
        if (this.data[r] !== undefined || this.limits[r] !== undefined) {
          orderedData[r] = this.data[r] || [];
        }
        if (this.waitlist[r] !== undefined || this.limits[r] !== undefined) {
          orderedWaitlist[r] = this.waitlist[r] || [];
        }
        if (this.memberData[r] !== undefined || this.limits[r] !== undefined) {
          orderedMemberData[r] = this.memberData[r] || [];
        }
        if (this.memberWaitlist[r] !== undefined || this.limits[r] !== undefined) {
          orderedMemberWaitlist[r] = this.memberWaitlist[r] || [];
        }
      }

      this.data = orderedData;
      this.waitlist = orderedWaitlist;
      this.memberData = orderedMemberData;
      this.memberWaitlist = orderedMemberWaitlist;

      fs.writeFileSync(
        this.dataFile,
        JSON.stringify(
          {
            target_date: moment(this.targetDate).format('YYYY-MM-DD'),
            is_closed: this.isClosed,
            data: this.data,
            waitlist: this.waitlist,
            member_data: this.memberData,
            member_waitlist: this.memberWaitlist,
            session_type: this.sessionType,
            main_msg_id: this.client?.[this.messageKey('mainMsgId')] || null,
            waitlist_msg_id: this.client?.[this.messageKey('waitlistMsgId')] || null,
          },
          null,
          4
        )
      );
      // Immediately notify SSE listeners for real-time web dashboard sync
      notifySessionUpdate(this.sessionType);
    } catch (err) {
      log('ERROR', `Failed to save state to ${this.dataFile}: ${err}`);
    }
  }

  buildEmbeds() {
    this.sanitizeData();
    const color = this.isClosed ? 0xed4245 : 0x5865f2;
    const weekday = this.targetDate.getDay();
    const dayPrefix = DAY_KEYS[weekday] || 'MON';
    const tier = CONFIG[`${dayPrefix}_TIER`] || 'Tier 1';
    const totalSlots = Object.values(this.limits).reduce((a, b) => a + b, 0);

    const mainEmb = new EmbedBuilder()
      .setTitle(`${this.title}${this.sessionType === 'node' ? ` - ${tier}` : ''} (${totalSlots} Slot)`)
      .setDescription(
        `**Event Date:** ${moment(this.targetDate).format('dddd, DD-MM-YYYY')}\n` +
          (this.isClosed ? '❌ CLOSED' : 'Click buttons to join!')
      )
      .setColor(color);

    const isInvalid = (n: any) => {
      if (!n) return true;
      const t = String(n).replace(/^[•\-\*\s]+/, '').trim();
      return !t || t === '-' || t === '—' || t === '–' || t.toLowerCase() === 'none';
    };

    const canonicalRoles = getCanonicalRoles(
      this.sessionType,
      Array.from(new Set([...Object.keys(this.limits), ...Object.keys(this.data)]))
    );

    for (const role of canonicalRoles) {
      const limit = this.limits[role] ?? 0;
      const rawUsers = this.data[role] || [];
      const users = (rawUsers || []).filter((u) => !isInvalid(u));

      if (!users.length) {
        mainEmb.addFields({
          name: `${formatDiscordRoleEmoji(role)} ${role} (0/${limit})`,
          value: '-',
          inline: true,
        });
        continue;
      }

      // Group users into chunks so that no single field value exceeds 900 characters
      // (Discord limit is 1024 characters per field value)
      const userChunks: string[][] = [];
      let currentChunk: string[] = [];
      let currentLen = 0;

      for (const u of users) {
        const line = `• ${u}`;
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
        const fieldName =
          chunkIdx === 0
            ? `${formatDiscordRoleEmoji(role)} ${role} (${users.length}/${limit})`
            : `${formatDiscordRoleEmoji(role)} ${role} (Cont. ${chunkIdx + 1})`;

        mainEmb.addFields({
          name: fieldName,
          value: chunk.join('\n'),
          inline: true,
        });
      });
    }

    const totalReg = Object.values(this.data).reduce((a, arr) => a + (arr || []).filter((u) => !isInvalid(u)).length, 0);
    mainEmb.addFields({
      name: '📊 Summary',
      value: `**Total Registered: ${totalReg}/${totalSlots}**`,
      inline: false,
    });

    const anyWaitlist = Object.values(this.waitlist).some((arr) => (arr || []).some((u) => !isInvalid(u)));
    const waitEmb = new EmbedBuilder()
      .setTitle('📋 Waitlist / Backups')
      .setColor(0xfaa61a);

    if (anyWaitlist) {
      waitEmb.setDescription('Players currently in backup queue:');
    } else {
      waitEmb.setDescription('No backups currently in queue.');
    }

    for (const role of canonicalRoles) {
      const rawUsers = this.waitlist[role] || [];
      const users = (rawUsers || []).filter((u) => !isInvalid(u));
      if (!users.length) continue;

      const userChunks: string[][] = [];
      let currentChunk: string[] = [];
      let currentLen = 0;

      for (const u of users) {
        const line = `• ${u}`;
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
        const fieldName =
          chunkIdx === 0
            ? `${formatDiscordRoleEmoji(role)} ${role} Backups (${users.length})`
            : `${formatDiscordRoleEmoji(role)} ${role} Backups (Cont. ${chunkIdx + 1})`;

        waitEmb.addFields({
          name: fieldName,
          value: chunk.join('\n'),
          inline: true,
        });
      });
    }

    return { mainEmb, waitEmb };
  }

  buildComponents() {
    const buttons = this.roleButtons.map((b) => {
      const btn = new ButtonBuilder()
        .setCustomId(b.customId)
        .setLabel(b.role)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(this.isClosed);

      const emojiVal = b.emoji || ROLE_EMOJIS[b.role];
      if (emojiVal) {
        const trimmed = typeof emojiVal === 'string' ? emojiVal.trim() : (emojiVal as any).id || '';
        if (/^\d+$/.test(trimmed)) {
          btn.setEmoji({ id: trimmed });
        } else {
          btn.setEmoji(emojiVal as any);
        }
      }
      return btn;
    });
    buttons.push(
      new ButtonBuilder()
        .setCustomId('rsvp_cancel')
        .setLabel('Cancel')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(this.isClosed)
    );

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
    }
    return rows;
  }

  private _updateTimer: NodeJS.Timeout | null = null;
  private _updatePending = false;
  private _updateInFlight = false;
  private _skipMainMsgEdit = false;

  triggerDiscordUpdate(delayMs = 100, skipMainMsg = false) {
    this._updatePending = true;
    if (skipMainMsg) {
      this._skipMainMsgEdit = true;
    } else {
      this._skipMainMsgEdit = false;
    }
    if (this._updateTimer) clearTimeout(this._updateTimer);
    this._updateTimer = setTimeout(() => {
      this._updateTimer = null;
      this._flushDiscordUpdate().catch(() => {});
    }, delayMs);
  }

  private async _flushDiscordUpdate() {
    if (this._updateInFlight) {
      return;
    }
    this._updateInFlight = true;
    this._updatePending = false;
    const skipMain = this._skipMainMsgEdit;
    this._skipMainMsgEdit = false;

    try {
      if (!this.client?.isReady || !this.client.isReady()) {
        this.saveState();
        return;
      }
      const { mainEmb, waitEmb } = this.buildEmbeds();
      const channelId = String(
        this.sessionType === 'siege' ? CONFIG.SIEGE_CHANNEL_ID || '0' : CONFIG.CHANNEL_ID || '0'
      );

      if (channelId !== '0') {
        const ch = this.client.channels.cache.get(channelId) || await this.client.channels.fetch(channelId).catch(() => null);
        if (ch && ch.isTextBased()) {
          const mainMsgKey = this.messageKey('mainMsg');
          const mainMsgIdKey = this.messageKey('mainMsgId');
          const waitlistMsgKey = this.messageKey('waitlistMsg');
          const waitlistMsgIdKey = this.messageKey('waitlistMsgId');

          let mainMsgId = this.client[mainMsgIdKey];
          if (!mainMsgId && fs.existsSync(this.dataFile)) {
            try {
              const saved = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
              mainMsgId = saved.main_msg_id;
              if (mainMsgId) this.client[mainMsgIdKey] = mainMsgId;
            } catch {}
          }
          if (mainMsgId) {
            this.client[mainMsgKey] = ch.messages.cache.get(mainMsgId) || await ch.messages
              .fetch(mainMsgId)
              .catch((e: any) => {
                log('WARN', `Could not fetch main message ${mainMsgId}: ${e?.message || e}`);
                return null;
              });
          }
          let waitlistMsgId = this.client[waitlistMsgIdKey];
          if (!waitlistMsgId && fs.existsSync(this.dataFile)) {
            try {
              const saved = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
              waitlistMsgId = saved.waitlist_msg_id;
              if (waitlistMsgId) this.client[waitlistMsgIdKey] = waitlistMsgId;
            } catch {}
          }
          if (waitlistMsgId) {
            this.client[waitlistMsgKey] = ch.messages.cache.get(waitlistMsgId) || await ch.messages
              .fetch(waitlistMsgId)
              .catch((e: any) => {
                log('WARN', `Could not fetch waitlist message ${waitlistMsgId}: ${e?.message || e}`);
                return null;
              });
          }
        }
      }

      const mainMsg = this.client[this.messageKey('mainMsg')];
      const waitlistMsg = this.client[this.messageKey('waitlistMsg')];

      const edits: Promise<any>[] = [];
      if (mainMsg && !skipMain) {
        edits.push(
          mainMsg.edit({ embeds: [mainEmb], components: this.buildComponents() }).catch((err: any) => {
            log('ERROR', `Failed to edit main message: ${err?.message || err}`);
            if (err?.code === 10008 || err?.code === 50005) {
              // Message was deleted, invalid, or authored by a different bot
              this.client[this.messageKey('mainMsg')] = null;
              this.client[this.messageKey('mainMsgId')] = null;
            }
          })
        );
      }
      if (waitlistMsg) {
        edits.push(
          waitlistMsg.edit({ embeds: [waitEmb] }).catch((err: any) => {
            log('ERROR', `Failed to edit waitlist message: ${err?.message || err}`);
            if (err?.code === 10008 || err?.code === 50005) {
              this.client[this.messageKey('waitlistMsg')] = null;
              this.client[this.messageKey('waitlistMsgId')] = null;
            }
          })
        );
      }
      if (edits.length > 0) {
        await Promise.all(edits);
        log('SUCCESS', `RSVP Embeds updated on Discord for ${this.sessionType}.`);
      } else {
        log('DEBUG', `No message in memory to edit on Discord for ${this.sessionType}.`);
      }
      this.saveState();
    } catch (e) {
      log('ERROR', `Batch update failed: ${e}`);
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

  findMemberIndex(
    roleList: string[] = [],
    memberList: MemberRecord[] = [],
    userId: string = '',
    name: string = ''
  ): number {
    if (!roleList || !roleList.length) return -1;
    const cleanUserId = String(userId || '').trim();
    const cleanName = String(name || '').toLowerCase().trim();

    // 1. Match by Discord user ID (highest fidelity)
    if (cleanUserId && memberList?.length) {
      const idIdx = memberList.findIndex((m) => m && String(m.id).trim() === cleanUserId);
      if (idIdx !== -1) return idIdx;
    }

    // 2. Match by exact or partial display name / nickname
    if (cleanName) {
      const nameIdx = roleList.findIndex((savedName, idx) => {
        const lowerSaved = String(savedName || '').toLowerCase().trim();
        const savedMemberName = String(memberList?.[idx]?.name || '').toLowerCase().trim();
        return (
          lowerSaved === cleanName ||
          savedMemberName === cleanName ||
          (cleanName.length >= 3 && (lowerSaved.endsWith(cleanName) || cleanName.endsWith(lowerSaved)))
        );
      });
      if (nameIdx !== -1) return nameIdx;
    }

    return -1;
  }

  promoteWaitlist(specificRole?: string): string[] {
    const rolesToCheck = specificRole ? [specificRole] : Object.keys(this.limits);
    const promotedNames: string[] = [];

    const isInvalid = (name: any) => {
      if (!name) return true;
      const t = String(name || '').replace(/^[•\-\*\s]+/, '').trim();
      return (
        !t ||
        t === '-' ||
        t === '—' ||
        t === '–' ||
        t.toLowerCase() === 'none' ||
        t.toLowerCase().includes('no players') ||
        t.toLowerCase().includes('no backups')
      );
    };

    for (const r of rolesToCheck) {
      const limit = this.limits[r] || 0;
      if (!this.data[r]) this.data[r] = [];
      if (!this.memberData[r]) this.memberData[r] = [];
      if (!this.waitlist[r]) this.waitlist[r] = [];
      if (!this.memberWaitlist[r]) this.memberWaitlist[r] = [];

      // Clean invalid placeholders before checking limits
      this.data[r] = this.data[r].filter((u) => !isInvalid(u));
      this.memberData[r] = this.memberData[r].filter((m) => m && !isInvalid(m.name));
      this.waitlist[r] = this.waitlist[r].filter((u) => !isInvalid(u));
      this.memberWaitlist[r] = this.memberWaitlist[r].filter((m) => m && !isInvalid(m.name));

      while (this.data[r].length < limit && this.waitlist[r].length > 0) {
        const nextUser = this.waitlist[r].shift()!;
        let nextMember = this.memberWaitlist[r]?.length > 0 ? this.memberWaitlist[r].shift()! : null;
        if (isInvalid(nextUser)) continue;
        if (!nextMember || !nextMember.name || isInvalid(nextMember.name)) {
          nextMember = {
            id: `promoted-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: nextUser,
          };
        }
        this.data[r].push(nextUser);
        this.memberData[r].push(nextMember);
        promotedNames.push(nextUser);

        log(
          'SUCCESS',
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

  async processRoleSelection(interaction: ButtonInteraction, role: string) {
    // Keep data strictly sanitized before any interaction checks
    this.sanitizeData();

    if (this.isClosed) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '🔒 This RSVP is currently closed.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      } else {
        await interaction.followUp({
          content: '🔒 This RSVP is currently closed.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
      return;
    }

    const userId = interaction.user.id;
    const displayName = (interaction.member as any)?.displayName || interaction.user.username;
    const member: MemberRecord = { id: userId, name: displayName };

    // 1. If clicking a role (not Cancel), check if user is ALREADY registered in that role or waitlist
    if (role !== 'Cancel') {
      const currentRoleIdx = this.findMemberIndex(
        this.data[role] || [],
        this.memberData[role] || [],
        userId,
        displayName
      );
      if (currentRoleIdx !== -1) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `ℹ️ You are already registered for **${role}**!`,
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
        } else {
          await interaction.followUp({
            content: `ℹ️ You are already registered for **${role}**!`,
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
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
            content: `ℹ️ You are already on the **${role}** waitlist (Position #${currentWaitIdx + 1}).`,
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
        } else {
          await interaction.followUp({
            content: `ℹ️ You are already on the **${role}** waitlist (Position #${currentWaitIdx + 1}).`,
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
        }
        return;
      }
    }

    // 2. Remove user from any previous roles or waitlists they may have had
    let removedFromRole: string | null = null;
    let wasWaitlisted = false;
    let waitlistPromoted = false;

    for (const r of Object.keys(this.limits)) {
      // Check active roster
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

        // Immediately promote the next player from waitlist into this role
        const promoted = this.promoteWaitlist(r);
        if (promoted.length > 0) {
          waitlistPromoted = true;
        }
      }

      // Check waitlist queue
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

    // Prepare feedback message
    let feedback = '';

    // 3. Handle Cancel action
    if (role === 'Cancel') {
      this.sanitizeData();
      if (!removedFromRole) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'ℹ️ You are not currently registered for any role.',
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
        } else {
          await interaction.followUp({
            content: 'ℹ️ You are not currently registered for any role.',
            flags: MessageFlags.Ephemeral,
          }).catch(() => {});
        }
        return;
      }

      if (wasWaitlisted) {
        feedback = `❌ You have been removed from the **${removedFromRole}** waitlist.`;
      } else {
        feedback = `❌ You have cancelled your registration for **${removedFromRole}**.`;
      }
    } else {
      // 4. Handle Role Join (e.g. Main Ball or specialized roles)
      const fallbackLimit = this.sessionType === 'siege' ? (DEFAULT_SIEGE_ROLE_LIMITS[role] ?? 1) : (DEFAULT_ROLE_LIMITS[role] ?? 1);
      const limit = (this.limits[role] && this.limits[role] > 0) ? this.limits[role] : fallbackLimit;

      if (!this.data[role]) this.data[role] = [];
      if (!this.memberData[role]) this.memberData[role] = [];
      if (!this.waitlist[role]) this.waitlist[role] = [];
      if (!this.memberWaitlist[role]) this.memberWaitlist[role] = [];

      // Clean role data inline to be 100% sure no phantom entries consume slots
      const isBadName = (n: any) => {
        if (!n) return true;
        const cleaned = String(n).replace(/^[•\-\*\s]+/, '').trim();
        return !cleaned || cleaned === '-' || cleaned === '—' || cleaned === '–';
      };
      this.data[role] = this.data[role].filter((n) => !isBadName(n));
      this.memberData[role] = this.memberData[role].filter((m) => m && !isBadName(m.name));

      if (this.data[role].length < limit) {
        // Slot available -> Add to Active Roster
        this.data[role].push(displayName);
        this.memberData[role].push(member);
        feedback = `✅ You have successfully registered for **${role}**! (${this.data[role].length}/${limit})`;
      } else {
        // Role is Full -> Place on Waitlist
        this.waitlist[role].push(displayName);
        this.memberWaitlist[role].push(member);
        const position = this.waitlist[role].length;
        feedback = `⚠️ **${role}** is currently full (${this.data[role].length}/${limit}). You have been placed on the **Waitlist** (Position #${position}). If a slot opens up, you will automatically be promoted!`;
      }
    }

    // Cache message reference immediately
    this.client[this.messageKey('mainMsg')] = interaction.message;
    this.client[this.messageKey('mainMsgId')] = interaction.message.id;

    // Fast-path: Update Discord message directly via interaction callback (ZERO DELAY!)
    const { mainEmb } = this.buildEmbeds();
    const components = this.buildComponents();
    let updatedViaInteraction = false;

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.update({ embeds: [mainEmb], components });
        updatedViaInteraction = true;
      } catch (updateErr: any) {
        if (updateErr?.code === 10062) {
          log('DEBUG', 'Fast-path interaction token expired (10062); will update via channel message.');
        } else {
          log('WARN', `Fast-path interaction.update failed: ${updateErr?.message || updateErr}`);
        }
      }
    }

    // Deliver ephemeral confirmation popup
    if (feedback) {
      try {
        if (updatedViaInteraction || interaction.deferred) {
          await interaction.followUp({ content: feedback, flags: MessageFlags.Ephemeral });
        } else if (!interaction.replied) {
          await interaction.reply({ content: feedback, flags: MessageFlags.Ephemeral });
        }
      } catch {
        // Non-fatal if ephemeral confirmation fails to deliver
      }
    }

    // Save state non-blockingly (notifies SSE for real-time dashboard sync)
    this.saveState();

    // If waitlist changed or fast-path didn't execute, trigger background update
    // If fast-path succeeded, skip editing mainMsg again to prevent Discord API rate limit delays
    if (!updatedViaInteraction) {
      this.triggerDiscordUpdate(50, false);
    } else if (waitlistPromoted || wasWaitlisted || this.client[this.messageKey('waitlistMsgId')]) {
      this.triggerDiscordUpdate(50, true);
    }
  }

  // Programmatic assignment from Web UI
  assignMember(role: string, name: string, id?: string) {
    if (this.isClosed) return { success: false, message: 'Session is closed' };
    const user = name.trim();

    // Preserve existing member ID if already registered
    let memberId = id;
    if (!memberId || memberId.startsWith('web-')) {
      for (const r of Object.keys(this.limits)) {
        const found = (this.memberData[r] || []).find((m) => m.name.toLowerCase() === user.toLowerCase()) ||
                      (this.memberWaitlist[r] || []).find((m) => m.name.toLowerCase() === user.toLowerCase());
        if (found?.id) {
          memberId = found.id;
          break;
        }
      }
    }
    if (!memberId) {
      memberId = `web-${Date.now()}`;
    }

    const member: MemberRecord = { id: memberId, name: user };

    // Remove from existing roles
    for (const r of Object.keys(this.limits)) {
      const idx = this.findMemberIndex(this.data[r] || [], this.memberData[r] || [], member.id, user);
      if (idx !== -1) {
        this.data[r].splice(idx, 1);
        if (this.memberData[r]?.length > idx) {
          this.memberData[r].splice(idx, 1);
        }
        // Promote waitlist if slot opened
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

    if (role === 'Cancel') {
      this.saveState();
      this.triggerDiscordUpdate(100);
      return { success: true, message: `Removed ${user}` };
    }

    if (!this.limits[role] && this.limits[role] !== 0) {
      return { success: false, message: `Invalid role ${role}` };
    }

    let status = 'roster';
    if (this.data[role].length < this.limits[role]) {
      this.data[role].push(user);
      this.memberData[role].push(member);
    } else {
      this.waitlist[role].push(user);
      this.memberWaitlist[role].push(member);
      status = 'waitlist';
    }

    this.saveState();
    this.triggerDiscordUpdate(100);
    return { success: true, status, message: `${user} added to ${role} (${status})` };
  }

  // Move a member from one squad/role to another
  moveMember(nameOrId: string, toRole: string) {
    if (this.isClosed) return { success: false, message: 'Session is closed' };
    if (!this.limits[toRole] && this.limits[toRole] !== 0) {
      return { success: false, message: `Invalid target role: ${toRole}` };
    }

    let foundMember: MemberRecord | null = null;
    let fromRole: string | null = null;

    // Search and remove from existing role
    for (const r of Object.keys(this.limits)) {
      const idx = this.findMemberIndex(this.data[r] || [], this.memberData[r] || [], nameOrId, nameOrId);
      if (idx !== -1) {
        foundMember = this.memberData[r]?.[idx] || { id: `web-${Date.now()}`, name: this.data[r][idx] };
        fromRole = r;
        this.data[r].splice(idx, 1);
        if (this.memberData[r]?.length > idx) {
          this.memberData[r].splice(idx, 1);
        }
        this.promoteWaitlist(r);
        break;
      }
      const wIdx = this.findMemberIndex(this.waitlist[r] || [], this.memberWaitlist[r] || [], nameOrId, nameOrId);
      if (wIdx !== -1) {
        foundMember = this.memberWaitlist[r]?.[wIdx] || { id: `web-${Date.now()}`, name: this.waitlist[r][wIdx] };
        fromRole = r;
        this.waitlist[r].splice(wIdx, 1);
        if (this.memberWaitlist[r]?.length > wIdx) {
          this.memberWaitlist[r].splice(wIdx, 1);
        }
        break;
      }
    }

    if (!foundMember) {
      return { success: false, message: `Member "${nameOrId}" not found in current roster` };
    }

    // Insert into target role
    let status = 'roster';
    if (this.data[toRole].length < this.limits[toRole]) {
      this.data[toRole].push(foundMember.name);
      this.memberData[toRole].push(foundMember);
    } else {
      this.waitlist[toRole].push(foundMember.name);
      this.memberWaitlist[toRole].push(foundMember);
      status = 'waitlist';
    }

    this.saveState();
    this.triggerDiscordUpdate(100);
    return {
      success: true,
      fromRole,
      toRole,
      status,
      name: foundMember.name,
      message: `Moved ${foundMember.name} from ${fromRole} to ${toRole} (${status})`,
    };
  }

  removeMember(nameOrId: string) {
    let removed = false;
    const clean = String(nameOrId || '').trim();
    if (!clean || clean === '-' || clean === '—' || clean === '–' || clean.toLowerCase() === 'none') {
      this.sanitizeData();
      this.saveState();
      this.triggerDiscordUpdate(50);
      return true;
    }
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
}
