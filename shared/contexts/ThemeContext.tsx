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
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryFaint: string;
  primaryDarkText: string;
  
  // Secondary
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondaryFaint: string;
  secondaryDarkText: string;
  
  // Semantic
  success: string;
  successSoft: string;
  info: string;
  infoSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  
  // Neutros
  background: string;
  surface: string;
  card: string;
  surfaceSecondary: string;
  border: string;
  borderStrong: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  link: string;
  gradientColors: readonly string[];
  statusBar: 'light' | 'dark';
}

// ── Temas ─────────────────────────────────────
const darkTheme: AppTheme = {
  // Primary (Verde SENA)
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  primaryFaint: Colors.primaryFaint,
  primaryDarkText: Colors.primary,
  
  // Secondary (Dorado/Ámbar Cálido)
  secondary: Colors.secondary,
  secondaryLight: Colors.secondaryLight,
  secondaryDark: Colors.secondaryDark,
  secondaryFaint: Colors.secondaryFaint,
  secondaryDarkText: Colors.secondary,
  
  // Semantic
  success: Colors.success,
  successSoft: Colors.successSoft,
  info: Colors.info,
  infoSoft: Colors.infoSoft,
  warning: Colors.warning,
  warningSoft: Colors.warningSoft,
  danger: Colors.danger,
  dangerSoft: Colors.dangerSoft,
  
  // Neutros
  background: Colors.dark.background,
  surface: Colors.dark.surface,
  card: Colors.dark.card,
  surfaceSecondary: Colors.dark.surfaceSecondary,
  border: Colors.dark.border,
  borderStrong: Colors.dark.borderStrong,
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
  // Primary (Verde SENA)
  primary: Colors.primary,
  primaryLight: Colors.primaryLight,
  primaryDark: Colors.primaryDark,
  primaryFaint: Colors.primaryFaint,
  primaryDarkText: Colors.primary,

  // Secondary (Dorado/Ámbar Cálido)
  secondary: Colors.secondary,
  secondaryLight: Colors.secondaryLight,
  secondaryDark: Colors.secondaryDark,
  secondaryFaint: Colors.secondaryFaint,
  secondaryDarkText: Colors.secondary,

  // Semantic
  success: Colors.success,
  successSoft: Colors.successSoft,
  info: Colors.info,
  infoSoft: Colors.infoSoft,
  warning: Colors.warning,
  warningSoft: Colors.warningSoft,
  danger: Colors.danger,
  dangerSoft: Colors.dangerSoft,

  // Neutros
  background: Colors.light.background,
  surface: Colors.light.surface,
  card: Colors.light.card,
  surfaceSecondary: Colors.light.surfaceSecondary,
  border: Colors.light.border,
  borderStrong: Colors.light.borderStrong,
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