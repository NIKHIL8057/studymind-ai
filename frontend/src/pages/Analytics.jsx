import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts';
import { toast } from 'sonner';
import { Button, Empty, ErrorState, Item, PageHeader, ProgressBar, Skeleton, Stagger } from '../components/ui.jsx';
import { api, errMsg, useApi } from '../lib/api.js';
import { formatDate } from '../lib/validators.js';

export default function Analytics() {
  const { data: s, loading, error, reload } = useApi('/analytics');
  const [rec, setRec] = useState(null);
  const [busy, setBusy] = useState(false);

  async function getRec() {
    setBusy(true);
    try { setRec((await api.post('/analytics/recommendations')).data.data); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;
  const t = s.totals;
  const trend = s.scoreTrend.map((x, i) => ({ ...x, n: i + 1 }));

  return (
    <Stagger className="space-y-6">
      <Item><PageHeader title="Progress & Analytics" text="Everything here is calculated from your saved activity and quiz attempts." /></Item>
      <Item className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[['Documents processed', t.documents], ['Notes created', t.notes], ['Quizzes completed', t.quizzesCompleted], ['Flashcard decks', t.flashcardDecks], ['Average score', t.avgScore === null ? '—' : `${t.avgScore}%`]].map(([l, v]) => (
          <div key={l} className="card p-5"><p className="muted text-sm">{l}</p><p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{v}</p></div>
        ))}
      </Item>

      <div className="grid gap-6 lg:grid-cols-2">
        <Item className="card p-5">
          <h2 className="font-semibold">Quiz performance over time</h2>
          {!trend.length ? <p className="muted mt-6 text-sm">Complete a quiz to see your scores here.</p> : (
            <div className="mt-4 h-60" role="img" aria-label="Line chart of quiz scores over time">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
                <XAxis dataKey="n" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} label={{ value: 'Attempt', position: 'insideBottom', offset: -2, fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip labelFormatter={(n) => `Attempt ${n}`} formatter={(v, _n, p) => [`${v}%`, p.payload.title]} />
                <Line type="monotone" dataKey="percentage" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} animationDuration={800} />
              </LineChart></ResponsiveContainer>
            </div>
          )}
        </Item>
        <Item className="card p-5">
          <h2 className="font-semibold">Activity, last 14 days</h2>
          <div className="mt-4 h-60" role="img" aria-label="Bar chart of study activity per day">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={s.activityByDay}>
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(8)} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip labelFormatter={formatDate} formatter={(v) => [v, 'Actions']} />
              <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart></ResponsiveContainer>
          </div>
        </Item>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Item className="card p-5">
          <h2 className="font-semibold">Weak topics</h2>
          <p className="muted text-xs">Topics under 70% correct across at least 2 quiz questions.</p>
          {!s.weakTopics.length ? <p className="muted mt-5 text-sm">{t.quizzesCompleted ? 'No weak topics detected yet. Nice work, or too little data so far.' : 'Take a quiz to see which topics need work.'}</p> : (
            <ul className="mt-4 space-y-4">{s.weakTopics.map((w) => <li key={w.topic}><div className="mb-1 flex justify-between text-sm"><span>{w.topic}</span><span className="muted">{Math.round(w.accuracy * 100)}% · {w.correct}/{w.total}</span></div><ProgressBar value={Math.round(w.accuracy * 100)} label={`${w.topic} accuracy`} /></li>)}</ul>
          )}
        </Item>
        <Item className="card p-5">
          <h2 className="font-semibold">Most reviewed flashcard topics</h2>
          {!s.reviewedTopics.length ? <p className="muted mt-5 text-sm">Review flashcards to see your most-studied topics.</p> : (
            <ul className="mt-4 space-y-2">{s.reviewedTopics.map((r) => <li key={r.topic} className="flex justify-between text-sm"><span>{r.topic}</span><span className="muted">{r.count} reviews</span></li>)}</ul>
          )}
        </Item>
      </div>

      <Item className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">Study recommendations</h2><p className="muted text-xs">Generated by AI from your measured quiz results above. Suggestions, not measurements.</p></div>
          <Button variant="secondary" onClick={getRec} loading={busy} disabled={!t.quizzesCompleted}><Sparkles className="h-4 w-4" />Get recommendations</Button>
        </div>
        {!t.quizzesCompleted && <p className="muted mt-4 text-sm">Complete a quiz first. Recommendations need real results to work from.</p>}
        {rec && <div className="mt-4 rounded-xl bg-violet-50 p-4 dark:bg-violet-500/10"><p className="mb-1 text-xs font-medium text-violet-700 dark:text-violet-300">{rec.generated ? 'AI-generated suggestion' : 'Note'}</p><div className="md"><ReactMarkdown>{rec.text}</ReactMarkdown></div></div>}
      </Item>

      <Item>
        <h2 className="mb-3 font-semibold">Recent activity</h2>
        {!s.recent.length ? <Empty title="No activity yet" text="Your uploads, chats, quizzes and reviews will be listed here." /> : (
          <ul className="card divide-y divide-slate-200 dark:divide-white/10">{s.recent.map((a) => <li key={a._id} className="flex justify-between gap-3 p-4 text-sm"><span className="truncate">{a.label}</span><span className="muted shrink-0 text-xs">{formatDate(a.createdAt)}</span></li>)}</ul>
        )}
      </Item>
    </Stagger>
  );
}
