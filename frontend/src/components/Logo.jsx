import { Link } from 'react-router-dom';

export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4f46e5" /><stop offset="1" stopColor="#7c3aed" /></linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lg)" />
      <path d="M9 21c0-6 4-10 7-10s7 4 7 10M12 21c0-3 2-5 4-5s4 2 4 5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="23.5" cy="9" r="2" fill="#67e8f9" />
    </svg>
  );
}

export const Logo = ({ to = '/', collapsed }) => (
  <Link to={to} className="flex items-center gap-2.5 rounded-lg" aria-label="StudyMind AI home">
    <LogoMark />
    {!collapsed && <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">StudyMind <span className="text-violet-600 dark:text-violet-400">AI</span></span>}
  </Link>
);
