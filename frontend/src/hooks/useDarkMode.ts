import { useEffect, useState } from 'react';

export function useDarkMode(): [boolean, () => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('pingtest-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pingtest-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pingtest-theme', 'light');
    }
  }, [enabled]);

  return [enabled, () => setEnabled((prev) => !prev)];
}
