import { MessageSquarePlus, Send, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Button, Empty, ErrorState, PageHeader, Skeleton, Spinner } from '../components/ui.jsx';
import { api, errMsg, useApi } from '../lib/api.js';

function Bubble({ m }) {
  const mine = m.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? 'justify-end' : ''}`}>
      <div className={`max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${mine ? 'rounded-br-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white' : 'card rounded-bl-sm'}`}>
        {mine ? <p className="whitespace-pre-wrap text-[15px]">{m.content}</p> : (
          <>
            <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
            {m.sources?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-3 dark:border-white/10">
                <span className="muted text-xs">Sources:</span>
                {m.sources.map((s) => <span key={s.page} className="rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-900 dark:bg-cyan-400/20 dark:text-cyan-200">Page {s.page}</span>)}
              </div>
            )}
            {m.supported === false && <p className="muted mt-2 text-xs">Not found in this document, so no sources are shown.</p>}
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const { docId } = useParams();
  const nav = useNavigate();
  const docs = useApi('/documents', { status: 'ready', limit: 50, sort: 'title' });
  const convos = useApi('/chat/conversations', docId ? { document: docId } : undefined);
  const [convoId, setConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(null);
  const bottom = useRef(null);

  useEffect(() => { setConvoId(null); setMessages([]); setFailed(null); }, [docId]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, sending]);

  async function openConvo(id) {
    try { setConvoId(id); setFailed(null); setMessages((await api.get(`/chat/conversations/${id}/messages`)).data.data); }
    catch (e) { toast.error(errMsg(e)); }
  }
  async function removeConvo(id) {
    try { await api.delete(`/chat/conversations/${id}`); if (id === convoId) { setConvoId(null); setMessages([]); } convos.reload(); }
    catch (e) { toast.error(errMsg(e)); }
  }

  async function send(content) {
    if (!content.trim() || sending) return;
    setSending(true); setFailed(null);
    const temp = { _id: `t${Date.now()}`, role: 'user', content };
    setMessages((m) => [...m, temp]);
    setText('');
    try {
      const r = (await api.post(`/chat/${docId}/messages`, { content, conversationId: convoId || undefined })).data.data;
      setConvoId(r.conversation._id);
      setMessages((m) => [...m.filter((x) => x._id !== temp._id), r.userMessage, r.assistantMessage]);
      convos.reload(true);
    } catch (e) {
      setMessages((m) => m.filter((x) => x._id !== temp._id));
      setFailed({ content, message: errMsg(e) });
    } finally { setSending(false); }
  }

  const ready = docs.data || [];
  return (
    <div>
      <PageHeader title="AI Study Assistant" text="Ask questions about a document. Answers use only passages retrieved from it." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="doc" className="sr-only">Document</label>
        <select id="doc" className="input max-w-sm" value={docId || ''} onChange={(e) => nav(e.target.value ? `/app/chat/${e.target.value}` : '/app/chat')}>
          <option value="">Select a document…</option>
          {ready.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}
        </select>
        {docId && <Button variant="secondary" onClick={() => { setConvoId(null); setMessages([]); setFailed(null); }}><MessageSquarePlus className="h-4 w-4" />New conversation</Button>}
      </div>

      {docs.loading ? <Skeleton className="h-64" /> : docs.error ? <ErrorState message={docs.error} onRetry={docs.reload} /> : !docId ? (
        <Empty icon={Sparkles} title={ready.length ? 'Choose a document to start' : 'No processed documents yet'} text={ready.length ? 'Pick one from the list above.' : 'Upload a PDF and wait for it to finish processing.'} action={!ready.length && <a href="/app/documents" className="btn btn-primary">Go to documents</a>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          <aside className="card h-fit p-3 lg:col-span-1" aria-label="Conversation history">
            <p className="muted px-2 pb-2 text-xs font-medium">History</p>
            {convos.loading ? <Skeleton className="h-16" /> : !convos.data?.length ? <p className="muted px-2 pb-2 text-sm">No conversations yet.</p> : (
              <ul className="space-y-1">
                {convos.data.map((c) => (
                  <li key={c._id} className={`group flex items-center rounded-lg ${c._id === convoId ? 'bg-violet-100 dark:bg-violet-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                    <button onClick={() => openConvo(c._id)} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm">{c.title}</button>
                    <button onClick={() => removeConvo(c._id)} aria-label={`Delete conversation ${c.title}`} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
          <section className="flex min-h-[60vh] flex-col lg:col-span-3" aria-label="Conversation">
            <div className="flex-1 space-y-4 pb-4" aria-live="polite">
              {messages.length === 0 && !sending && <p className="muted py-10 text-center text-sm">Ask anything about this document, for example “Summarise the main argument of chapter 2.”</p>}
              {messages.map((m) => <Bubble key={m._id} m={m} />)}
              {sending && <div className="card flex w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm"><Spinner />Reading the document…</div>}
              {failed && <ErrorState message={failed.message} onRetry={() => send(failed.content)} />}
              <div ref={bottom} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="sticky bottom-3 flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-ink-900">
              <label htmlFor="q" className="sr-only">Your question</label>
              <textarea id="q" rows={1} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text); } }} placeholder="Ask a question about this document" className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400" />
              <Button type="submit" loading={sending} disabled={!text.trim()} aria-label="Send question" className="px-3"><Send className="h-4 w-4" /></Button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
