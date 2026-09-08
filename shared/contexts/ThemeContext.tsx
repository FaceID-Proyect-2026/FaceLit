// ─────────────────────────────────────────────
//  shared/contexts/ThemeContext.tsx
//  Maneja el tema claro/oscuro de la app
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

// ── Tipos ─────────────────────────────────────
export interface AppTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryFaint: string;
  background: string;
  surface: string;
  card: string;
  border: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  link: string;
  gradientColors: readonly string[];
  statusBar: 'light' | 'dark';
}

// ── Temas ─────────────────────────────────────
const darkTheme: AppTheme = {
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  primaryFaint: Colors.primaryFaint,
  background: Colors.dark.background,
  surface: Colors.dark.surface,
  card: Colors.dark.card,
  border: Colors.dark.border,
  inputBg: Colors.dark.inputBg,
  inputBorder: Colors.dark.inputBorder,
  inputText: Colors.dark.text,
  inputPlaceholder: Colors.dark.placeholder,
  text: Colors.dark.text,
  textMuted: Colors.dark.textMuted,
  textSecondary: Colors.dark.textSecondary,
  link: Colors.dark.link,
  gradientColors: Colors.dark.gradient,
  statusBar: 'light',
};

const lightTheme: AppTheme = {
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  primaryFaint: Colors.primaryFaint,
  background: Colors.light.background,
  surface: Colors.light.surface,
  card: Colors.light.card,
  border: Colors.light.border,
  inputBg: Colors.light.inputBg,
  inputBorder: Colors.light.inputBorder,
  inputText: Colors.light.text,
  inputPlaceholder: Colors.light.placeholder,
  text: Colors.light.text,
  textMuted: Colors.light.textMuted,
  textSecondary: Colors.light.textSecondary,
  link: Colors.light.link,
  gradientColors: Colors.light.gradient,
  statusBar: 'dark',
};

// ── Contexto ──────────────────────────────────
interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void; // ← NUEVO, para aplicar el valor guardado en el backend
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => { },
  setDarkMode: () => { },
});

const STORAGE_KEY = 'facelit-theme';

// ── Provider ──────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    try {
      const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (saved === 'light') setIsDark(false);
      if (saved === 'dark') setIsDark(true);
    } catch { }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      try {
        globalThis.localStorage?.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      } catch { }
      return next;
    });
  };

  const setDarkMode = (value: boolean) => {
    setIsDark(value);
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, value ? 'dark' : 'light');
    } catch { }
  };

  return (
    <ThemeContext.Provider value={{
      theme: isDark ? darkTheme : lightTheme,
      isDark,
      toggleTheme,
      setDarkMode,   // ← NUEVO
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}