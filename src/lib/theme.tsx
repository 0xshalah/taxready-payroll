/**
 * Theme Provider & Toggle — Dark/Light mode with View Transitions API
 * 
 * Transisi menggunakan:
 * - "Eclipse" Effect: Light → Dark (lingkaran gelap melebar dari titik klik)
 * - "Sunrise" Effect: Dark → Light (lingkaran terang melebar dari titik klik)
 * 
 * Fallback: langsung switch tanpa animasi jika browser tidak support View Transitions.
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
    const newTheme = themeRef.current === 'dark' ? 'light' : 'dark';

    // Get click coordinates for circular reveal origin
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    // Calculate the maximum radius needed to cover the entire viewport
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      // Fallback: instant switch
      setThemeState(newTheme);
      return;
    }

    // Set CSS custom properties for the animation origin
    document.documentElement.style.setProperty('--transition-x', `${x}px`);
    document.documentElement.style.setProperty('--transition-y', `${y}px`);
    document.documentElement.style.setProperty('--transition-radius', `${maxRadius}px`);

    const transition = document.startViewTransition(() => {
      setThemeState(newTheme);
    });

    transition.ready.then(() => {
      // Animate the new view with circular clip-path
      const isEclipse = newTheme === 'dark'; // Light → Dark = Eclipse

      document.documentElement.animate(
        {
          clipPath: isEclipse
            ? [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ]
            : [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: isEclipse
            ? '::view-transition-new(root)'
            : '::view-transition-new(root)',
        }
      );
    }).catch(() => {
      // Transition was skipped (e.g., prefers-reduced-motion)
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
