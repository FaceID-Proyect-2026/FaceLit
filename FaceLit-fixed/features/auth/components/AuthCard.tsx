// ─────────────────────────────────────────────
//  features/auth/components/AuthCard.tsx
//  Tarjeta contenedora de formularios auth
// ─────────────────────────────────────────────
import {
  View, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet, ViewStyle,
} from 'react-native';
import { useTheme } from '@/shared/contexts/ThemeContext';

interface AuthCardProps {
  children:   React.ReactNode;
  scrollable?: boolean;
  style?:     ViewStyle;
  maxWidth?:  number;
}

export default function AuthCard({
  children,
  scrollable = true,
  style,
  maxWidth = 500,
}: AuthCardProps) {
  const { theme } = useTheme();

  const card = (
    <View style={[
      s.card,
      {
        backgroundColor: theme.card,
        borderColor:     theme.border,
        maxWidth,
      },
      style,
    ]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={s.kav}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {scrollable ? (
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {card}
        </ScrollView>
      ) : (
        <View style={s.scroll}>{card}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  kav:    { flex: 1 },
  scroll: {
    flexGrow:          1,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   40,
  },
  card: {
    width:             '100%',
    borderRadius:      26,
    borderWidth:       1,
    paddingHorizontal: 24,
    paddingVertical:   30,
    shadowOffset:      { width: 0, height: 8 },
    shadowOpacity:     0.15,
    shadowRadius:      16,
    elevation:         8,
  },
});