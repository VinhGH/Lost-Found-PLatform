import React, { useEffect, useState } from "react";

const btnStyle = {
  position: "fixed",
  right: "18px",
  bottom: "18px",
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  backgroundColor: "var(--btn-bg, #1e3a8a)",
  color: "white",
  border: "none",
  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const iconStyle = { width: 22, height: 22 };

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => (window.__getTheme ? window.__getTheme() : 'light'));

  useEffect(() => {
    const id = setInterval(() => {
      // keep local state in sync if changed elsewhere
      if (window.__getTheme) {
        const current = window.__getTheme();
        if (current !== theme) setTheme(current);
      }
    }, 500);
    return () => clearInterval(id);
  }, [theme]);

  const toggle = () => {
    if (window.__toggleTheme) {
      window.__toggleTheme();
      setTheme(window.__getTheme ? window.__getTheme() : theme === 'dark' ? 'light' : 'dark');
    }
  };

  const isDark = theme === 'dark';

  return (
    <button aria-label="Đổi chế độ giao diện" title="Đổi chế độ giao diện" onClick={toggle} style={btnStyle}>
      {isDark ? (
        // Sun icon
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.48 0l1.79-1.8 1.41 1.41-1.8 1.79-1.4-1.4zM12 4V1h-1v3h1zm0 19v-3h-1v3h1zm7-10h3v-1h-3v1zM3 13v-1H0v1h3zm2.34 6.66l-1.8 1.79 1.41 1.41 1.79-1.8-1.4-1.4zM20.66 19.66l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM12 7a5 5 0 100 10 5 5 0 000-10z"/>
        </svg>
      ) : (
        // Moon icon
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M12.74 2a9.99 9.99 0 00-4.12 19.1 10 10 0 0012.37-12.37A10.02 10.02 0 0012.74 2zm-.72 2a8 8 0 018 8 8.02 8.02 0 01-9.88 7.77A8 8 0 0012.02 4z"/>
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;


