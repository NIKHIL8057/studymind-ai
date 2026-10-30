import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo.jsx';
import { Button, Field } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../lib/api.js';
import { validateEmail, validateName, validatePassword } from '../lib/validators.js';

function Shell({ title, text, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-indigo-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2.5 text-lg font-semibold"><Logo /></div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight text-white">Study from your own material, not from a blank page.</h2>
          <p className="mt-4 text-indigo-100">Upload a PDF, ask it questions, and turn it into notes, quizzes and flashcards.</p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <p className="text-sm text-indigo-200">Answers come with page references from your documents.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="muted mt-1 text-sm">{text}</p>
          <div className="mt-6">{children}</div>
          <p className="muted mt-6 text-center text-sm">{footer}</p>
        </motion.div>
      </div>
    </div>
  );
}

const EyeToggle = ({ show, onClick }) => (
  <button type="button" onClick={onClick} aria-label={show ? 'Hide password' : 'Show password'} className="btn btn-ghost p-2">
    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  </button>
);

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = { email: validateEmail(f.email), password: f.password ? '' : 'Password is required' };
    setErrors(errs);
    if (errs.email || errs.password) return;
    setBusy(true);
    try {
      await login(f);
      nav(loc.state?.from || '/app', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <Shell title="Welcome back" text="Sign in to continue studying." footer={<>New here? <Link to="/signup" className="font-semibold text-indigo-600 dark:text-cyan-300">Create an account</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={errors.email} />
        <Field label="Password" type={show ? 'text' : 'password'} autoComplete="current-password" value={f.password} onChange={set('password')} error={errors.password} right={<EyeToggle show={show} onClick={() => setShow((s) => !s)} />} />
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
    </Shell>
  );
}

export function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = {
      name: validateName(f.name), email: validateEmail(f.email), password: validatePassword(f.password),
      confirmPassword: f.password === f.confirmPassword ? '' : 'Passwords do not match',
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      await signup(f);
      toast.success('Account created. Welcome to StudyMind AI!');
      nav('/app', { replace: true });
    } catch (err) {
      const server = err.response?.data?.errors;
      if (server) setErrors(server);
      toast.error(errMsg(err));
      setBusy(false);
    }
  }

  const eye = <EyeToggle show={show} onClick={() => setShow((s) => !s)} />;
  return (
    <Shell title="Create your account" text="Free to start. No credit card." footer={<>Already have an account? <Link to="/login" className="font-semibold text-indigo-600 dark:text-cyan-300">Sign in</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" autoComplete="name" value={f.name} onChange={set('name')} error={errors.name} />
        <Field label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={errors.email} />
        <Field label="Password" type={show ? 'text' : 'password'} autoComplete="new-password" value={f.password} onChange={set('password')} error={errors.password} hint="At least 8 characters, with a letter and a number." right={eye} />
        <Field label="Confirm password" type={show ? 'text' : 'password'} autoComplete="new-password" value={f.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
    </Shell>
  );
}
