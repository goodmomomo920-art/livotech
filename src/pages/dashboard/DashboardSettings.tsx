import { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function DashboardSettings() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
    setCompany(profile?.company ?? '');
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    await supabase.from('profiles').update({ full_name: fullName, phone, company }).eq('id', userId);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="dash-page-header"><h1>Account Settings</h1></div>
      <div className="dash-settings-grid">
        <div className="dash-form-card">
          <h3>Profile Information</h3>
          <form onSubmit={handleSave} className="auth-form">
            <label>Full Name<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" /></label>
            <label>Email<input value={profile?.email ?? ''} disabled /></label>
            <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" /></label>
            <label>Company<input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" /></label>
            <button type="submit" className="btn btn-dark btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'} {saved && <Check size={14} />}
            </button>
          </form>
        </div>
        <div className="dash-form-card">
          <h3>Security</h3>
          <p className="dash-muted">Manage your password and security settings.</p>
          <button className="btn btn-outline btn-sm">Change Password</button>
        </div>
      </div>
    </div>
  );
}
