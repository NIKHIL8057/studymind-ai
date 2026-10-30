export const validateEmail = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address');

export function validatePassword(v) {
  if (v.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(v)) return 'Password needs at least one letter';
  if (!/\d/.test(v)) return 'Password needs at least one number';
  return '';
}

export const validateName = (v) => (v.trim().length >= 2 ? '' : 'Name must be at least 2 characters');

export const formatBytes = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
export const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
