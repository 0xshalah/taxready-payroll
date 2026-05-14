/**
 * Theme Provider — Dark/Light mode with View Transitions API Circular Reveal
 * 
 * - "Eclipse" Effect: Light → Dark — old view shrinks (circle menyusut)
 * - "Sunrise" Effect: Dark → Light — new view expands (circle melebar)
 * 
 * Menggunakan document.startViewTransition() + Web Animations API (WAAPI)
 * untuk animasi clip-path yang berpusat pada koordinat klik.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'taxready-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? 'dark';
  });

  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback((event?: React.MouseEvent) => {
    const isDark = themeRef.current !== 'dark'; // Target: apakah mau jadi dark?
    const newTheme: Theme = isDark ? 'dark' : 'light';

    // Fallback untuk browser yang belum mendukung View Transitions API
    if (!document.startViewTransition) {
      setThemeState(newTheme);
      return;
    }

    // Ambil koordinat klik (atau tengah layar jika tidak ada event)
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    // Hitung radius maksimal (jarak dari titik klik ke sudut terjauh layar)
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Mulai transisi
    const transition = document.startViewTransition(() => {
      // Terapkan perubahan state DOM
      setThemeState(newTheme);
    });

    // Tunggu hingga pseudo-elements transisi siap
    transition.ready.then(() => {
      // Definisikan clip-path keyframes
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      // Eclipse (→ dark): Layar LAMA di-clip menyusut (old view shrinks away)
      // Sunrise (→ light): Layar BARU di-clip melebar (new view expands in)
      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: isDark
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        }
      );
    }).catch(() => {
      // Transition was skipped (prefers-reduced-motion or interrupted)
    });
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
