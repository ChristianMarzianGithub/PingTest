import { useEffect, useState } from 'react';

export function useHistory(): [string[], (host: string) => void] {
  const [history, setHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem('pingtest-history');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('pingtest-history', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  const push = (host: string) => {
    if (!host) return;
    setHistory((prev) => {
      const updated = [host, ...prev.filter((h) => h !== host)];
      return updated.slice(0, 10);
    });
  };

  return [history, push];
}
