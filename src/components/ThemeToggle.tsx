/**
 * ThemeToggle — Animated dark/light mode switch with circular reveal transition
 * Passes click event coordinates for View Transitions API circular clip-path animation.
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={(e) => toggleTheme(e)}
      className="relative h-8 w-8 rounded-lg border border-hairline bg-canvas-card flex items-center justify-center text-ink-mute hover:text-ink hover:border-primary/30 transition-all duration-200"
      aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
      title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
