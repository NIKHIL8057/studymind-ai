import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import { Spinner } from './components/ui.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Analytics from './pages/Analytics.jsx';
import { Login, Signup } from './pages/AuthPages.jsx';
import Chat from './pages/Chat.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Documents from './pages/Documents.jsx';
import Flashcards from './pages/Flashcards.jsx';
import Landing from './pages/Landing.jsx';
import Notes from './pages/Notes.jsx';
import Quizzes from './pages/Quizzes.jsx';
import Settings from './pages/Settings.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner className="h-6 w-6" /></div>;
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
      <Route path="/app" element={<Protected><AppShell /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="chat/:docId?" element={<Chat />} />
        <Route path="notes/:noteId?" element={<Notes />} />
        <Route path="quizzes" element={<Quizzes />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<div className="grid min-h-screen place-items-center text-center"><div><h1 className="text-3xl font-semibold">Page not found</h1><a href="/" className="btn btn-primary mt-4">Go home</a></div></div>} />
    </Routes>
  );
}
