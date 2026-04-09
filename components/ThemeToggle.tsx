'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('dnd-theme');
    if (saved) setTheme(saved);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dnd-theme', next);
  }

  return (
    <button className="btn btn-sm btn-outline-primary" onClick={toggle}>
      <i className="bi bi-circle-half" />
    </button>
  );
}
