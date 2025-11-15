import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";

// Initialize theme (system preference + persisted choice)
// ✅ Tách riêng theme cho User và Admin
const USER_THEME_KEY = 'userTheme';
const ADMIN_THEME_KEY = 'adminTheme';
const DEFAULT_THEME_KEY = 'theme'; // Fallback cho backward compatibility

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

// ✅ Hàm để xác định context (User/Admin) dựa trên URL hoặc class
const getThemeContext = () => {
  // Kiểm tra xem có class admin-dashboard không
  if (document.querySelector('.admin-dashboard')) {
    return 'admin';
  }
  // Kiểm tra xem có class user-dashboard không
  if (document.querySelector('.user-dashboard')) {
    return 'user';
  }
  // Mặc định là user (cho landing page, auth form, etc.)
  return 'user';
};

(() => {
  try {
    // ✅ Load theme mặc định (cho landing page, auth form)
    const saved = localStorage.getItem(DEFAULT_THEME_KEY);
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
    
    // ✅ Expose theme functions với context awareness
    window.__toggleTheme = (context) => {
      // Nếu không có context, tự động detect
      if (!context) {
        context = getThemeContext();
      }
      
      const isDark = document.body.classList.contains('dark');
      const next = isDark ? 'light' : 'dark';
      
      // ✅ Lưu vào key phù hợp với context
      if (context === 'admin') {
        localStorage.setItem(ADMIN_THEME_KEY, next);
      } else {
        localStorage.setItem(USER_THEME_KEY, next);
      }
      
      // ✅ Lưu vào default key để backward compatibility
      localStorage.setItem(DEFAULT_THEME_KEY, next);
      
      applyThemeClass(next);
    };
    
    window.__getTheme = () => (document.body.classList.contains('dark') ? 'dark' : 'light');
    
    // ✅ Hàm để load theme theo context
    window.__loadTheme = (context) => {
      const themeKey = context === 'admin' ? ADMIN_THEME_KEY : USER_THEME_KEY;
      const savedTheme = localStorage.getItem(themeKey);
      
      if (savedTheme) {
        applyThemeClass(savedTheme);
        // ✅ Cập nhật default theme để sync
        localStorage.setItem(DEFAULT_THEME_KEY, savedTheme);
      } else {
        // ✅ Nếu chưa có theme riêng, dùng default theme
        const defaultTheme = localStorage.getItem(DEFAULT_THEME_KEY);
        if (defaultTheme) {
          applyThemeClass(defaultTheme);
        }
      }
    };
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
