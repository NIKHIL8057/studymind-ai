import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, BookOpen, ChevronDown, ClipboardCheck, FileUp, Layers, Menu, MessageSquare, Sparkles, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Moon, Sun } from 'lucide-react';

const LINKS = [['Features', '#features'], ['How it works', '#how'], ['About', '#about']];

function Navbar() {
  const [open, setOpen] = useState(false);
  const { dark, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-slate-50/85 backdrop-blur dark:border-white/10 dark:bg-ink-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {LINKS.map(([l, h]) => <a key={h} href={h} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">{l}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} className="btn btn-ghost p-2">{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
          <Link to="/login" className="btn btn-ghost hidden sm:inline-flex">Sign in</Link>
          <Link to="/signup" className="btn btn-primary hidden sm:inline-flex">Get Started Free</Link>
          <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open} className="btn btn-ghost p-2 md:hidden">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200 dark:border-white/10 md:hidden">
            <div className="flex flex-col gap-1 p-4">
              {LINKS.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="btn btn-ghost justify-start">{l}</a>)}
              <Link to="/login" className="btn btn-secondary mt-2">Sign in</Link>
              <Link to="/signup" className="btn btn-primary">Get Started Free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Original product illustration built from markup. Content is sample text, not user data or statistics.
function ProductPreview() {
  return (
    <div className="card overflow-hidden shadow-2xl shadow-indigo-900/10 dark:shadow-black/40" role="img" aria-label="Illustration of the StudyMind AI chat with a document">
      <div className="flex items-center gap-1.5 border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/20" /><span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/20" />
        <span className="muted ml-3 text-xs">Cell Biology: Chapter 4.pdf</span>
      </div>
      <div className="grid grid-cols-5">
        <div className="col-span-2 hidden space-y-2 border-r border-slate-200 p-4 dark:border-white/10 sm:block">
          {['Chat', 'Notes', 'Quiz', 'Flashcards'].map((t, i) => (
            <div key={t} className={`rounded-lg px-3 py-2 text-xs font-medium ${i === 0 ? 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200' : 'muted'}`}>{t}</div>
          ))}
        </div>
        <div className="col-span-5 space-y-3 p-4 text-sm sm:col-span-3">
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-white">What does the mitochondrion do?</div>
          <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2.5 dark:bg-white/10">
            Mitochondria generate most of the cell's ATP through oxidative phosphorylation.
            <span className="mt-2 flex gap-1.5"><span className="rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-900 dark:bg-cyan-400/20 dark:text-cyan-200">Page 12</span><span className="rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-900 dark:bg-cyan-400/20 dark:text-cyan-200">Page 14</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: MessageSquare, title: 'Chat with your PDFs', text: 'Ask a question in plain language. Answers are grounded in your document and show the pages they came from. If the document does not say, StudyMind tells you so.', cls: 'lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-transparent', light: true },
  { icon: BookOpen, title: 'AI-generated notes', text: 'Summaries, definitions, revision sheets and chapter notes in your language and difficulty, saved so you can edit them.' },
  { icon: ClipboardCheck, title: 'Smart quizzes', text: 'Multiple-choice quizzes with explanations. Scoring happens on the server, and every attempt is saved.' },
  { icon: Layers, title: 'Interactive flashcards', text: 'Flip, shuffle and rate cards Easy, Medium or Difficult, using only your keyboard if you like.' },
  { icon: BarChart3, title: 'Learning analytics', text: 'Charts built from your real quiz results, with weak topics highlighted.' },
];

const STEPS = [
  [FileUp, 'Upload your study material', 'Drop in a PDF. Text is extracted and split into searchable passages.'],
  [Sparkles, 'Let AI understand the content', 'Each passage keeps its page number so answers can point back to the source.'],
  [TrendingUp, 'Study, practice, and track progress', 'Chat, make notes, take quizzes and review flashcards. Your results build your analytics.'],
];

const FAQ = [
  ['What kind of files can I upload?', 'PDF files with selectable text. Scanned PDFs need OCR first, and StudyMind will tell you when that is the case.'],
  ['Are answers always correct?', 'Answers are based on passages retrieved from your document and cite page numbers, but AI can still make mistakes. Check the cited pages for anything important.'],
  ['Who can see my documents?', 'Only you. Every document, note and quiz is tied to your account and checked on the server for each request.'],
  ['Does it cost anything?', 'You can start for free. Usage limits apply to AI features to keep the service reliable.'],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-ink-900">
      {FAQ.map(([q, a], i) => (
        <div key={q}>
          <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-slate-900 dark:text-white">
            {q}<ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence initial={false}>
            {open === i && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="muted overflow-hidden px-5 pb-4 text-sm">{a}</motion.p>}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <main>
        <section className="relative">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,58,237,0.18),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,58,237,0.3),transparent)]" />
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-semibold leading-[1.1] sm:text-6xl">Turn Your Study Material Into Your Superpower.</h1>
              <p className="muted mx-auto mt-5 max-w-xl text-lg">Upload your notes, ask questions, generate quizzes, and learn smarter with your personal AI study assistant.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/signup" className="btn btn-primary px-6 py-3">Get Started Free</Link>
                <a href="#features" className="btn btn-secondary px-6 py-3">Explore Features</a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="mx-auto mt-14 max-w-3xl"><ProductPreview /></motion.div>
            <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {['PDF chat with page references', 'Notes', 'Quizzes', 'Flashcards', 'Analytics'].map((t) => <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />{t}</li>)}
            </ul>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 className="max-w-xl text-3xl font-semibold sm:text-4xl">Everything you need between the textbook and the exam</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, cls, light }) => (
              <div key={title} className={`card p-6 ${cls || ''}`}>
                <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${light ? 'bg-white/15' : 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'}`}><Icon className="h-5 w-5" /></div>
                <h3 className={`text-lg font-semibold ${light ? '!text-white' : ''}`}>{title}</h3>
                <p className={`mt-2 text-sm leading-6 ${light ? 'text-indigo-100' : 'muted'}`}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-white py-20 dark:bg-ink-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold sm:text-4xl">How it works</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map(([Icon, t, d], i) => (
                <li key={t} className="relative">
                  <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 font-semibold text-white">{i + 1}</span><Icon className="h-5 w-5 text-cyan-500" aria-hidden="true" /></div>
                  <h3 className="text-lg font-semibold">{t}</h3><p className="muted mt-1 text-sm">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="about" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Built for how students really revise</h2>
            <p className="muted mt-4">StudyMind AI keeps you in your own material. Instead of generic answers from the internet, every response starts from the pages you uploaded, so you can verify it and move on.</p>
          </div>
          <ul className="space-y-4">
            {[['Save time', 'Turn a 60-page chapter into a one-page revision sheet.'], ['Practice actively', 'Quizzes and flashcards beat re-reading.'], ['See what to fix', 'Weak topics come from your own quiz results.']].map(([t, d]) => (
              <li key={t} className="card p-5"><h3 className="font-semibold">{t}</h3><p className="muted mt-1 text-sm">{d}</p></li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <h2 className="mb-6 text-3xl font-semibold">Frequently asked questions</h2>
          <Faq />
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 p-10 text-center sm:p-14">
            <h2 className="text-3xl font-semibold !text-white sm:text-4xl">Start with one PDF.</h2>
            <p className="mx-auto mt-3 max-w-md text-indigo-100">Upload a chapter and ask your first question in under a minute.</p>
            <Link to="/signup" className="btn mt-7 bg-white px-6 py-3 text-indigo-700 hover:bg-indigo-50">Get Started Free</Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm sm:px-6">
          <Logo /><nav aria-label="Footer" className="muted flex gap-6">{LINKS.map(([l, h]) => <a key={h} href={h}>{l}</a>)}<Link to="/login">Sign in</Link></nav>
          <p className="muted">© {new Date().getFullYear()} StudyMind AI</p>
        </div>
      </footer>
    </div>
  );
}
