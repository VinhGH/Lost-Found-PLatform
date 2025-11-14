import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";

// Initialize theme (system preference + persisted choice)
const THEME_STORAGE_KEY = 'theme';
const applyThemeClass = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark');
  } else {
    root.setAttribute('data-theme', 'light');
    document.body.classList.remove('dark');
  }
};

(() => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    let theme = saved;
    if (!theme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    applyThemeClass(theme);
    // If user follows system by default, also react to system changes until user toggles
    if (!saved && window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => applyThemeClass(e.matches ? 'dark' : 'light');
      try {
        mql.addEventListener('change', handler);
      } catch (_) {
        // Safari fallback
        mql.addListener(handler);
      }
    }
    // Expose a simple global for toggling used by the button component
    window.__toggleTheme = () => {
      const isDark = document.body.classList.contains('dark');
      const next = isDark ? 'light' : 'dark';
      localStorage.setItem(THEME_STORAGE_KEY, next);
      applyThemeClass(next);
    };
    window.__getTheme = () => (document.body.classList.contains('dark') ? 'dark' : 'light');
  } catch (err) {
    // Fail silently; app still runs
    console.warn('Theme init failed', err);
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>

  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
