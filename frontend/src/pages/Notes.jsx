import { Copy, Download, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import { Children, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Button, Confirm, Empty, ErrorState, Field, Select, Skeleton } from '../components/ui.jsx';
import { api, errMsg, useApi } from '../lib/api.js';
import { formatDate } from '../lib/validators.js';

const slug = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
const text = (c) => Children.toArray(c).join('');
const H = (Tag) => ({ children }) => <Tag id={slug(text(children))}>{children}</Tag>;

function Generator({ onCreated }) {
  const docs = useApi('/documents', { status: 'ready', limit: 50, sort: 'title' });
  const [f, setF] = useState({ documentId: '', type: 'summary', language: 'English', length: 'medium', difficulty: 'intermediate', format: 'mixed' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  async function go(e) {
    e.preventDefault();
    setBusy(true);
    try { const n = (await api.post('/notes/generate', f)).data.data; toast.success('Notes generated'); onCreated(n._id); }
    catch (err) { toast.error(errMsg(err)); setBusy(false); }
  }
  return (
    <form onSubmit={go} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Generate notes</h2>
      {docs.loading ? <Skeleton className="h-10" /> : (
        <Select label="Source document" value={f.documentId} onChange={set('documentId')} required>
          <option value="">{docs.data?.length ? 'Choose a document…' : 'No processed documents'}</option>
          {docs.data?.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}
        </Select>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Note type" value={f.type} onChange={set('type')}>
          <option value="summary">Short summary</option><option value="detailed">Detailed notes</option><option value="chapter">Chapter-wise notes</option>
          <option value="concepts">Important concepts</option><option value="definitions">Key definitions</option><option value="revision">Revision notes</option><option value="beginner">Beginner-friendly explanation</option>
        </Select>
        <Field label="Output language" value={f.language} onChange={set('language')} maxLength={40} />
        <Select label="Length" value={f.length} onChange={set('length')}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></Select>
        <Select label="Difficulty" value={f.difficulty} onChange={set('difficulty')}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        <Select label="Format" value={f.format} onChange={set('format')}><option value="mixed">Mixed</option><option value="bullets">Bullet points</option><option value="paragraphs">Paragraphs</option></Select>
      </div>
      <Button type="submit" loading={busy} disabled={!f.documentId}>Generate notes</Button>
    </form>
  );
}

function Reader({ id, onChanged, onDeleted }) {
  const { data: note, loading, error, reload } = useApi(`/notes/${id}`);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { if (note) { setDraft({ title: note.title, content: note.content }); setEdit(false); } }, [note]);
  const toc = useMemo(() => (note?.content.match(/^#{1,3} .+$/gm) || []).map((l) => l.replace(/^#+ /, '')), [note]);

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  async function save() {
    setBusy(true);
    try { await api.patch(`/notes/${id}`, draft); toast.success('Saved'); onChanged(); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  const download = (ext) => {
    const url = URL.createObjectURL(new Blob([note.content], { type: 'text/plain;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: `${slug(note.title) || 'notes'}.${ext}` }).click();
    URL.revokeObjectURL(url);
  };
  async function del() {
    setBusy(true);
    try { await api.delete(`/notes/${id}`); toast.success('Note deleted'); onDeleted(); } catch (e) { toast.error(errMsg(e)); setBusy(false); }
  }

  return (
    <article className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {edit ? <Field label="Title" value={draft.title} maxLength={120} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} /> : <h2 className="text-2xl font-semibold">{note.title}</h2>}
          <p className="muted mt-1 text-xs">{note.document?.title ? `From ${note.document.title} · ` : ''}Updated {formatDate(note.updatedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {edit ? <><Button size="sm" loading={busy} onClick={save}><Save className="h-4 w-4" />Save</Button><Button size="sm" variant="secondary" onClick={() => setEdit(false)}>Cancel</Button></> : <>
            <button className="btn btn-ghost p-2" aria-label="Edit note" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /></button>
            <button className="btn btn-ghost p-2" aria-label="Copy note" onClick={() => navigator.clipboard.writeText(note.content).then(() => toast.success('Copied'), () => toast.error('Copy failed'))}><Copy className="h-4 w-4" /></button>
            <button className="btn btn-ghost p-2" aria-label="Download as text file" onClick={() => download('txt')}><Download className="h-4 w-4" /></button>
            <button className="btn btn-ghost p-2 text-red-600" aria-label="Delete note" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /></button>
          </>}
        </div>
      </div>
      {edit ? (
        <div className="mt-4"><label htmlFor="nc" className="label">Content (Markdown)</label><textarea id="nc" className="input min-h-[420px] font-mono" value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} /></div>
      ) : (
        <div className="mt-5 gap-8 lg:grid lg:grid-cols-[1fr_200px]">
          <div className="md max-w-prose"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: H('h1'), h2: H('h2'), h3: H('h3') }}>{note.content}</ReactMarkdown></div>
          {toc.length > 2 && (
            <nav aria-label="Table of contents" className="mt-6 hidden h-fit text-sm lg:sticky lg:top-24 lg:mt-0 lg:block">
              <p className="mb-2 font-semibold">On this page</p>
              <ul className="muted space-y-1.5 border-l border-slate-200 pl-3 dark:border-white/10">{toc.map((t) => <li key={t}><button className="text-left hover:text-violet-600" onClick={() => document.getElementById(slug(t))?.scrollIntoView({ behavior: 'smooth' })}>{t}</button></li>)}</ul>
            </nav>
          )}
        </div>
      )}
      <Confirm open={confirm} onClose={() => setConfirm(false)} loading={busy} onConfirm={del} title="Delete this note?" text="This cannot be undone." />
    </article>
  );
}

export default function Notes() {
  const { noteId } = useParams();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [creating, setCreating] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);
  const list = useApi('/notes', { q: dq, limit: 30 });

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside aria-label="Your notes">
        <div className="mb-3 flex items-center justify-between"><h1 className="text-2xl font-semibold">Notes</h1><Button size="sm" onClick={() => { setCreating(true); nav('/app/notes'); }}><Plus className="h-4 w-4" />New</Button></div>
        <div className="relative mb-3"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input className="input pl-9" aria-label="Search notes" placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {list.loading ? <Skeleton className="h-40" /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : !list.data.length ? <p className="muted card p-5 text-sm">{dq ? 'No notes match your search.' : 'No notes yet. Generate your first set.'}</p> : (
          <ul className="space-y-2">
            {list.data.map((n) => (
              <li key={n._id}><button onClick={() => { setCreating(false); nav(`/app/notes/${n._id}`); }} className={`card w-full p-3 text-left ${n._id === noteId ? 'border-violet-500 ring-1 ring-violet-500' : 'hover:border-violet-300'}`}><p className="truncate text-sm font-medium text-slate-900 dark:text-white">{n.title}</p><p className="muted text-xs">{formatDate(n.updatedAt)}</p></button></li>
            ))}
          </ul>
        )}
      </aside>
      <section>
        {noteId && !creating ? <Reader key={noteId} id={noteId} onChanged={() => list.reload(true)} onDeleted={() => { list.reload(true); nav('/app/notes'); }} />
          : creating || (!list.loading && !list.data?.length) ? <Generator onCreated={(id) => { setCreating(false); list.reload(true); nav(`/app/notes/${id}`); }} />
          : <Empty icon={Plus} title="Select a note" text="Pick a note from the list or generate a new one." action={<Button onClick={() => setCreating(true)}>Generate notes</Button>} />}
      </section>
    </div>
  );
}
