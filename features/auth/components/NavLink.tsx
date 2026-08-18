// ─────────────────────────────────────────────
//  features/auth/components/NavLink.tsx
//  Link de navegación reutilizable web/móvil
// ─────────────────────────────────────────────
import { Platform, Text, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { FontSize, FontWeight } from '@/shared/constants/typography';

interface NavLinkProps {
  href:  string;
  label: string;
}

export default function NavLink({ href, label }: NavLinkProps) {
  const { theme } = useTheme();

  const linkStyle = {
    color:              theme.link,
    fontSize:           FontSize.base,
    fontWeight:         FontWeight.bold,
    textDecorationLine: 'underline' as const,
  };

  if (Platform.OS === 'web') {
    return (
      <Link href={href as any} style={linkStyle}>
        {label}
      </Link>
    );
  }

  return (
    <TouchableOpacity onPress={() => router.push(href as any)} activeOpacity={0.8}>
      <Text style={linkStyle}>{label}</Text>
    </TouchableOpacity>
  );
}