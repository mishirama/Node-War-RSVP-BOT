import React, { useEffect, useState, useCallback } from 'react';
import {
  BotStatus,
  AppConfig,
  SessionData,
  CapacityWarning,
  BenchHistoryEntry,
  LogEntry,
  MemberRecord,
} from './types';
import { Header } from './components/Header';
import { RosterView } from './components/RosterView';
import { NodeWarSettings } from './components/NodeWarSettings';
import { SiegeSettings } from './components/SiegeSettings';
import { BotConfigView } from './components/BotConfigView';
import { LogsView } from './components/LogsView';
import {
  Shield,
  Swords,
  Castle,
  Settings,
  FileText,
  Radio,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'roster' | 'nodewar' | 'siege' | 'bot' | 'logs'>('roster');
  const [rosterMode, setRosterMode] = useState<'node' | 'siege'>('node');

  // Server state
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [warnings, setWarnings] = useState<CapacityWarning[]>([]);
  const [officialPax, setOfficialPax] = useState<Record<string, Record<string, number>>>({});
  const [roleEmojis, setRoleEmojis] = useState<Record<string, string>>({});

  const [nodeSession, setNodeSession] = useState<SessionData | null>(null);
  const [nodeLimits, setNodeLimits] = useState<Record<string, number>>({});
  const [isNodeClosed, setIsNodeClosed] = useState<boolean>(true);

  const [siegeSession, setSiegeSession] = useState<SessionData | null>(null);
  const [siegeLimits, setSiegeLimits] = useState<Record<string, number>>({});
  const [isSiegeClosed, setIsSiegeClosed] = useState<boolean>(true);

  const [benchHistory, setBenchHistory] = useState<BenchHistoryEntry[]>([]);
  const [priorityUsers, setPriorityUsers] = useState<MemberRecord[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Data fetching
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data: BotStatus = await res.json();
        setStatus(data);
      }
    } catch {
      // ignore transient errors
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setWarnings(data.warnings || []);
        setOfficialPax(data.officialPax || {});
        setRoleEmojis(data.roleEmojis || {});
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setNodeSession(data.node?.session || null);
        setNodeLimits(data.node?.limits || {});
        setIsNodeClosed(data.node?.isClosed ?? true);

        setSiegeSession(data.siege?.session || null);
        setSiegeLimits(data.siege?.limits || {});
        setIsSiegeClosed(data.siege?.isClosed ?? true);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchBenchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/bench-history');
      if (res.ok) {
        const data = await res.json();
        setBenchHistory(data.history || []);
        setPriorityUsers(data.priority || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchStatus(),
      fetchConfig(),
      fetchSessions(),
      fetchBenchHistory(),
      fetchLogs(),
    ]);
    setLoading(false);
  }, [fetchStatus, fetchConfig, fetchSessions, fetchBenchHistory, fetchLogs]);

  useEffect(() => {
    loadAll();

    // Real-time updates via Server-Sent Events (SSE)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'session_update') {
            fetchSessions();
            fetchStatus();
          }
        } catch {
          // ignore keepalive
        }
      };
      eventSource.onerror = () => {
        // Fallback silently to polling on reconnection
      };
    } catch {
      // ignore
    }

    // Polling fallback every 5 seconds for live updates
    const interval = setInterval(() => {
      fetchStatus();
      fetchSessions();
    }, 5000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [loadAll, fetchStatus, fetchSessions]);

  // Actions
  const handleAction = async (action: string) => {
    setLoadingAction(action);
    try {
      let endpoint = '';
      if (action === 'open-node-war') endpoint = '/api/actions/open-node-war';
      else if (action === 'close-node-war') endpoint = '/api/actions/close-node-war';
      else if (action === 'open-siege') endpoint = '/api/actions/open-siege';
      else if (action === 'close-siege') endpoint = '/api/actions/close-siege';
      else if (action === 'send-reminder') endpoint = '/api/actions/send-reminder';
      else if (action === 'sync-discord') endpoint = '/api/sync-discord';

      if (!endpoint) return;

      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || `Action ${action} succeeded`);
        await Promise.all([fetchSessions(), fetchStatus(), fetchLogs()]);
      } else {
        showToast('error', data.error || `Failed executing ${action}`);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Network error during action');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSaveConfig = async (updated: Partial<AppConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setWarnings(data.warnings || []);
        showToast('success', 'Configuration updated successfully');
        await fetchSessions();
        return true;
      } else {
        showToast('error', data.error || 'Failed saving configuration');
        return false;
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed saving configuration');
      return false;
    }
  };

  const handleAssignMember = async (role: string, name: string) => {
    try {
      const res = await fetch('/api/roster/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: rosterMode, role, name }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || `${name} added to ${role}`);
        await fetchSessions();
        return true;
      } else {
        showToast('error', data.error || data.message || 'Failed to assign member');
        return false;
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to assign member');
      return false;
    }
  };

  const handleRemoveMember = async (nameOrId: string) => {
    try {
      const res = await fetch('/api/roster/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: rosterMode, nameOrId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Removed ${nameOrId}`);
        await fetchSessions();
        return true;
      } else {
        showToast('error', data.error || 'Failed to remove member');
        return false;
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to remove member');
      return false;
    }
  };

  const handleMoveMember = async (nameOrId: string, toRole: string) => {
    try {
      const res = await fetch('/api/roster/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: rosterMode, nameOrId, toRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || `Moved ${nameOrId} to ${toRole}`);
        await fetchSessions();
        return true;
      } else {
        showToast('error', data.error || data.message || 'Failed to move member');
        return false;
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to move member');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#17191d] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg font-bold text-white tracking-wide">
            Loading Guild War Command Center...
          </span>
        </div>
        <p className="text-xs text-slate-500 font-mono">
          Connecting to Discord Gateway & Synchronizing Rosters...
        </p>
      </div>
    );
  }

  const activeSessionData = rosterMode === 'siege' ? siegeSession : nodeSession;
  const activeLimits = rosterMode === 'siege' ? siegeLimits : nodeLimits;
  const isCurrentClosed = rosterMode === 'siege' ? isSiegeClosed : isNodeClosed;

  return (
    <div className="min-h-screen bg-[#17191d] text-slate-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white">
      {/* Global Header */}
      <Header
        status={status}
        onAction={handleAction}
        loadingAction={loadingAction}
        onRefresh={loadAll}
        message={toastMessage}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#202329] border border-[#343943] rounded-2xl overflow-x-auto">
          <button
            id="nav-roster-tab"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#282c35]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>War Room (Live Rosters)</span>
          </button>

          <button
            id="nav-nodewar-tab"
            onClick={() => setActiveTab('nodewar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'nodewar'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#282c35]'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Node War Settings</span>
            {warnings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            id="nav-siege-tab"
            onClick={() => setActiveTab('siege')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'siege'
                ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#282c35]'
            }`}
          >
            <Castle className="w-4 h-4" />
            <span>Siege War Settings</span>
          </button>

          <button
            id="nav-bot-tab"
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'bot'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#282c35]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Discord Server Routing</span>
          </button>

          <button
            id="nav-logs-tab"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#282c35]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Logs & Archives</span>
          </button>
        </div>

        {/* Tab Content Views */}
        {activeTab === 'roster' && (
          <RosterView
            mode={rosterMode}
            onModeChange={setRosterMode}
            sessionData={activeSessionData}
            limits={activeLimits}
            isClosed={isCurrentClosed}
            priorityUsers={priorityUsers}
            onAssignMember={handleAssignMember}
            onMoveMember={handleMoveMember}
            onRemoveMember={handleRemoveMember}
            roleEmojis={roleEmojis}
          />
        )}

        {activeTab === 'nodewar' && config && (
          <NodeWarSettings
            config={config}
            warnings={warnings}
            officialPax={officialPax}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {activeTab === 'siege' && config && (
          <SiegeSettings
            config={config}
            channels={status?.channels || []}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {activeTab === 'bot' && config && (
          <BotConfigView
            config={config}
            status={status}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {activeTab === 'logs' && (
          <LogsView
            logs={logs}
            onRefreshLogs={fetchLogs}
            benchHistory={benchHistory}
            priorityUsers={priorityUsers}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2d323b] bg-[#14161a] py-4 text-center text-xs text-slate-500">
        <p>
          BDO Node War & Siege War Guild Commander • Discord Gateway Real-time Synchronized
        </p>
      </footer>
    </div>
  );
}
