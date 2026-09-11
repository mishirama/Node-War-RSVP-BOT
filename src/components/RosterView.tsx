import React, { useState } from 'react';
import { SessionData, MemberRecord } from '../types';
import { RoleIcon } from './RoleIcon';
import {
  Swords,
  Castle,
  Users,
  Clock,
  Check,
  Copy,
  Plus,
  Trash2,
  AlertTriangle,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface RosterViewProps {
  mode: 'node' | 'siege';
  onModeChange: (mode: 'node' | 'siege') => void;
  sessionData: SessionData | null;
  limits: Record<string, number>;
  isClosed: boolean;
  priorityUsers: MemberRecord[];
  onAssignMember: (role: string, name: string) => Promise<boolean>;
  onRemoveMember: (nameOrId: string) => Promise<boolean>;
  roleEmojis: Record<string, string>;
}

export const RosterView: React.FC<RosterViewProps> = ({
  mode,
  onModeChange,
  sessionData,
  limits,
  isClosed,
  priorityUsers,
  onAssignMember,
  onRemoveMember,
  roleEmojis,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState('Main Ball');
  const [submitting, setSubmitting] = useState(false);

  const roles = Object.keys(limits);
  const data = sessionData?.data || {};
  const waitlist = sessionData?.waitlist || {};

  // Calculate totals
  const totalRegistered = Object.values(data).reduce<number>((sum, arr) => sum + ((arr as string[])?.length || 0), 0);
  const totalSlots = Object.values(limits).reduce<number>((sum, num) => sum + (Number(num) || 0), 0);
  const totalWaitlist = Object.values(waitlist).reduce<number>((sum, arr) => sum + ((arr as string[])?.length || 0), 0);

  const handleCopyDiscordRoster = () => {
    if (!sessionData) return;
    const lines: string[] = [
      `🛡️ **${mode === 'siege' ? 'SIEGE WAR' : 'NODE WAR'} ROSTER** — ${sessionData.target_date}`,
      `Total: ${totalRegistered}/${totalSlots} registered ${isClosed ? '(LOCKED)' : ''}`,
      '',
    ];

    for (const role of roles) {
      const users = data[role] || [];
      const limit = limits[role] || 0;
      const rawEmoji = roleEmojis[role] || '⚔️';
      let emoji = rawEmoji;
      if (role === 'Witch/Wizard' && (rawEmoji === '🧙' || rawEmoji === '1544202932256252167')) {
        emoji = '<:Witch:1544202932256252167><:Wizard:1544202904817373224>';
      } else if (/^\d+$/.test(rawEmoji.trim())) {
        const cleanRole = role.replace(/[^a-zA-Z0-9_]/g, '') || 'emoji';
        emoji = `<:${cleanRole}:${rawEmoji.trim()}>`;
      }
      lines.push(`${emoji} **${role}** (${users.length}/${limit}):`);
      if (users.length) {
        users.forEach((u) => lines.push(`• ${u}`));
      } else {
        lines.push('• (empty)');
      }
      lines.push('');
    }

    if (totalWaitlist > 0) {
      lines.push('📋 **Waitlist / Backups**:');
      for (const role of roles) {
        const users = waitlist[role] || [];
        if (users.length) {
          lines.push(`• ${role}: ${users.join(', ')}`);
        }
      }
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setSubmitting(true);
    const ok = await onAssignMember(addRole, addName.trim());
    setSubmitting(false);
    if (ok) {
      setAddName('');
      setIsAddOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Mode Switcher, Stats & Search */}
      <div className="bg-[#202329] border border-[#343943] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-[#17191d] rounded-xl border border-[#2d323b] w-fit">
            <button
              id="tab-node-war"
              onClick={() => onModeChange('node')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'node'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Node War Roster</span>
            </button>
            <button
              id="tab-siege-war"
              onClick={() => onModeChange('siege')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'siege'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Castle className="w-4 h-4" />
              <span>Siege War (100 Pax)</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#17191d] border border-[#2d323b] text-xs">
              <span className="text-slate-400">Date:</span>
              <strong className="text-slate-200 font-mono">
                {sessionData?.target_date || 'No Date'}
              </strong>
              {isClosed ? (
                <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> CLOSED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#17191d] border border-[#2d323b] text-xs">
              <span className="text-slate-400">Slots:</span>
              <strong className="text-indigo-400 font-bold">
                {totalRegistered} / {totalSlots}
              </strong>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400 font-medium">Waitlist: {totalWaitlist}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                id="btn-copy-discord-roster"
                onClick={handleCopyDiscordRoster}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a2e36] hover:bg-[#343943] text-slate-200 hover:text-white border border-[#3e4450] text-xs font-semibold transition-colors"
                title="Copy Discord-formatted roster text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Copy Roster</span>
                  </>
                )}
              </button>

              <button
                id="btn-open-add-member"
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mt-4 pt-3 border-t border-[#2d323b] flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              id="filter-roster-input"
              type="text"
              placeholder="Search player name or squad tag (e.g., [RB], [TC])..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#17191d] border border-[#2d323b] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Priority Bench Notice if present in Node War */}
      {mode === 'node' && priorityUsers.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-600/40 rounded-xl p-3.5 flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="text-amber-300 font-bold block">
              ⭐ 3-Day Consecutive Bench Priority Active:
            </strong>
            <p className="text-slate-300">
              The following members were waitlisted on 3 consecutive previous war days and receive
              automatic front-row priority in today&apos;s Main Ball:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {priorityUsers.map((u) => (
                <span
                  key={u.id}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40 font-mono font-semibold"
                >
                  {u.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const users = data[role] || [];
          const waitlistUsers = waitlist[role] || [];
          const limit = limits[role] || 0;
          const isFull = users.length >= limit;

          // Filter by search query
          const filteredUsers = searchQuery
            ? users.filter((u) => u.toLowerCase().includes(searchQuery.toLowerCase()))
            : users;

          const filteredWaitlist = searchQuery
            ? waitlistUsers.filter((u) => u.toLowerCase().includes(searchQuery.toLowerCase()))
            : waitlistUsers;

          if (searchQuery && filteredUsers.length === 0 && filteredWaitlist.length === 0) {
            return null;
          }

          const fillPercentage = limit > 0 ? Math.min(100, Math.round((users.length / limit) * 100)) : 0;

          return (
            <div
              key={role}
              className={`bg-[#202329] border rounded-xl overflow-hidden flex flex-col transition-all ${
                role === 'Main Ball'
                  ? 'md:col-span-2 lg:col-span-2 border-indigo-500/40 shadow-sm'
                  : 'border-[#343943]'
              }`}
            >
              {/* Role Card Header */}
              <div className="p-3.5 bg-[#262a32] border-b border-[#343943] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1b1e24] border border-[#343943] flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                    <RoleIcon role={role} size="md" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{role}</span>
                      {isFull && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          Full
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isFull ? 'text-indigo-400' : 'text-slate-300'
                    }`}
                  >
                    {users.length} / {limit}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-[#17191d]">
                <div
                  className={`h-full transition-all duration-300 ${
                    fillPercentage >= 100
                      ? 'bg-indigo-500'
                      : fillPercentage > 70
                      ? 'bg-emerald-500'
                      : 'bg-slate-500'
                  }`}
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>

              {/* Members List */}
              <div className="p-3 flex-1 space-y-1.5">
                {filteredUsers.length > 0 ? (
                  <div
                    className={`grid gap-1.5 ${
                      role === 'Main Ball'
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1'
                    }`}
                  >
                    {filteredUsers.map((name, idx) => (
                      <div
                        key={`${name}-${idx}`}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1a1d22] border border-[#2d323b] hover:border-slate-600 text-xs transition-colors group"
                      >
                        <span className="font-medium text-slate-200 truncate pr-2 flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                          <span className="truncate">{name}</span>
                        </span>
                        <button
                          onClick={() => onRemoveMember(name)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 rounded transition-opacity"
                          title="Remove from roster"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-slate-500 italic">
                    {searchQuery ? 'No matching members in squad' : 'No members registered yet'}
                  </div>
                )}

                {/* Waitlist section for this role */}
                {filteredWaitlist.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#2d323b]">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1 mb-1.5">
                      <span>Waitlist Queue ({filteredWaitlist.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredWaitlist.map((wUser, wIdx) => (
                        <span
                          key={wIdx}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]"
                        >
                          <span className="text-[9px] text-amber-400/70 font-mono">Q{wIdx + 1}</span>
                          <span>{wUser}</span>
                          <button
                            onClick={() => onRemoveMember(wUser)}
                            className="hover:text-rose-400 text-amber-400/60 transition-colors"
                            title="Remove from waitlist"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Add Member Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#202329] border border-[#383e49] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e333d]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Register Member Manually</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Player In-Game Name / Discord Nickname
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. [RB] Killua or [TC] Alexis"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#17191d] border border-[#343943] text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Squad / Role
                </label>
                
                {/* Visual Role Selector Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 mb-2.5">
                  {roles.map((r) => {
                    const isSelected = addRole === r;
                    const count = data[r]?.length || 0;
                    const lim = limits[r] || 0;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAddRole(r)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                            : 'bg-[#17191d] border-[#2d323b] text-slate-300 hover:border-[#3d4452]'
                        }`}
                      >
                        <div className="w-5 h-5 rounded bg-[#202329] border border-[#343943] flex items-center justify-center p-0.5 shrink-0">
                          <RoleIcon role={r} size="sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold truncate leading-tight">{r}</p>
                          <p className="text-[9px] text-slate-400 font-mono leading-none">{count}/{lim}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#17191d] border border-[#343943] text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r} ({data[r]?.length || 0}/{limits[r] || 0})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  If the squad is at full capacity, the player will be automatically placed in the
                  waitlist queue.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2e333d]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#2a2e36] hover:bg-[#343943] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !addName.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {submitting ? 'Adding...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
