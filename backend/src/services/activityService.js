import StudyActivity from '../models/StudyActivity.js';

/** Fire-and-forget activity log; never breaks the request that triggered it. */
export function logActivity(user, type, label, ref) {
  StudyActivity.create({ user, type, label: String(label || '').slice(0, 200), ref }).catch((e) =>
    console.error('[activity] failed:', e.message)
  );
}
