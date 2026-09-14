import React, { useState } from 'react';
import { AppConfig, BotStatus } from '../types';
import {
  Bot,
  Save,
  CheckCircle,
  Hash,
  ShieldCheck,
  Tag,
  Radio,
  Clock,
  Terminal,
  Server,
  Layers,
  Key,
  Cpu,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface BotConfigViewProps {
  config: AppConfig;
  status: BotStatus | null;
  onSaveConfig: (updated: Partial<AppConfig>) => Promise<boolean>;
}

export const BotConfigView: React.FC<BotConfigViewProps> = ({
  config,
  status,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    const ok = await onSaveConfig(formData);
    setSaving(false);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const guilds = status?.guilds || [];
  const channels = status?.channels || [];
  const roles = status?.roles || [];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Standalone Hosting & Token Banner */}
      <div className="bg-[#202329] border border-indigo-500/30 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d323b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Standalone Bot & Token Configuration</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  No Gemini API Needed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Powered 100% by native Discord.js WebSocket Gateway. Deployable on Wispbyte, Pterodactyl, or any Node.js host.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                status?.bot.isReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-mono font-bold text-slate-200">
              {status?.bot.isReady ? status.bot.tag : status?.bot.hasToken ? 'Connecting...' : 'Token Required'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero External AI Dependencies</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              No Google Gemini API key or billing required. All reminders, timers, capacity checks, and embeds run completely offline & local.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Token Resolution Order</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Automatically checks <code className="text-indigo-300 font-mono">.env</code> (<code className="text-indigo-300 font-mono">DISCORD_TOKEN</code>), host environment variables, and <code className="text-indigo-300 font-mono">config.json</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Wispbyte / Pterodactyl Ready</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Start script configured to <code className="text-amber-300 font-mono">npm start</code> (runs <code className="text-amber-300 font-mono">node index.js</code>). Handles auto-recovery and 24/7 background operation.
            </p>
          </div>
        </div>
      </div>

      {/* Bot & Gateway Connection Info */}
      <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d323b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Discord Server & Channel Routing</h3>
              <p className="text-xs text-slate-400">
                Configure Discord server binding, designated channels, admin roles, and alert
                routing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                status?.bot.isReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-mono font-bold text-slate-300">
              {status?.bot.isReady ? status.bot.tag : 'Gateway Standby'}
            </span>
          </div>
        </div>

        {/* Server & Channels Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Server Selector */}
          <div className="p-4 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Target Discord Server (Guild ID)</span>
            </label>
            {guilds.length > 0 ? (
              <select
                value={formData.SERVER_ID}
                onChange={(e) => handleChange('SERVER_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                {guilds.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Discord Server ID (e.g., 1543436950466330676)"
                value={formData.SERVER_ID}
                onChange={(e) => handleChange('SERVER_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            )}
            <p className="text-[11px] text-slate-400">
              The Discord Guild where slash commands and RSVP embeds operate.
            </p>
          </div>

          {/* RSVP Target Channel */}
          <div className="p-4 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-indigo-400" />
              <span>Node War RSVP Channel</span>
            </label>
            {channels.length > 0 ? (
              <select
                value={formData.CHANNEL_ID}
                onChange={(e) => handleChange('CHANNEL_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    # {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="RSVP Channel ID (e.g., 1543437822520856738)"
                value={formData.CHANNEL_ID}
                onChange={(e) => handleChange('CHANNEL_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            )}
            <p className="text-[11px] text-slate-400">
              The public Discord channel where the Node War RSVP buttons and rosters are posted.
            </p>
          </div>

          {/* Log / Backup Channel */}
          <div className="p-4 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-indigo-400" />
              <span>Backup & Log Channel</span>
            </label>
            {channels.length > 0 ? (
              <select
                value={formData.LOG_CHANNEL_ID}
                onChange={(e) => handleChange('LOG_CHANNEL_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    # {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Log Channel ID (e.g., 1543437822520856738)"
                value={formData.LOG_CHANNEL_ID}
                onChange={(e) => handleChange('LOG_CHANNEL_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            )}
            <p className="text-[11px] text-slate-400">
              Closed RSVP sessions automatically upload .json backup files here at 20:00 WIB.
            </p>
          </div>

          {/* Siege Channel */}
          <div className="p-4 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-violet-400" />
              <span>Siege War RSVP Channel</span>
            </label>
            {channels.length > 0 ? (
              <select
                value={formData.SIEGE_CHANNEL_ID}
                onChange={(e) => handleChange('SIEGE_CHANNEL_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    # {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Siege Channel ID (e.g., 1547628216246603816)"
                value={formData.SIEGE_CHANNEL_ID}
                onChange={(e) => handleChange('SIEGE_CHANNEL_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono text-white focus:outline-none focus:border-violet-500"
              />
            )}
            <p className="text-[11px] text-slate-400">
              Channel reserved specifically for Saturday Siege War roster coordination.
            </p>
          </div>

          {/* Admin Authorized Role */}
          <div className="p-4 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Authorized Officer Role ID</span>
            </label>
            {roles.length > 0 ? (
              <select
                value={formData.AUTHORIZED_ROLE_ID}
                onChange={(e) => handleChange('AUTHORIZED_ROLE_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    @ {r.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Role ID (e.g., 1547627722992521308)"
                value={formData.AUTHORIZED_ROLE_ID}
                onChange={(e) => handleChange('AUTHORIZED_ROLE_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            )}
            <p className="text-[11px] text-slate-400">
              Members with this role (or Administrator) can execute slash commands like
              /open-node-war.
            </p>
          </div>

          {/* Alliance Tag Role */}
          <div className="p-4 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Alliance Mention Role ID</span>
            </label>
            {roles.length > 0 ? (
              <select
                value={formData.ALLIANCE_ROLE_ID}
                onChange={(e) => handleChange('ALLIANCE_ROLE_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    @ {r.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Role ID (e.g., 1547627722992521308)"
                value={formData.ALLIANCE_ROLE_ID}
                onChange={(e) => handleChange('ALLIANCE_ROLE_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            )}
            <p className="text-[11px] text-slate-400">
              Tagged when Friday medals are announced or Node War reservations open.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2d323b]">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Routing configuration saved!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            id="btn-save-bot-routing"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Discord Routing'}</span>
          </button>
        </div>
      </div>

      {/* Bot Automation Schedule & Slash Commands Cheat Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduler Automation Timeline */}
        <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#2d323b]">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Automated Daily Scheduler</h3>
          </div>
          <p className="text-xs text-slate-400">
            The bot continuously runs on Asia/Jakarta (WIB) time with automated event hooks:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-[#17191d] border border-[#2d323b] flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold shrink-0">
                21:30 WIB
              </span>
              <div>
                <strong className="text-slate-200 block">Open Node War RSVP</strong>
                <span className="text-slate-400">
                  Posts the interactive embed and buttons for tomorrow&apos;s war, applying the 3-day
                  consecutive bench priority. (On Friday: announces standing medal reminder).
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#17191d] border border-[#2d323b] flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold shrink-0">
                17:00 WIB
              </span>
              <div>
                <strong className="text-slate-200 block">In-Game Vote Reminder</strong>
                <span className="text-slate-400">
                  Mentions active RSVP sign-ups in Discord to vote &quot;YES&quot; on the designated
                  territories (e.g., Calpheon/Ulukita for T2).
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#17191d] border border-[#2d323b] flex items-start gap-3">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold shrink-0">
                20:00 WIB
              </span>
              <div>
                <strong className="text-slate-200 block">Lock RSVP & Dispatch Backup</strong>
                <span className="text-slate-400">
                  Disables RSVP buttons on Discord, records waitlist history, and posts a .json
                  backup archive to the log channel.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Discord Slash Commands */}
        <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#2d323b]">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Discord Slash Commands</h3>
          </div>
          <p className="text-xs text-slate-400">
            Registered guild commands available in your server for guild officers:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-[#17191d] border border-[#2d323b] space-y-1">
              <div className="flex items-center gap-2">
                <code className="text-indigo-400 font-mono font-bold">/open-node-war</code>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                  Officer Only
                </span>
              </div>
              <p className="text-slate-300">
                Immediately posts a fresh Node War reservation embed in the configured channel
                without waiting for 21:30.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#17191d] border border-[#2d323b] space-y-1">
              <div className="flex items-center gap-2">
                <code className="text-rose-400 font-mono font-bold">/close-rsvp</code>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300">
                  Officer Only
                </span>
              </div>
              <p className="text-slate-300">
                Closes the current Node War sign-up, marks the message LOCKED, and sends a backup
                JSON file to the logs channel.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#17191d] border border-[#2d323b] space-y-1">
              <div className="flex items-center gap-2">
                <code className="text-violet-400 font-mono font-bold">/open-siege</code>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300">
                  Officer Only
                </span>
              </div>
              <p className="text-slate-300">
                Publishes a 100-pax Siege War reservation in the dedicated Siege channel with custom
                role buttons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
