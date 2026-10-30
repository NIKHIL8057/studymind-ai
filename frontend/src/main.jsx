import '@fontsource-variable/inter';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster richColors position="top-right" closeButton />
          </AuthProvider>
        </ThemeProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
);
