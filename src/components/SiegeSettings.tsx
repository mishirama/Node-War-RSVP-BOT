import React, { useState } from 'react';
import { AppConfig } from '../types';
import { RoleIcon } from './RoleIcon';
import { Castle, Save, CheckCircle, Sliders, Shield, Hash } from 'lucide-react';

interface SiegeSettingsProps {
  config: AppConfig;
  channels: Array<{ id: string; name: string }>;
  onSaveConfig: (updated: Partial<AppConfig>) => Promise<boolean>;
}

export const SiegeSettings: React.FC<SiegeSettingsProps> = ({
  config,
  channels,
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

  const siegeRoles = [
    { key: 'SIEGE_LIMIT_BUILDER', role: 'Builder', label: 'Builder' },
    { key: 'SIEGE_LIMIT_ELEPHANT', role: 'Elephant', label: 'Elephant' },
    { key: 'SIEGE_LIMIT_FLAG', role: 'Flag', label: 'Flag Man' },
    { key: 'SIEGE_LIMIT_FT', role: 'FT', label: 'Flame Tower' },
    { key: 'SIEGE_LIMIT_HWACHA', role: 'Hwacha', label: 'Hwacha' },
    { key: 'SIEGE_LIMIT_SHAI', role: 'Shai', label: 'Shai' },
    { key: 'SIEGE_LIMIT_SHOTCALLER', role: 'Shotcaller', label: 'Shotcaller' },
    { key: 'SIEGE_LIMIT_WITCH_WIZARD', role: 'Witch/Wizard', label: 'Witch / Wizard' },
  ];

  const totalPax = parseInt(formData.SIEGE_TOTAL_PAX, 10) || 100;
  const specialRolesTotal = siegeRoles.reduce(
    (sum, { key }) => sum + (parseInt(formData[key], 10) || 0),
    0
  );
  const mainBallRemaining = Math.max(0, totalPax - specialRolesTotal);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-[#202329] border border-[#343943] rounded-2xl p-5 sm:p-6 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d323b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Castle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Siege War Settings</h3>
              <p className="text-xs text-slate-400">
                Configure Saturday Siege War RSVP limits, dedicated Discord channel, and role
                allocations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total Cap:</span>
            <span className="px-3 py-1 rounded-lg bg-[#17191d] border border-violet-500/40 text-violet-400 font-mono font-bold text-sm">
              {totalPax} Pax
            </span>
          </div>
        </div>

        {/* Channel & Total Pax Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-violet-400" />
              <span>Siege RSVP Discord Channel</span>
            </label>
            {channels.length > 0 ? (
              <select
                value={formData.SIEGE_CHANNEL_ID}
                onChange={(e) => handleChange('SIEGE_CHANNEL_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    # {ch.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Channel ID (e.g. 1547628216246603816)"
                value={formData.SIEGE_CHANNEL_ID}
                onChange={(e) => handleChange('SIEGE_CHANNEL_ID', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono text-white focus:outline-none focus:border-violet-500"
              />
            )}
            <p className="text-[11px] text-slate-400">
              The bot will post the Siege War RSVP embed and buttons in this channel.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#17191d] border border-[#2d323b] space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-violet-400" />
              <span>Total Siege Pax (1 - 100)</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.SIEGE_TOTAL_PAX}
              onChange={(e) => handleChange('SIEGE_TOTAL_PAX', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#242730] border border-[#333842] text-sm font-mono font-bold text-white focus:outline-none focus:border-violet-500"
            />
            <p className="text-[11px] text-slate-400">
              Maximum roster cap for Siege War. Black Desert Online supports up to 100 members.
            </p>
          </div>
        </div>

        {/* Dynamic Allocation Visualizer */}
        <div className="p-4 rounded-xl bg-[#17191d] border border-violet-500/30">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-200">Squad Distribution Summary:</span>
            <span className="font-mono text-slate-400">
              Special Roles: <b className="text-violet-400">{specialRolesTotal}</b> | Main Ball:{' '}
              <b className="text-emerald-400">{mainBallRemaining}</b>
            </span>
          </div>

          {/* Ratio bar */}
          <div className="w-full h-3 rounded-full bg-[#242730] overflow-hidden flex">
            <div
              className="bg-violet-600 h-full transition-all"
              style={{ width: `${(specialRolesTotal / totalPax) * 100}%` }}
              title={`Special roles: ${specialRolesTotal}`}
            />
            <div
              className="bg-emerald-600 h-full transition-all"
              style={{ width: `${(mainBallRemaining / totalPax) * 100}%` }}
              title={`Main Ball remaining: ${mainBallRemaining}`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-violet-600 inline-block" /> Special Roles (
              {specialRolesTotal})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Main Ball (
              {mainBallRemaining})
            </span>
          </div>
        </div>

        {/* Special Roles Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Special Role Slot Allocations
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {siegeRoles.map(({ key, role, label }) => (
              <div key={key} className="p-3 rounded-xl bg-[#17191d] border border-[#2d323b] hover:border-[#383e49] transition-all">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded bg-[#202329] border border-[#343943] flex items-center justify-center p-0.5 shrink-0">
                    <RoleIcon role={role} size="sm" />
                  </div>
                  <span>{label}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData[key] ?? '0'}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#242730] border border-[#333842] text-xs font-mono font-bold text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2d323b]">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Siege settings saved!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            id="btn-save-siege-settings"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/20 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Siege Settings'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
