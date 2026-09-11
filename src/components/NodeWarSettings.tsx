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
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tier 1">Tier 1 (Balenos / Serendia)</option>
                    <option value="Tier 2">Tier 2 (Calpheon / Ulukita)</option>
                  </select>
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
