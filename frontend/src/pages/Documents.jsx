import { Eye, FileText, Pencil, Search, Trash2, UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Confirm, Empty, ErrorState, Field, Item, Modal, PageHeader, ProgressBar, Skeleton, Stagger, StatusBadge } from '../components/ui.jsx';
import { api, errMsg, useApi } from '../lib/api.js';
import { formatBytes, formatDate } from '../lib/validators.js';

const MAX_MB = Number(import.meta.env.VITE_MAX_FILE_MB) || 20;

export default function Documents() {
  const [sp] = useSearchParams();
  const [qInput, setQInput] = useState(sp.get('q') || '');
  const [q, setQ] = useState(qInput);
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useApi('/documents', { q, sort, page, limit: 10 });
  const [progress, setProgress] = useState(null);
  const [drag, setDrag] = useState(false);
  const [rename, setRename] = useState(null);
  const [del, setDel] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  useEffect(() => setQInput(sp.get('q') || ''), [sp]);
  useEffect(() => { const t = setTimeout(() => { setQ(qInput); setPage(1); }, 300); return () => clearTimeout(t); }, [qInput]);
  useEffect(() => {
    if (!data?.some((d) => d.status === 'processing')) return;
    const t = setInterval(() => reload(true), 3000);
    return () => clearInterval(t);
  }, [data, reload]);

  async function upload(files) {
    const f = files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) return toast.error('Only PDF files are supported.');
    if (f.size > MAX_MB * 1024 * 1024) return toast.error(`This file is larger than ${MAX_MB} MB.`);
    const fd = new FormData();
    fd.append('file', f);
    setProgress(0);
    try {
      await api.post('/documents', fd, { onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || f.size))) });
      toast.success('Uploaded. Processing has started.');
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setProgress(null); }
  }

  async function doRename(e) {
    e.preventDefault();
    setBusy(true);
    try { await api.patch(`/documents/${rename._id}`, { title: rename.title }); toast.success('Renamed'); setRename(null); reload(); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  }

  async function doDelete() {
    setBusy(true);
    try { await api.delete(`/documents/${del._id}`); toast.success('Document deleted'); setDel(null); reload(); }
    catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  }

  async function openPreview(d) {
    try {
      const r = await api.get(`/documents/${d._id}/file`, { responseType: 'blob' });
      setPreview({ title: d.title, url: URL.createObjectURL(r.data) });
    } catch (e) { toast.error(errMsg(e)); }
  }
  const closePreview = useCallback(() => { setPreview((p) => { if (p) URL.revokeObjectURL(p.url); return null; }); }, []);

  return (
    <Stagger>
      <Item><PageHeader title="My Documents" text={`Upload PDF study material (up to ${MAX_MB} MB). Text is extracted so you can chat, make notes, quizzes and flashcards.`} /></Item>

      <Item>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
          className={`flex flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${drag ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10' : 'border-slate-300 dark:border-white/15'}`}
        >
          <UploadCloud className="h-9 w-9 text-violet-500" aria-hidden="true" />
          <p className="mt-3 font-medium">Drag and drop a PDF here</p>
          <p className="muted text-sm">or choose a file from your device</p>
          <input ref={input} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label="Choose PDF file" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
          <Button className="mt-4" onClick={() => input.current?.click()} disabled={progress !== null}>Choose PDF</Button>
          {progress !== null && <div className="mt-4 w-full max-w-sm"><ProgressBar value={progress} label="Upload progress" /><p className="muted mt-1 text-xs">Uploading… {progress}%</p></div>}
        </div>
      </Item>

      <Item className="my-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={qInput} onChange={(e) => setQInput(e.target.value)} aria-label="Search documents" placeholder="Search by title" className="input pl-9" />
        </div>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort documents" className="input w-auto">
          <option value="-createdAt">Newest first</option><option value="createdAt">Oldest first</option>
          <option value="title">Title A–Z</option><option value="-title">Title Z–A</option><option value="-size">Largest first</option>
        </select>
      </Item>

      <Item>
        {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div> : data.length === 0 ? (
          <Empty icon={FileText} title={q ? 'No documents match your search' : 'No documents yet'} text={q ? 'Try a different title.' : 'Upload your first PDF above to get started.'} />
        ) : (
          <ul className="space-y-3">
            {data.map((d) => (
              <li key={d._id} className="card flex flex-wrap items-center gap-4 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><FileText className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{d.title}</p>
                  <p className="muted text-xs">{formatBytes(d.size)} · {d.status === 'ready' ? `${d.pageCount} pages · ` : ''}{formatDate(d.createdAt)}</p>
                  {d.status === 'failed' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{d.error}</p>}
                </div>
                <StatusBadge status={d.status} />
                <div className="flex gap-1">
                  {d.status === 'ready' && <Link to={`/app/chat/${d._id}`} className="btn btn-secondary btn-sm">Chat</Link>}
                  <button onClick={() => openPreview(d)} aria-label={`Preview ${d.title}`} className="btn btn-ghost p-2"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => setRename({ _id: d._id, title: d.title })} aria-label={`Rename ${d.title}`} className="btn btn-ghost p-2"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDel(d)} aria-label={`Delete ${d.title}`} className="btn btn-ghost p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {meta?.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="muted text-sm">Page {page} of {meta.pages}</span>
            <Button variant="secondary" size="sm" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Item>

      <Modal open={!!rename} onClose={() => setRename(null)} title="Rename document">
        <form onSubmit={doRename} className="space-y-4">
          <Field label="Title" value={rename?.title || ''} maxLength={120} onChange={(e) => setRename((r) => ({ ...r, title: e.target.value }))} autoFocus />
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setRename(null)}>Cancel</Button><Button type="submit" loading={busy} disabled={!rename?.title.trim()}>Save</Button></div>
        </form>
      </Modal>
      <Confirm open={!!del} onClose={() => setDel(null)} loading={busy} onConfirm={doDelete} title="Delete this document?" text={`"${del?.title}", its file and its chat history will be permanently deleted. Notes, quizzes and flashcards you already generated are kept.`} />
      <Modal open={!!preview} onClose={closePreview} title={preview?.title || 'Preview'} wide>
        {preview && <iframe title={`Preview of ${preview.title}`} src={preview.url} className="h-[70vh] w-full rounded-lg border border-slate-200 dark:border-white/10" />}
      </Modal>
    </Stagger>
  );
}
