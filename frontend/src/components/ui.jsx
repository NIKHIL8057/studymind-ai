import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { forwardRef, useEffect, useId, useRef } from 'react';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Spinner({ className }) {
  return <Loader2 className={cx('h-4 w-4 animate-spin', className)} aria-hidden="true" />;
}

export function Button({ variant = 'primary', size, loading, className, children, ...p }) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      {...p}
      disabled={loading || p.disabled}
      className={cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className)}
    >
      {loading && <Spinner />}
      {children}
    </motion.button>
  );
}

export const Skeleton = ({ className }) => (
  <div aria-hidden="true" className={cx('animate-pulse rounded-lg bg-slate-200 dark:bg-white/10', className)} />
);

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-white/15">
      {Icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {text && <p className="muted mt-1 max-w-sm text-sm">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export const Field = forwardRef(function Field({ label, error, hint, right, className, ...p }, ref) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} ref={ref} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} className={cx('input', right && 'pr-11', error && 'border-red-500')} {...p} />
        {right && <div className="absolute inset-y-0 right-1 flex items-center">{right}</div>}
      </div>
      {hint && !error && <p className="muted mt-1 text-xs">{hint}</p>}
      {error && <p id={`${id}-e`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});

export function Select({ label, children, ...p }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} className="input" {...p}>{children}</select>
    </div>
  );
}

export function ProgressBar({ value, label }) {
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
      <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" initial={false} animate={{ width: `${value}%` }} transition={{ duration: 0.4 }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab') return;
      const f = ref.current?.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!f?.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-hidden="true" />
          <motion.div
            ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
            initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            className={cx('card relative max-h-[90vh] w-full overflow-auto p-6 shadow-2xl', wide ? 'max-w-4xl' : 'max-w-md')}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button onClick={onClose} aria-label="Close dialog" className="btn btn-ghost -m-2 p-2"><X className="h-5 w-5" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Confirm({ open, title, text, confirmLabel = 'Delete', onConfirm, onClose, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="muted text-sm">{text}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
export const Stagger = ({ children, className }) => <motion.div variants={container} initial="hidden" animate="show" className={className}>{children}</motion.div>;
export const Item = ({ children, className }) => <motion.div variants={item} className={className}>{children}</motion.div>;

export function PageHeader({ title, text, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {text && <p className="muted mt-1 max-w-2xl text-sm">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const STATUS = {
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  processing: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
};
export const StatusBadge = ({ status }) => (
  <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STATUS[status])}>
    {status === 'processing' && <Spinner className="h-3 w-3" />}{status}
  </span>
);
