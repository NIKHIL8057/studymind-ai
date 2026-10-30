import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, BookOpen, ChevronsLeft, FileText, Layers, LayoutDashboard, LogOut, Menu, MessageSquare, Moon, Search, Settings, Sun, X, ClipboardCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Logo } from './Logo.jsx';
import { cx } from './ui.jsx';

const NAV = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/documents', label: 'My Documents', icon: FileText },
  { to: '/app/chat', label: 'AI Study Assistant', icon: MessageSquare },
  { to: '/app/notes', label: 'Notes', icon: BookOpen },
  { to: '/app/quizzes', label: 'Quizzes', icon: ClipboardCheck },
  { to: '/app/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/app/analytics', label: 'Progress & Analytics', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

function NavList({ collapsed, onNavigate }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to} to={to} end={end} onClick={onNavigate} title={collapsed ? label : undefined}
          className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            isActive ? 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10')}
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">{label}</span>}
          {collapsed && <span className="sr-only">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-white/10">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white">{user.name.charAt(0).toUpperCase()}</span>
        <span className="sr-only">Open profile menu</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="card absolute right-0 z-40 mt-2 w-60 p-2 shadow-xl">
            <div className="border-b border-slate-200 px-3 pb-2 dark:border-white/10">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
              <p className="muted truncate text-xs">{user.email}</p>
            </div>
            <button role="menuitem" onClick={() => { setOpen(false); nav('/app/settings'); }} className="btn btn-ghost mt-1 w-full justify-start"><Settings className="h-4 w-4" />Settings</button>
            <button role="menuitem" onClick={async () => { await logout(); nav('/'); }} className="btn btn-ghost w-full justify-start"><LogOut className="h-4 w-4" />Sign out</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppShell() {
  const { dark, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => setMobile(false), [pathname]);

  return (
    <div className="min-h-screen">
      <motion.aside
        animate={{ width: collapsed ? 76 : 272 }} transition={{ duration: 0.25 }}
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-ink-900 lg:flex"
      >
        <div className={cx('mb-6 flex h-12 items-center px-2', collapsed ? 'justify-center' : 'justify-between')}>
          <Logo to="/app" collapsed={collapsed} />
          {!collapsed && <button onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" className="btn btn-ghost p-2"><ChevronsLeft className="h-4 w-4" /></button>}
        </div>
        <NavList collapsed={collapsed} />
        {collapsed && <button onClick={() => setCollapsed(false)} aria-label="Expand sidebar" className="btn btn-ghost mt-auto p-2"><Menu className="h-5 w-5" /></button>}
      </motion.aside>

      <AnimatePresence>
        {mobile && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-slate-950/60" onClick={() => setMobile(false)} aria-hidden="true" />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ duration: 0.25 }} className="absolute inset-y-0 left-0 w-72 bg-white p-3 dark:bg-ink-900" aria-label="Navigation menu">
              <div className="mb-6 flex h-12 items-center justify-between px-2">
                <Logo to="/app" />
                <button onClick={() => setMobile(false)} aria-label="Close menu" className="btn btn-ghost p-2"><X className="h-5 w-5" /></button>
              </div>
              <NavList onNavigate={() => setMobile(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cx('transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[272px]')}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-4 backdrop-blur dark:border-white/10 dark:bg-ink-950/90 sm:px-6">
          <button onClick={() => setMobile(true)} aria-label="Open menu" className="btn btn-ghost p-2 lg:hidden"><Menu className="h-5 w-5" /></button>
          <form role="search" onSubmit={(e) => { e.preventDefault(); nav(`/app/documents?q=${encodeURIComponent(q)}`); }} className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" placeholder="Search your documents" className="input pl-9" />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={toggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} className="btn btn-ghost p-2">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <ProfileMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"><Outlet /></main>
      </div>
    </div>
  );
}
