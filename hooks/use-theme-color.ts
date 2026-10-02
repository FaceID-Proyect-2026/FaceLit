// ─────────────────────────────────────────────
//  shared/hooks/useThemeColor.ts
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { AppTheme } from '@/shared/contexts/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof AppTheme
) {
  const { theme, isDark } = useTheme();
  const scheme = isDark ? 'dark' : 'light';
  return props[scheme] ?? (theme[colorName] as string);
}