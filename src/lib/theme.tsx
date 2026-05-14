/**
 * Theme Provider — Circular Reveal dengan View Transitions API
 *
 * SUNRISE (Dark → Light): Sentrifugal — new (terang) melebar dari kursor
 *   → animate ::view-transition-new(root): circle(0) → circle(max)
 *   → new layer di atas, old (gelap) diam di bawah
 *
 * ECLIPSE (Light → Dark): Sentripetal — old (terang) menyusut ke kursor
 *   → animate ::view-transition-old(root): circle(max) → circle(0)
 *   → old layer dinaikkan ke atas via z-index, new (gelap) terungkap di baliknya
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
    const newTheme: Theme = themeRef.current === 'dark' ? 'light' : 'dark';
    const isEclipse = newTheme === 'dark'; // Light → Dark = Eclipse

    // Fallback: browser tidak support View Transitions
    if (!document.startViewTransition) {
      setThemeState(newTheme);
      return;
    }

    // Koordinat klik (origin animasi)
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    // Radius maksimal: dari titik klik ke sudut terjauh viewport
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setThemeState(newTheme);
    });

    transition.ready.then(() => {
      if (isEclipse) {
        // ─── ECLIPSE: Light → Dark ───────────────────────────────────
        // Tambahkan class untuk override z-index (old di atas new)
        document.documentElement.classList.add('eclipse-transition');

        const anim = document.documentElement.animate(
          {
            clipPath: [
              `circle(${endRadius}px at ${x}px ${y}px)`,
              `circle(0px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-old(root)',
          }
        );

        // Hapus class setelah animasi selesai
        anim.finished.then(() => {
          document.documentElement.classList.remove('eclipse-transition');
        }).catch(() => {
          document.documentElement.classList.remove('eclipse-transition');
        });
      } else {
        // ─── SUNRISE: Dark → Light ───────────────────────────────────
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      }
    }).catch(() => {});
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
