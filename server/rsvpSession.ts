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
} from 'discord.js';
import { CONFIG, DATA_FILE, log } from './config.js';
import { ROLE_EMOJIS, DAY_KEYS, ROLE_BUTTONS, formatDiscordRoleEmoji } from './constants.js';

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

  saveState() {
    try {
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
    } catch (err) {
      log('ERROR', `Failed to save state to ${this.dataFile}: ${err}`);
    }
  }

  buildEmbeds() {
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

    for (const [role, users] of Object.entries(this.data)) {
      const limit = this.limits[role] ?? 0;
      mainEmb.addFields({
        name: `${formatDiscordRoleEmoji(role)} ${role} (${users.length}/${limit})`,
        value: users.length ? users.map((u) => `• ${u}`).join('\n') : '-',
        inline: true,
      });
    }
    const totalReg = Object.values(this.data).reduce((a, arr) => a + arr.length, 0);
    mainEmb.addFields({
      name: '📊 Summary',
      value: `**Total Registered: ${totalReg}/${totalSlots}**`,
      inline: false,
    });

    const anyWaitlist = Object.values(this.waitlist).some((arr) => arr.length);
    const waitEmb = new EmbedBuilder()
      .setTitle('📋 Waitlist / Backups')
      .setColor(0xfaa61a)
      .setDescription(anyWaitlist ? '' : 'No backups currently in queue.');
    for (const [role, users] of Object.entries(this.waitlist)) {
      if (users.length) {
        waitEmb.addFields({
          name: `${formatDiscordRoleEmoji(role)} ${role} Backups (${users.length})`,
          value: users.map((u) => `• ${u}`).join('\n'),
          inline: true,
        });
      }
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

  triggerDiscordUpdate(delayMs = 100) {
    this._updatePending = true;
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
        const ch = await this.client.channels.fetch(channelId).catch(() => null);
        if (ch && ch.isTextBased()) {
          const mainMsgKey = this.messageKey('mainMsg');
          const mainMsgIdKey = this.messageKey('mainMsgId');
          const waitlistMsgKey = this.messageKey('waitlistMsg');
          const waitlistMsgIdKey = this.messageKey('waitlistMsgId');

          if (!this.client[mainMsgKey] && this.client[mainMsgIdKey]) {
            this.client[mainMsgKey] = await ch.messages
              .fetch(this.client[mainMsgIdKey])
              .catch((e: any) => {
                log('ERROR', `Failed to fetch main message: ${e}`);
                return null;
              });
          }
          if (!this.client[waitlistMsgKey] && this.client[waitlistMsgIdKey]) {
            this.client[waitlistMsgKey] = await ch.messages
              .fetch(this.client[waitlistMsgIdKey])
              .catch((e: any) => {
                log('ERROR', `Failed to fetch waitlist message: ${e}`);
                return null;
              });
          }
        }
      }

      const mainMsg = this.client[this.messageKey('mainMsg')];
      const waitlistMsg = this.client[this.messageKey('waitlistMsg')];

      if (mainMsg) {
        await mainMsg.edit({ embeds: [mainEmb], components: this.buildComponents() });
      }
      if (waitlistMsg) {
        await waitlistMsg.edit({ embeds: [waitEmb] });
      }
      this.saveState();
      log('SUCCESS', `RSVP Embeds updated on Discord for ${this.sessionType}.`);
    } catch (e) {
      log('ERROR', `Batch update failed: ${e}`);
    } finally {
      this._updateInFlight = false;
      if (this._updatePending) {
        this.triggerDiscordUpdate(50);
      }
    }
  }

  async batchUpdateDiscord() {
    this.triggerDiscordUpdate(100);
  }

  async processRoleSelection(interaction: ButtonInteraction, role: string) {
    if (this.isClosed) return;
    await interaction.deferUpdate();
    const user = (interaction.member as any)?.displayName || interaction.user.username;
    const member = { id: interaction.user.id, name: user };

    // Remove from existing roles
    for (const r of Object.keys(this.limits)) {
      const idx = this.data[r].findIndex(
        (savedName, index) => this.memberData[r][index]?.id === member.id || savedName === user
      );
      if (idx !== -1) {
        this.data[r].splice(idx, 1);
        this.memberData[r].splice(idx, 1);
        if (this.waitlist[r]?.length) {
          this.data[r].push(this.waitlist[r].shift()!);
          this.memberData[r].push(this.memberWaitlist[r].shift()!);
        }
      }
      const wIdx = this.waitlist[r].findIndex(
        (savedName, index) => this.memberWaitlist[r][index]?.id === member.id || savedName === user
      );
      if (wIdx !== -1) {
        this.waitlist[r].splice(wIdx, 1);
        this.memberWaitlist[r].splice(wIdx, 1);
      }
    }

    if (role !== 'Cancel') {
      if (this.data[role].length < (this.limits[role] || 0)) {
        this.data[role].push(user);
        this.memberData[role].push(member);
      } else {
        this.waitlist[role].push(user);
        this.memberWaitlist[role].push(member);
        await interaction.followUp({
          content: `⚠️ ${role} full! Handled into Waitlist.`,
          ephemeral: true,
        }).catch(() => {});
      }
    }

    this.triggerDiscordUpdate(100);
  }

  // Programmatic assignment from Web UI
  assignMember(role: string, name: string, id: string = `web-${Date.now()}`) {
    if (this.isClosed) return { success: false, message: 'Session is closed' };
    const member: MemberRecord = { id, name: name.trim() };
    const user = member.name;

    // Remove from existing roles
    for (const r of Object.keys(this.limits)) {
      const idx = this.data[r].findIndex(
        (n, i) => this.memberData[r]?.[i]?.id === member.id || n.toLowerCase() === user.toLowerCase()
      );
      if (idx !== -1) {
        this.data[r].splice(idx, 1);
        this.memberData[r].splice(idx, 1);
        if (this.waitlist[r]?.length) {
          this.data[r].push(this.waitlist[r].shift()!);
          this.memberData[r].push(this.memberWaitlist[r].shift()!);
        }
      }
      const wIdx = this.waitlist[r].findIndex(
        (n, i) => this.memberWaitlist[r]?.[i]?.id === member.id || n.toLowerCase() === user.toLowerCase()
      );
      if (wIdx !== -1) {
        this.waitlist[r].splice(wIdx, 1);
        this.memberWaitlist[r].splice(wIdx, 1);
      }
    }

    if (role === 'Cancel') {
      this.saveState();
      this.batchUpdateDiscord().catch(() => {});
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
    this.batchUpdateDiscord().catch(() => {});
    return { success: true, status, message: `${user} added to ${role} (${status})` };
  }

  removeMember(nameOrId: string) {
    let removed = false;
    for (const r of Object.keys(this.limits)) {
      const idx = this.data[r].findIndex(
        (n, i) => n.toLowerCase() === nameOrId.toLowerCase() || this.memberData[r]?.[i]?.id === nameOrId
      );
      if (idx !== -1) {
        this.data[r].splice(idx, 1);
        this.memberData[r].splice(idx, 1);
        if (this.waitlist[r]?.length) {
          this.data[r].push(this.waitlist[r].shift()!);
          this.memberData[r].push(this.memberWaitlist[r].shift()!);
        }
        removed = true;
      }
      const wIdx = this.waitlist[r].findIndex(
        (n, i) => n.toLowerCase() === nameOrId.toLowerCase() || this.memberWaitlist[r]?.[i]?.id === nameOrId
      );
      if (wIdx !== -1) {
        this.waitlist[r].splice(wIdx, 1);
        this.memberWaitlist[r].splice(wIdx, 1);
        removed = true;
      }
    }
    if (removed) {
      this.saveState();
      this.batchUpdateDiscord().catch(() => {});
    }
    return removed;
  }
}
