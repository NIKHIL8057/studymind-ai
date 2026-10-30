import { ArrowRight, BookOpen, ClipboardCheck, FileText, Layers, MessageSquare, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Empty, ErrorState, Item, PageHeader, ProgressBar, Skeleton, Stagger } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../lib/api.js';
import { formatDate } from '../lib/validators.js';

const ACTIVITY_LINK = { upload: '/app/documents', chat: '/app/chat', note: '/app/notes', quiz_generated: '/app/quizzes', quiz_attempt: '/app/quizzes', flashcards_generated: '/app/flashcards', flashcard_review: '/app/flashcards' };

export default function Dashboard() {
  const { user } = useAuth();
  const stats = useApi('/analytics');
  const docs = useApi('/documents', { limit: 4 });
  const notes = useApi('/notes', { limit: 3 });
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const loading = stats.loading || docs.loading;
  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.reload} />;
  const s = stats.data;
  const isNew = !loading && docs.meta?.total === 0;

  return (
    <Stagger className="space-y-8">
      <Item><PageHeader title={`${greet}, ${user.name.split(' ')[0]}`} text="Here is where your study stands." actions={<>
        <Link to="/app/documents" className="btn btn-primary"><Upload className="h-4 w-4" />Upload PDF</Link>
        <Link to="/app/chat" className="btn btn-secondary"><MessageSquare className="h-4 w-4" />Ask a question</Link>
      </>} /></Item>

      {isNew && (
        <Item>
          <div className="card border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 dark:border-violet-500/30 dark:from-violet-500/10 dark:to-ink-900">
            <h2 className="text-lg font-semibold">Get started in three steps</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3">
              {[['Upload a PDF', 'Start with a chapter or lecture notes.', '/app/documents'], ['Ask it a question', 'Answers cite their pages.', '/app/chat'], ['Make a quiz', 'Test yourself and track results.', '/app/quizzes']].map(([t, d, to], i) => (
                <li key={t}><Link to={to} className="block rounded-xl p-3 hover:bg-white/70 dark:hover:bg-white/5"><span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Step {i + 1}</span><p className="font-medium">{t}</p><p className="muted text-sm">{d}</p></Link></li>
              ))}
            </ol>
          </div>
        </Item>
      )}

      <Item className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />) : [
          ['Documents', s.totals.documents, FileText], ['Notes', s.totals.notes, BookOpen],
          ['Quizzes completed', s.totals.quizzesCompleted, ClipboardCheck], ['Average score', s.totals.avgScore === null ? 'No quizzes yet' : `${s.totals.avgScore}%`, Layers],
        ].map(([l, v, Icon]) => (
          <div key={l} className="card flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Icon className="h-5 w-5" /></div>
            <div><p className="muted text-sm">{l}</p><p className={typeof v === 'number' || v.endsWith('%') ? 'text-2xl font-semibold text-slate-900 dark:text-white' : 'text-base font-medium'}>{v}</p></div>
          </div>
        ))}
      </Item>

      <div className="grid gap-6 lg:grid-cols-3">
        <Item className="card p-5 lg:col-span-2">
          <h2 className="font-semibold">Study activity, last 14 days</h2>
          {loading ? <Skeleton className="mt-4 h-48" /> : s.activityByDay.every((d) => d.count === 0) ? (
            <p className="muted mt-6 text-sm">No activity yet. Uploading a document, chatting, or taking a quiz will show up here.</p>
          ) : (
            <div className="mt-4 h-48" role="img" aria-label="Bar chart of daily study activity">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.activityByDay}>
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(8)} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(124,58,237,0.08)' }} labelFormatter={(d) => formatDate(d)} formatter={(v) => [v, 'Actions']} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Item>
        <Item className="card p-5">
          <h2 className="font-semibold">Continue learning</h2>
          {loading ? <Skeleton className="mt-4 h-24" /> : s.recent[0] ? (
            <Link to={ACTIVITY_LINK[s.recent[0].type]} className="mt-4 block rounded-xl border border-slate-200 p-4 hover:border-violet-400 dark:border-white/10">
              <p className="muted text-xs">Last activity · {formatDate(s.recent[0].createdAt)}</p>
              <p className="mt-1 font-medium">{s.recent[0].label}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-cyan-300">Pick up where you left off <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ) : <p className="muted mt-4 text-sm">Nothing yet. Upload your first document to begin.</p>}
          {!loading && s.totals.avgScore !== null && <div className="mt-5"><p className="muted mb-2 text-sm">Average quiz score</p><ProgressBar value={s.totals.avgScore} label="Average quiz score" /></div>}
        </Item>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Item className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Recent documents</h2><Link to="/app/documents" className="text-sm font-medium text-indigo-600 dark:text-cyan-300">View all</Link></div>
          {docs.loading ? <Skeleton className="h-32" /> : docs.data.length === 0 ? <Empty icon={FileText} title="No documents yet" text="Upload a PDF to start chatting with it." action={<Link to="/app/documents" className="btn btn-primary">Upload PDF</Link>} /> : (
            <ul className="card divide-y divide-slate-200 dark:divide-white/10">
              {docs.data.map((d) => (
                <li key={d._id}><Link to={`/app/chat/${d._id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-white/5"><FileText className="h-5 w-5 text-violet-500" /><span className="flex-1 truncate font-medium">{d.title}</span><span className="muted text-xs">{formatDate(d.createdAt)}</span></Link></li>
              ))}
            </ul>
          )}
        </Item>
        <Item>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Recent notes</h2><Link to="/app/notes" className="text-sm font-medium text-indigo-600 dark:text-cyan-300">View all</Link></div>
          {notes.loading ? <Skeleton className="h-32" /> : !notes.data?.length ? <p className="muted card p-5 text-sm">No notes yet. Generate some from any document.</p> : (
            <ul className="card divide-y divide-slate-200 dark:divide-white/10">{notes.data.map((n) => <li key={n._id}><Link to={`/app/notes/${n._id}`} className="block p-4 hover:bg-slate-50 dark:hover:bg-white/5"><p className="truncate text-sm font-medium">{n.title}</p><p className="muted text-xs">{formatDate(n.updatedAt)}</p></Link></li>)}</ul>
          )}
        </Item>
      </div>

      {!loading && s.recent.length > 0 && (
        <Item>
          <h2 className="mb-3 font-semibold">Recent study activity</h2>
          <ul className="card divide-y divide-slate-200 dark:divide-white/10">{s.recent.map((a) => <li key={a._id} className="flex items-center justify-between gap-3 p-4 text-sm"><span className="truncate">{a.label}</span><span className="muted shrink-0 text-xs">{formatDate(a.createdAt)}</span></li>)}</ul>
        </Item>
      )}
    </Stagger>
  );
}
