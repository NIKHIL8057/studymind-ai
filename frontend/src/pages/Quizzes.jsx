import { AnimatePresence, motion } from 'motion/react';
import { Check, ClipboardCheck, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Confirm, Empty, ErrorState, Item, PageHeader, ProgressBar, Select, Skeleton, Stagger } from '../components/ui.jsx';
import { api, errMsg, useApi } from '../lib/api.js';
import { formatDate } from '../lib/validators.js';

const LETTERS = ['A', 'B', 'C', 'D'];

function Generate({ onCreated }) {
  const docs = useApi('/documents', { status: 'ready', limit: 50, sort: 'title' });
  const notes = useApi('/notes', { limit: 50 });
  const [f, setF] = useState({ source: '', count: 8, difficulty: 'medium' });
  const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault();
    const [kind, id] = f.source.split(':');
    setBusy(true);
    try {
      const body = { count: Number(f.count), difficulty: f.difficulty, [kind === 'note' ? 'noteId' : 'documentId']: id };
      onCreated((await api.post('/quizzes/generate', body)).data.data);
    } catch (err) { toast.error(errMsg(err)); setBusy(false); }
  }
  return (
    <form onSubmit={go} className="card grid gap-4 p-6 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">Generate a quiz</h2>
      <div className="sm:col-span-2">
        <Select label="Source" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} required>
          <option value="">Choose a document or note…</option>
          <optgroup label="Documents">{docs.data?.map((d) => <option key={d._id} value={`doc:${d._id}`}>{d.title}</option>)}</optgroup>
          <optgroup label="Notes">{notes.data?.map((n) => <option key={n._id} value={`note:${n._id}`}>{n.title}</option>)}</optgroup>
        </Select>
      </div>
      <Select label="Number of questions" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })}>{[5, 8, 10, 15, 20].map((n) => <option key={n}>{n}</option>)}</Select>
      <Select label="Difficulty" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select>
      <div className="sm:col-span-2"><Button type="submit" loading={busy} disabled={!f.source}>Generate quiz</Button></div>
    </form>
  );
}

function Play({ quiz, onDone, onExit }) {
  const [i, setI] = useState(0);
  const [ans, setAns] = useState(() => quiz.questions.map(() => null));
  const [busy, setBusy] = useState(false);
  const q = quiz.questions[i];
  const last = i === quiz.questions.length - 1;
  const answered = ans.filter((a) => a !== null).length;

  async function submit() {
    if (busy) return; // prevents accidental duplicate submissions
    setBusy(true);
    try { onDone((await api.post(`/quizzes/${quiz._id}/attempts`, { answers: ans })).data.data); }
    catch (e) { toast.error(errMsg(e)); setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{quiz.title}</h2><button onClick={onExit} className="btn btn-ghost btn-sm">Exit</button></div>
      <ProgressBar value={Math.round(((i + 1) / quiz.questions.length) * 100)} label="Quiz progress" />
      <p className="muted mt-2 text-sm">Question {i + 1} of {quiz.questions.length} · {answered} answered</p>
      <AnimatePresence mode="wait">
        <motion.fieldset key={q._id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="mt-5">
          <legend className="text-xl font-semibold text-slate-900 dark:text-white">{q.question}</legend>
          <div className="mt-5 space-y-3">
            {q.options.map((o, idx) => {
              const sel = ans[i] === idx;
              return (
                <motion.label key={idx} whileTap={{ scale: 0.99 }} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500 ${sel ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/15' : 'border-slate-200 bg-white hover:border-violet-300 dark:border-white/10 dark:bg-ink-900'}`}>
                  <input type="radio" name={`q${i}`} className="sr-only" checked={sel} onChange={() => setAns((a) => a.map((v, k) => (k === i ? idx : v)))} />
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${sel ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-white/10'}`}>{LETTERS[idx]}</span>
                  <span className="text-sm">{o}</span>
                </motion.label>
              );
            })}
          </div>
        </motion.fieldset>
      </AnimatePresence>
      <div className="mt-6 flex justify-between">
        <Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</Button>
        {last ? <Button loading={busy} onClick={submit}>Submit quiz</Button> : <Button onClick={() => setI(i + 1)}>Next</Button>}
      </div>
      {last && answered < quiz.questions.length && <p className="muted mt-3 text-right text-xs">{quiz.questions.length - answered} unanswered question(s) will count as incorrect.</p>}
    </div>
  );
}

function Result({ attempt, onClose }) {
  const tone = attempt.percentage >= 70 ? 'text-emerald-600 dark:text-emerald-400' : attempt.percentage >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-8 text-center">
        <p className="muted text-sm">{attempt.quizTitle}</p>
        <p className={`mt-2 text-6xl font-semibold ${tone}`}>{attempt.percentage}%</p>
        <p className="mt-2">You got {attempt.score} of {attempt.total} correct.</p>
        <Button className="mt-5" onClick={onClose}>Back to quizzes</Button>
      </motion.div>
      <h2 className="mb-3 mt-8 font-semibold">Review</h2>
      <ol className="space-y-4">
        {attempt.review.map((r, i) => (
          <motion.li key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }} className="card p-5">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${r.isCorrect ? 'bg-emerald-600' : 'bg-red-600'}`}>{r.isCorrect ? <Check className="h-4 w-4" aria-label="Correct" /> : <X className="h-4 w-4" aria-label="Incorrect" />}</span>
              <p className="font-medium text-slate-900 dark:text-white">{r.question}</p>
            </div>
            <ul className="mt-3 space-y-1.5 pl-9 text-sm">
              {r.options.map((o, idx) => (
                <li key={idx} className={idx === r.correctIndex ? 'font-medium text-emerald-700 dark:text-emerald-300' : idx === r.selectedIndex ? 'text-red-700 line-through dark:text-red-300' : 'muted'}>
                  {LETTERS[idx]}. {o}{idx === r.correctIndex && ' (correct)'}{idx === r.selectedIndex && idx !== r.correctIndex && ' (your answer)'}
                </li>
              ))}
              {r.selectedIndex === null && <li className="muted">You did not answer this question.</li>}
            </ul>
            <p className="muted mt-3 rounded-lg bg-slate-50 p-3 pl-4 text-sm dark:bg-white/5"><span className="font-medium">Why: </span>{r.explanation}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

export default function Quizzes() {
  const list = useApi('/quizzes', { limit: 30 });
  const [view, setView] = useState({ name: 'list' });
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  async function start(id) {
    try { setView({ name: 'play', quiz: (await api.get(`/quizzes/${id}`)).data.data }); } catch (e) { toast.error(errMsg(e)); }
  }
  async function remove() {
    setBusy(true);
    try { await api.delete(`/quizzes/${del._id}`); toast.success('Quiz deleted'); setDel(null); list.reload(true); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }

  if (view.name === 'play') return <Play quiz={view.quiz} onExit={() => setView({ name: 'list' })} onDone={(a) => { list.reload(true); setView({ name: 'result', attempt: a }); }} />;
  if (view.name === 'result') return <Result attempt={view.attempt} onClose={() => setView({ name: 'list' })} />;

  return (
    <Stagger>
      <Item><PageHeader title="Quizzes" text="Generate multiple-choice quizzes from a document or your notes. Scores are calculated on the server and saved." /></Item>
      <Item><Generate onCreated={(quiz) => { list.reload(true); setView({ name: 'play', quiz }); }} /></Item>
      <Item className="mt-8">
        <h2 className="mb-3 font-semibold">Your quizzes</h2>
        {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading ? <Skeleton className="h-24" /> : !list.data.length ? <Empty icon={ClipboardCheck} title="No quizzes yet" text="Generate your first quiz above." /> : (
          <ul className="space-y-3">
            {list.data.map((q) => (
              <li key={q._id} className="card flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-900 dark:text-white">{q.title}</p><p className="muted text-xs capitalize">{q.questionCount} questions · {q.difficulty} · {formatDate(q.createdAt)} · {q.attempts ? `${q.attempts} attempt${q.attempts > 1 ? 's' : ''}, best ${q.best}%` : 'not attempted'}</p></div>
                <Button size="sm" onClick={() => start(q._id)}>{q.attempts ? 'Retake' : 'Start'}</Button>
                <button onClick={() => setDel(q)} aria-label={`Delete ${q.title}`} className="btn btn-ghost p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Item>
      <Confirm open={!!del} onClose={() => setDel(null)} loading={busy} onConfirm={remove} title="Delete this quiz?" text="The quiz and all of its saved attempts will be deleted." />
    </Stagger>
  );
}
