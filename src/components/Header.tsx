import React, { useEffect, useState } from 'react';
import { BotStatus } from '../types';
import {
  Shield,
  Swords,
  Castle,
  Lock,
  Bell,
  Download,
  Wifi,
  WifiOff,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  status: BotStatus | null;
  onAction: (action: string) => Promise<void>;
  loadingAction: string | null;
  onRefresh: () => void;
  message: { type: 'success' | 'error'; text: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onAction,
  loadingAction,
  onRefresh,
  message,
}) => {
  const [jakartaTime, setJakartaTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        });
        setJakartaTime(formatter.format(now));
      } catch {
        setJakartaTime(new Date().toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = status?.bot.isReady;

  return (
    <header className="bg-[#1b1e23] border-b border-[#2d323b] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Bot Status */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-black text-xl">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  BDO Guild War Commander
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#272b33] border border-slate-700 text-slate-400 font-mono">
                  v2.0
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {isOnline ? (
                    <span className="text-emerald-400 font-medium">
                      Bot Online ({status?.bot.tag || 'Connected'})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      Dashboard Mode (Bot Standby)
                    </span>
                  )}
                </span>
                {status?.currentGuild && (
                  <span className="hidden sm:inline-block text-slate-500">
                    • Guild: <strong className="text-slate-300">{status.currentGuild.name}</strong>
                  </span>
                )}
                {isOnline && status?.bot.ping !== null && (
                  <span className="hidden sm:inline-block text-slate-500">
                    • {status.bot.ping}ms
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Timing & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Server clock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono text-slate-300 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{jakartaTime} (WIB)</span>
            </div>

            {/* Refresh */}
            <button
              id="refresh-status-btn"
              onClick={onRefresh}
              title="Refresh status"
              className="p-1.5 rounded-lg bg-[#242730] hover:bg-[#2d323b] border border-[#333842] text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-open-node-war"
                disabled={loadingAction !== null}
                onClick={() => onAction('open-node-war')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Open NW</span>
              </button>

              <button
                id="btn-open-siege"
                disabled={loadingAction !== null}
                onClick={() => onAction('open-siege')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Castle className="w-3.5 h-3.5" />
                <span>Open Siege</span>
              </button>

              <button
                id="btn-close-rsvp"
                disabled={loadingAction !== null}
                onClick={() => onAction('close-node-war')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2e323b] hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 border border-[#3c424e] text-slate-300 text-xs font-medium transition-all"
                title="Close Active Node War RSVP"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Close</span>
              </button>

              <button
                id="btn-send-reminder"
                disabled={loadingAction !== null}
                onClick={() => onAction('send-reminder')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2e323b] hover:bg-amber-950/60 hover:text-amber-300 hover:border-amber-700/60 border border-[#3c424e] text-slate-300 text-xs font-medium transition-all"
                title="Send Vote Reminders to Discord"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remind</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action toast message */}
        {message && (
          <div
            className={`mt-2.5 px-3 py-2 rounded-lg text-xs flex items-center gap-2 border transition-all ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </header>
  );
};
