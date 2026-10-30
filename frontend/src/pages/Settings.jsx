import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Field, Item, Modal, PageHeader, Stagger } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api, errMsg } from '../lib/api.js';
import { validateName, validatePassword } from '../lib/validators.js';

export default function Settings() {
  const { user, setUser } = useAuth();
  const { dark, setDark } = useTheme();
  const nav = useNavigate();
  const [p, setP] = useState({ name: user.name, language: user.language });
  const [pErr, setPErr] = useState({});
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});
  const [busy, setBusy] = useState('');
  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState('');

  async function saveProfile(e) {
    e.preventDefault();
    const err = { name: validateName(p.name), language: p.language.trim().length < 2 ? 'Enter a language' : '' };
    setPErr(err);
    if (err.name || err.language) return;
    setBusy('profile');
    try { setUser((await api.patch('/users/me', p)).data.data); toast.success('Profile updated'); } catch (e2) { toast.error(errMsg(e2)); } finally { setBusy(''); }
  }

  async function changePw(e) {
    e.preventDefault();
    const err = { newPassword: validatePassword(pw.newPassword), confirm: pw.newPassword === pw.confirm ? '' : 'Passwords do not match', currentPassword: pw.currentPassword ? '' : 'Enter your current password' };
    setPwErr(err);
    if (Object.values(err).some(Boolean)) return;
    setBusy('pw');
    try { await api.patch('/users/me/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword }); toast.success('Password changed'); setPw({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (e2) { toast.error(errMsg(e2)); } finally { setBusy(''); }
  }

  async function deleteAccount() {
    setBusy('del');
    try { await api.delete('/users/me', { data: { password: delPw } }); toast.success('Your account was deleted.'); setUser(null); nav('/'); }
    catch (e2) { toast.error(errMsg(e2)); setBusy(''); }
  }

  return (
    <Stagger className="mx-auto max-w-2xl space-y-6">
      <Item><PageHeader title="Settings" text="Manage your profile, security and appearance. Delete individual documents, notes, quizzes and decks from their own pages." /></Item>

      <Item><form onSubmit={saveProfile} noValidate className="card space-y-4 p-6">
        <h2 className="font-semibold">Profile</h2>
        <Field label="Full name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} error={pErr.name} />
        <Field label="Email" value={user.email} disabled hint="Email cannot be changed." />
        <Field label="Preferred language" value={p.language} onChange={(e) => setP({ ...p, language: e.target.value })} error={pErr.language} hint="Used for AI chat answers." />
        <Button type="submit" loading={busy === 'profile'}>Save changes</Button>
      </form></Item>

      <Item><div className="card flex items-center justify-between p-6">
        <div><h2 className="font-semibold">Appearance</h2><p className="muted text-sm">Your choice is remembered on this device.</p></div>
        <div className="flex rounded-xl border border-slate-200 p-1 dark:border-white/10" role="group" aria-label="Theme">
          {[[false, 'Light', Sun], [true, 'Dark', Moon]].map(([v, l, Icon]) => (
            <button key={l} onClick={() => setDark(v)} aria-pressed={dark === v} className={`btn btn-sm ${dark === v ? 'bg-violet-600 text-white' : 'btn-ghost'}`}><Icon className="h-4 w-4" />{l}</button>
          ))}
        </div>
      </div></Item>

      <Item><form onSubmit={changePw} noValidate className="card space-y-4 p-6">
        <h2 className="font-semibold">Change password</h2>
        <Field label="Current password" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErr.currentPassword} />
        <Field label="New password" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErr.newPassword} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErr.confirm} />
        <Button type="submit" loading={busy === 'pw'}>Update password</Button>
      </form></Item>

      <Item><div className="card border-red-200 p-6 dark:border-red-500/30">
        <h2 className="font-semibold text-red-700 dark:text-red-400">Delete account</h2>
        <p className="muted mt-1 text-sm">Permanently deletes your account, uploaded files, notes, quizzes, flashcards and activity. This cannot be undone.</p>
        <Button variant="danger" className="mt-4" onClick={() => setDelOpen(true)}>Delete my account</Button>
      </div></Item>

      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Delete your account?">
        <p className="muted mb-4 text-sm">Enter your password to confirm. All of your data will be removed.</p>
        <Field label="Password" type="password" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} />
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setDelOpen(false)}>Cancel</Button><Button variant="danger" loading={busy === 'del'} disabled={!delPw} onClick={deleteAccount}>Delete account</Button></div>
      </Modal>
    </Stagger>
  );
}
