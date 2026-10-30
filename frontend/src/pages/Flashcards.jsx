import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Layers, Shuffle, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Confirm, Empty, ErrorState, Item, PageHeader, ProgressBar, Select, Skeleton, Stagger } from '../components/ui.jsx';
import { api, errMsg, useApi } from '../lib/api.js';
import { formatDate } from '../lib/validators.js';

const RATINGS = [['easy', 'Easy', 'bg-emerald-600 hover:bg-emerald-500'], ['medium', 'Medium', 'bg-amber-600 hover:bg-amber-500'], ['difficult', 'Difficult', 'bg-red-600 hover:bg-red-500']];

function Study({ deckId, onExit }) {
  const { data, loading, error, reload } = useApi(`/flashcards/${deckId}`);
  const [cards, setCards] = useState([]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { if (data) setCards(data.cards); }, [data]);
  const card = cards[i];
  const go = useCallback((d) => { setFlipped(false); setI((x) => Math.min(Math.max(x + d, 0), Math.max(cards.length - 1, 0))); }, [cards.length]);

  const rate = useCallback(async (rating) => {
    if (!card) return;
    try {
      const upd = (await api.patch(`/flashcards/cards/${card._id}/review`, { rating })).data.data;
      setCards((cs) => cs.map((c) => (c._id === upd._id ? upd : c)));
      toast.success(`Marked ${rating}`);
      if (i < cards.length - 1) go(1); else setFlipped(false);
    } catch (e) { toast.error(errMsg(e)); }
  }, [card, i, cards.length, go]);

  useEffect(() => {
    const h = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.closest('button')) { if (e.key === ' ' || e.key === 'Enter') return; }
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); setFlipped((f) => !f); }
      else if (flipped && e.key === '1') rate('easy');
      else if (flipped && e.key === '2') rate('medium');
      else if (flipped && e.key === '3') rate('difficult');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go, rate, flipped]);

  if (loading) return <Skeleton className="mx-auto h-72 max-w-xl" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!card) return <Empty icon={Layers} title="This deck is empty" action={<Button onClick={onExit}>Back</Button>} />;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="truncate font-semibold">{data.deck.title}</h2><button onClick={onExit} className="btn btn-ghost btn-sm">Exit</button></div>
      <ProgressBar value={Math.round(((i + 1) / cards.length) * 100)} label="Deck progress" />
      <p className="muted mt-2 text-sm">Card {i + 1} of {cards.length} · {card.topic}{card.reviews.length > 0 && ` · reviewed ${card.reviews.length}×, last: ${card.reviews[card.reviews.length - 1].rating}`}</p>

      <div className="mt-5" style={{ perspective: 1200 }}>
        <motion.button
          onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Showing answer. Press to show question' : 'Showing question. Press to show answer'}
          animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }} style={{ transformStyle: 'preserve-3d' }}
          className="relative h-72 w-full rounded-3xl"
        >
          <div style={{ backfaceVisibility: 'hidden' }} className="card absolute inset-0 grid place-items-center p-8 text-center shadow-lg">
            <div><p className="muted mb-3 text-xs">Question</p><p className="text-xl font-semibold text-slate-900 dark:text-white">{card.front}</p></div>
          </div>
          <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} className="absolute inset-0 grid place-items-center rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white shadow-lg">
            <div><p className="mb-3 text-xs text-indigo-200">Answer</p><p className="text-lg">{card.back}</p></div>
          </div>
        </motion.button>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <Button variant="secondary" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous card"><ArrowLeft className="h-4 w-4" /></Button>
        <Button variant="secondary" onClick={() => { setCards((c) => [...c].sort(() => Math.random() - 0.5)); setI(0); setFlipped(false); toast('Deck shuffled'); }}><Shuffle className="h-4 w-4" />Shuffle</Button>
        <Button variant="secondary" onClick={() => go(1)} disabled={i === cards.length - 1} aria-label="Next card"><ArrowRight className="h-4 w-4" /></Button>
      </div>

      <div className={`mt-5 grid grid-cols-3 gap-2 transition-opacity ${flipped ? 'opacity-100' : 'pointer-events-none opacity-40'}`} aria-hidden={!flipped}>
        {RATINGS.map(([r, l, c], k) => <button key={r} onClick={() => rate(r)} tabIndex={flipped ? 0 : -1} className={`btn text-white ${c}`}>{l} <kbd className="text-xs opacity-70">{k + 1}</kbd></button>)}
      </div>
      <p className="muted mt-4 text-center text-xs">Keyboard: Space flips · ← → navigate · 1 / 2 / 3 rate after flipping</p>
    </div>
  );
}

export default function Flashcards() {
  const list = useApi('/flashcards', { limit: 30 });
  const docs = useApi('/documents', { status: 'ready', limit: 50, sort: 'title' });
  const notes = useApi('/notes', { limit: 50 });
  const [f, setF] = useState({ source: '', count: 15 });
  const [busy, setBusy] = useState(false);
  const [study, setStudy] = useState(null);
  const [del, setDel] = useState(null);

  async function generate(e) {
    e.preventDefault();
    const [kind, id] = f.source.split(':');
    setBusy(true);
    try {
      const deck = (await api.post('/flashcards/generate', { count: Number(f.count), [kind === 'note' ? 'noteId' : 'documentId']: id })).data.data;
      toast.success('Deck created');
      list.reload(true);
      setStudy(deck._id);
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try { await api.delete(`/flashcards/${del._id}`); toast.success('Deck deleted'); setDel(null); list.reload(true); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }

  if (study) return <Study deckId={study} onExit={() => { setStudy(null); list.reload(true); }} />;
  return (
    <Stagger>
      <Item><PageHeader title="Flashcards" text="Generate a deck from a document or notes, then flip through it and rate how well you know each card." /></Item>
      <Item>
        <form onSubmit={generate} className="card grid gap-4 p-6 sm:grid-cols-3">
          <div className="sm:col-span-2"><Select label="Source" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} required>
            <option value="">Choose a document or note…</option>
            <optgroup label="Documents">{docs.data?.map((d) => <option key={d._id} value={`doc:${d._id}`}>{d.title}</option>)}</optgroup>
            <optgroup label="Notes">{notes.data?.map((n) => <option key={n._id} value={`note:${n._id}`}>{n.title}</option>)}</optgroup>
          </Select></div>
          <Select label="Cards" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })}>{[10, 15, 20, 30, 40].map((n) => <option key={n}>{n}</option>)}</Select>
          <div className="sm:col-span-3"><Button type="submit" loading={busy && !del} disabled={!f.source}>Generate deck</Button></div>
        </form>
      </Item>
      <Item className="mt-8">
        <h2 className="mb-3 font-semibold">Your decks</h2>
        {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading ? <Skeleton className="h-24" /> : !list.data.length ? <Empty icon={Layers} title="No decks yet" text="Generate your first deck above." /> : (
          <ul className="space-y-3">{list.data.map((d) => (
            <li key={d._id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-900 dark:text-white">{d.title}</p><p className="muted text-xs">{d.cardCount} cards · {formatDate(d.createdAt)}</p></div>
              <Button size="sm" onClick={() => setStudy(d._id)}>Study</Button>
              <button onClick={() => setDel(d)} aria-label={`Delete ${d.title}`} className="btn btn-ghost p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
            </li>))}
          </ul>
        )}
      </Item>
      <Confirm open={!!del} onClose={() => setDel(null)} loading={busy} onConfirm={remove} title="Delete this deck?" text="All cards and their review history will be deleted." />
    </Stagger>
  );
}
