import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Settings } from '@/lib/types';

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 'default').maybeSingle();
      setSettings(data as Settings | null);
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    await supabase.from('settings').update({
      brand_name: settings.brand_name,
      tagline: settings.tagline,
      contact_email: settings.contact_email,
      support_email: settings.support_email,
      currency: settings.currency,
      maintenance_mode: settings.maintenance_mode,
    }).eq('id', 'default');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!settings) return <div className="dash-loading">Loading...</div>;

  return (
    <div>
      <div className="dash-page-header"><h1>Platform Settings</h1></div>
      <div className="dash-form-card">
        <h3>General Settings</h3>
        <form onSubmit={handleSave} className="auth-form">
          <label>Brand Name<input value={settings.brand_name} onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })} /></label>
          <label>Tagline<input value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} /></label>
          <label>Contact Email<input value={settings.contact_email} onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })} /></label>
          <label>Support Email<input value={settings.support_email} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })} /></label>
          <label>Currency<input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={settings.maintenance_mode} onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })} /> Maintenance Mode</label>
          <button type="submit" className="btn btn-dark btn-sm" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'} {saved && <Check size={14} />}
          </button>
        </form>
      </div>
    </div>
  );
}
