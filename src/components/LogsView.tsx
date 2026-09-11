import React, { useEffect, useState } from 'react';
import { LogEntry, BenchHistoryEntry, MemberRecord } from '../types';
import {
  FileText,
  History,
  Download,
  RefreshCw,
  Award,
  AlertCircle,
  KeyRound,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface LogsViewProps {
  logs: LogEntry[];
  onRefreshLogs: () => void;
  benchHistory: BenchHistoryEntry[];
  priorityUsers: MemberRecord[];
}

export const LogsView: React.FC<LogsViewProps> = ({
  logs,
  onRefreshLogs,
  benchHistory,
  priorityUsers,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setConnecting(true);
    setConnectMsg(null);
    try {
      const res = await fetch('/api/bot/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setConnectMsg({ type: 'success', text: `Logged in as ${data.tag}!` });
        setTokenInput('');
      } else {
        setConnectMsg({ type: 'error', text: data.error || 'Login failed' });
      }
    } catch (err: any) {
      setConnectMsg({ type: 'error', text: err?.message || 'Network error' });
    } finally {
      setConnecting(false);
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'RSVP':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'SIEGE':
        return 'bg-violet-500/20 text-violet-300 border-violet-500/40';
      case 'BOT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'CONFIG':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'REMINDER':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'ERROR':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Backup JSON Download Banners */}
      <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Saved Roster Backups</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Download raw state JSON files for offline analysis or archiving.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/backup/node"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2a2e36] hover:bg-[#343943] border border-[#3e4450] text-slate-200 hover:text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Node War JSON</span>
          </a>
          <a
            href="/api/backup/siege"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2a2e36] hover:bg-[#343943] border border-[#3e4450] text-slate-200 hover:text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-violet-400" />
            <span>Siege War JSON</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Logs */}
        <div className="lg:col-span-2 bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2d323b]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Live Bot System Activity Logs</h3>
            </div>
            <button
              onClick={onRefreshLogs}
              className="p-1.5 rounded-lg bg-[#17191d] hover:bg-[#252830] text-slate-400 hover:text-slate-200 border border-[#2d323b] text-xs transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {logs.length > 0 ? (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2 rounded-lg bg-[#17191d] border border-[#272b32] flex items-start gap-2.5 hover:border-slate-700 transition-colors"
                >
                  <span className="text-slate-500 shrink-0 text-[11px]">{entry.time}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 border ${categoryColor(
                      entry.category
                    )}`}
                  >
                    {entry.category}
                  </span>
                  <span className="text-slate-200 break-words flex-1">{entry.message}</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 italic">No activity logs recorded yet.</div>
            )}
          </div>
        </div>

        {/* Right Col: Bench History & Priority Queue */}
        <div className="space-y-6">
          {/* Bench Priority Box */}
          <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#2d323b]">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">3-Day Bench Priority</h3>
            </div>
            <p className="text-xs text-slate-400">
              Members benched for 3 consecutive wars get automatic first priority in the next Node
              War.
            </p>

            {priorityUsers.length > 0 ? (
              <div className="space-y-1.5">
                {priorityUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-semibold"
                  >
                    <span>⭐ {u.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono">PRIORITY</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 italic bg-[#17191d] rounded-xl border border-[#2d323b]">
                No consecutive 3-day benched users currently queued.
              </div>
            )}
          </div>

          {/* Past Benched History Log */}
          <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#2d323b]">
              <History className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Recent Waitlist Archives</h3>
            </div>
            <p className="text-xs text-slate-400">Past dates with benched participants:</p>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 text-xs">
              {benchHistory.length > 0 ? (
                benchHistory.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-[#17191d] border border-[#2d323b] space-y-1">
                    <div className="flex items-center justify-between text-slate-300 font-mono font-bold">
                      <span>{h.date}</span>
                      <span className="text-[11px] text-slate-400">{h.users?.length || 0} benched</span>
                    </div>
                    {h.users && h.users.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {h.users.map((u, ui) => (
                          <span
                            key={ui}
                            className="px-1.5 py-0.5 rounded bg-[#242730] text-slate-300 text-[10px]"
                          >
                            {u.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 italic bg-[#17191d] rounded-xl border border-[#2d323b]">
                  No past bench history saved yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
