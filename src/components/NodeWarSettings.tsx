import React, { useState } from 'react';
import { AppConfig, CapacityWarning } from '../types';
import { RoleIcon } from './RoleIcon';
import {
  Save,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Swords,
  Shield,
  Sliders,
  Sparkles,
  Bell,
  Clock,
  Send,
  Users,
} from 'lucide-react';

interface NodeWarSettingsProps {
  config: AppConfig;
  warnings: CapacityWarning[];
  officialPax: Record<string, Record<string, number>>;
  onSaveConfig: (updated: Partial<AppConfig>) => Promise<boolean>;
}

export const NodeWarSettings: React.FC<NodeWarSettingsProps> = ({
  config,
  warnings,
  officialPax,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<AppConfig>({ ...config });
  const [tierTab, setTierTab] = useState<'1' | '2'>('2');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingReminder, setTestingReminder] = useState(false);
  const [testReminderResult, setTestReminderResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const days: Array<{ key: string; label: string }> = [
    { key: 'SUN', label: 'Sunday' },
    { key: 'MON', label: 'Monday' },
    { key: 'TUE', label: 'Tuesday' },
    { key: 'WED', label: 'Wednesday' },
    { key: 'THU', label: 'Thursday' },
    { key: 'FRI', label: 'Friday' },
  ];

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleInsertTag = (tag: string) => {
    const current = formData.NW_REMINDER_MESSAGE || '';
    setFormData((prev) => ({ ...prev, NW_REMINDER_MESSAGE: `${current} ${tag}` }));
  };

  const handleSendTestReminder = async () => {
    setTestingReminder(true);
    setTestReminderResult(null);
    try {
      const res = await fetch('/api/actions/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customMessage: formData.NW_REMINDER_MESSAGE }),
      });
      const data = await res.json();
      if (data.success) {
        setTestReminderResult({
          success: true,
          message: data.message || 'Test reminder sent to registered Node War participants!',
        });
      } else {
        setTestReminderResult({
          success: false,
          message: data.error || data.reason || 'Failed to send reminder',
        });
      }
    } catch (err: any) {
      setTestReminderResult({
        success: false,
        message: err?.message || 'Network error sending test reminder',
      });
    } finally {
      setTestingReminder(false);
    }
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

  // Calculate live capacity for each day
  const specialRolesSum =
    (parseInt(formData.LIMIT_BUILDER, 10) || 0) +
    (parseInt(formData.LIMIT_ELEPHANT, 10) || 0) +
    (parseInt(formData.LIMIT_FLAG, 10) || 0) +
    (parseInt(formData.LIMIT_FT, 10) || 0) +
    (parseInt(formData.LIMIT_HWACHA, 10) || 0) +
    (parseInt(formData.LIMIT_SHAI, 10) || 0) +
    (parseInt(formData.LIMIT_SHOTCALLER, 10) || 0);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Capacity Warning or Balanced Status Banner */}
      {warnings.length > 0 ? (
        <div className="bg-rose-950/30 border border-rose-600/40 rounded-2xl p-4 flex items-start gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <strong className="text-rose-300 font-bold block text-sm">
              ⚠️ Squad Pax Configuration Warning
            </strong>
            <p className="text-slate-300">
              One or more days exceed the official Black Desert Online Node War roster limits. Adjust
              your Main Ball slots or special roles below:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1.5">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-900/30 border border-rose-700/50 text-rose-200"
                >
                  <strong className="font-semibold block">
                    {w.day} ({w.tier})
                  </strong>
                  <span>
                    Official Max: <b>{w.expected}</b> | Configured: <b>{w.actual}</b> (+{w.difference}
                    )
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-600/30 rounded-2xl p-3.5 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="text-emerald-300 font-bold">
              ✅ All Daily Node War Rosters Match Official Limits
            </span>
            <span className="text-slate-400 block sm:inline sm:ml-2">
              (Special roles: {specialRolesSum} pax + Main Ball totals comply with server caps).
            </span>
          </div>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Daily Tier Strategy */}
        <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#2d323b]">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Daily Tier Strategy</h3>
          </div>
          <p className="text-xs text-slate-400">
            Select which Node War tier your guild contests each evening. Saturday is reserved for
            free medals at Siege time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {days.map(({ key, label }) => {
              const tierKey = `${key}_TIER`;
              const currentTier = formData[tierKey] || 'Tier 2';
              const maxOfficial = officialPax[key]?.[currentTier] || 40;
              const mainBallVal =
                parseInt(
                  formData[`MAINBALL_${key}_T${currentTier === 'Tier 2' ? '2' : '1'}`],
                  10
                ) || 0;
              const currentTotal = specialRolesSum + mainBallVal;
              const isOver = currentTotal > maxOfficial;

              return (
                <div
                  key={key}
                  className={`p-3 rounded-xl border transition-all ${
                    isOver
                      ? 'bg-rose-950/20 border-rose-600/40'
                      : 'bg-[#17191d] border-[#2d323b]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200">{label}</label>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isOver
                          ? 'bg-rose-900/50 text-rose-300 font-bold'
                          : 'bg-[#262930] text-slate-400'
                      }`}
                    >
                      {currentTotal} / {maxOfficial} pax
                    </span>
                  </div>
                  <select
                    value={formData[tierKey] || 'Tier 2'}
                    onChange={(e) => handleChange(tierKey, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 mb-1.5"
                  >
                    <option value="Tier 1">Tier 1 (Balenos / Serendia)</option>
                    <option value="Tier 2">Tier 2 (Calpheon / Ulukita)</option>
                  </select>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Custom Target Territory:</span>
                    <input
                      type="text"
                      placeholder={currentTier === 'Tier 2' ? 'Calpheon or Ulukita' : 'Balenos or Serendia'}
                      value={formData[`${key}_VOTE_TARGET`] || ''}
                      onChange={(e) => handleChange(`${key}_VOTE_TARGET`, e.target.value)}
                      className="w-full px-2 py-1 rounded bg-[#20232b] border border-[#2d323b] text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Special Role Limits */}
        <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2d323b]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Special Role Slot Limits</h3>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30">
              Total: {specialRolesSum} pax
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Configure how many members are dedicated to artillery, structures, and utility squads.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-1">
            {[
              { key: 'LIMIT_BUILDER', role: 'Builder', label: 'Builder', fallback: '1' },
              { key: 'LIMIT_ELEPHANT', role: 'Elephant', label: 'Elephant', fallback: '1' },
              { key: 'LIMIT_FLAG', role: 'Flag', label: 'Flag Man', fallback: '1' },
              { key: 'LIMIT_FT', role: 'FT', label: 'Flame Tower', fallback: '2' },
              { key: 'LIMIT_HWACHA', role: 'Hwacha', label: 'Hwacha', fallback: '1' },
              { key: 'LIMIT_SHAI', role: 'Shai', label: 'Shai', fallback: '3' },
              { key: 'LIMIT_SHOTCALLER', role: 'Shotcaller', label: 'Shotcaller', fallback: '1' },
            ].map(({ key, role, label, fallback }) => (
              <div key={key} className="p-3 rounded-xl bg-[#17191d] border border-[#2d323b] hover:border-[#383e49] transition-all">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded bg-[#202329] border border-[#343943] flex items-center justify-center p-0.5 shrink-0">
                    <RoleIcon role={role} size="sm" />
                  </div>
                  <span>{label}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData[key] ?? fallback}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-Width Section: Custom Reminder & In-Game Vote Notification */}
      <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d323b]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>In-Game Vote Reminder & Ping System</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-semibold text-indigo-400">
                  Node War Only
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pings strictly the members who registered for Node War. Siege War participants and
                @everyone are excluded.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#17191d] border border-[#2d323b] text-xs font-mono text-emerald-400">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Ping: 17:00 GMT+7</span>
            </div>
          </div>
        </div>

        {/* Explainer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#17191d] border border-[#2d323b] flex items-start gap-2.5">
            <Users className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-slate-200 font-semibold block">Registered-Only Direct Mentions</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The bot gathers every Discord user who clicked a role button on today&apos;s Node War
                embed and tags them with direct <code className="text-indigo-300">&lt;@user&gt;</code>{' '}
                mentions. Nobody outside today&apos;s roster receives a ping notification.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#17191d] border border-[#2d323b] flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-slate-200 font-semibold block">Automated 17:00 Schedule Window</strong>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Automatically triggered every evening at <b>17:00 GMT+7 (5:00 PM WIB)</b> before RSVP
                closes at 20:00 GMT+7.
              </p>
            </div>
          </div>
        </div>

        {/* Custom Message Field */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-200">
              Custom Reminder Message Template:
            </label>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">Insert tag:</span>
              {[
                { tag: '{target}', desc: 'Target territory' },
                { tag: '{tier}', desc: 'Node war tier' },
                { tag: '{date}', desc: 'Date (YYYY-MM-DD)' },
                { tag: '{day}', desc: 'Day name' },
                { tag: '{count}', desc: 'Participant count' },
              ].map(({ tag, desc }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleInsertTag(tag)}
                  title={desc}
                  className="px-2 py-0.5 rounded bg-[#242730] hover:bg-indigo-600/30 hover:text-indigo-300 border border-[#333842] text-slate-300 font-mono text-[10px] transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={4}
            value={formData.NW_REMINDER_MESSAGE ?? ''}
            onChange={(e) => handleChange('NW_REMINDER_MESSAGE', e.target.value)}
            placeholder="⚠️ **Node War In-Game Vote Reminder**\nPlease **YES UP** on **{target}** for **{tier}**!\nMake sure to submit your vote in-game before the deadline."
            className="w-full px-3 py-2.5 rounded-xl bg-[#17191d] border border-[#333842] text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
        </div>

        {/* Live Preview & Test Button */}
        <div className="bg-[#17191d] border border-[#2d323b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#252830]">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Discord Message Preview</span>
            </span>
            <button
              type="button"
              disabled={testingReminder}
              onClick={handleSendTestReminder}
              id="btn-test-send-reminder"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-amber-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingReminder ? 'Sending to Discord...' : 'Send Test Reminder Now'}</span>
            </button>
          </div>

          {testReminderResult && (
            <div
              className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 border ${
                testReminderResult.success
                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-600/40 text-rose-300'
              }`}
            >
              {testReminderResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{testReminderResult.message}</span>
            </div>
          )}

          {/* Formatted Preview Box */}
          <div className="p-3 rounded-lg bg-[#0e1013] border border-[#242730] font-sans text-xs space-y-2 text-slate-200">
            <div className="font-semibold text-amber-300 flex items-center gap-1">
              <span>🔔 Node War In-Game Vote Reminder</span>
            </div>
            <div className="whitespace-pre-wrap text-slate-300 text-xs pl-2 border-l-2 border-amber-500/50 font-mono">
              {(
                formData.NW_REMINDER_MESSAGE ||
                '⚠️ **Node War In-Game Vote Reminder**\nPlease **YES UP** on **{target}** for **{tier}**!\nMake sure to submit your vote in-game before the deadline.'
              )
                .replace(/\{target\}/gi, 'Calpheon or Ulukita')
                .replace(/\{tier\}/gi, 'Tier 2')
                .replace(/\{date\}/gi, '2026-09-11')
                .replace(/\{day\}/gi, 'Friday')
                .replace(/\{count\}/gi, '32')}
            </div>
            <div className="pt-2 text-[11px] text-slate-400 border-t border-[#20232b]">
              <strong className="text-slate-300 block mb-1">
                Registered Node War Participants (Example: 32):
              </strong>
              <div className="flex flex-wrap gap-1">
                {['@PlayerOne', '@PlayerTwo', '@PlayerThree', '@PlayerFour', '+28 registered others'].map(
                  (mention, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-300 font-mono text-[10px]"
                    >
                      {mention}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ball Configuration Section */}
      <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d323b]">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Main Ball Squad Slots</h3>
          </div>

          {/* Tier Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#17191d] rounded-xl border border-[#2d323b]">
            <button
              type="button"
              onClick={() => setTierTab('1')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tierTab === '1'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tier 1 Config
            </button>
            <button
              type="button"
              onClick={() => setTierTab('2')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tierTab === '2'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tier 2 Config
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Main Ball receives the combat core. Below you can tune each day&apos;s allocation for Tier{' '}
          {tierTab}.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {days.map(({ key, label }) => {
            const configKey = `MAINBALL_${key}_T${tierTab}`;
            const expected = officialPax[key]?.[`Tier ${tierTab}`] || 40;
            const currentVal = parseInt(formData[configKey], 10) || 0;
            const totalForDay = specialRolesSum + currentVal;
            const isOver = totalForDay > expected;

            return (
              <div
                key={key}
                className={`p-3 rounded-xl border transition-all ${
                  isOver ? 'bg-rose-950/20 border-rose-600/40' : 'bg-[#17191d] border-[#2d323b]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">{label}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData[configKey] ?? '20'}
                  onChange={(e) => handleChange(configKey, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500 mb-1.5"
                />
                <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>Total:</span>
                  <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {totalForDay} / {expected}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {savedSuccess && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          id="btn-save-node-war-settings"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Node War Settings'}</span>
        </button>
      </div>
    </form>
  );
};
