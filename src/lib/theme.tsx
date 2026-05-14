/**
 * Theme Provider — Circular Reveal with View Transitions API
 * 
 * Eclipse (Light → Dark): Lingkaran GELAP melebar dari titik klik menutupi layar terang
 * Sunrise (Dark → Light): Lingkaran TERANG melebar dari titik klik menutupi layar gelap
 * 
 * Kedua arah menggunakan ::view-transition-new(root) yang MELEBAR (expand).
 * Perbedaannya hanya state DOM yang diterapkan di dalam callback.
 * Ini memastikan animasi selalu smooth karena hanya satu arah (expand).
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

    // Fallback
    if (!document.startViewTransition) {
      setThemeState(newTheme);
      return;
    }

    // Koordinat klik
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    // Radius maksimal — dari titik klik ke sudut terjauh
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Mulai View Transition
    const transition = document.startViewTransition(() => {
      setThemeState(newTheme);
    });

    transition.ready.then(() => {
      // Selalu animate ::view-transition-new(root) MELEBAR dari titik klik
      // Ini yang paling smooth karena GPU hanya perlu expand satu layer
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // Smooth snap di akhir
          pseudoElement: '::view-transition-new(root)',
        }
      );
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
