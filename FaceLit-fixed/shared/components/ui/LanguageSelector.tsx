// ─────────────────────────────────────────────
//  shared/components/ui/LanguageSelector.tsx
//  Selector de idioma — web DOM / móvil Modal
// ─────────────────────────────────────────────
import { useState } from 'react';
import {
  Modal, Platform, Pressable, StyleSheet,
  Text, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, Language, LANGUAGE_LABELS, LANGUAGE_NAMES } from '@/shared/contexts/I18nContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';

const LANGUAGES: Language[] = ['es', 'en', 'de', 'fr'];

interface LanguageSelectorProps { style?: ViewStyle; }

// ── Web ───────────────────────────────────────
function LanguageSelectorWeb({ style }: LanguageSelectorProps) {
  const { language, changeLanguage } = useLanguage();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const bg = isDark ? Colors.dark.card : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.4)' : '#DDDDDD';
  const textCol = isDark ? Colors.dark.text : Colors.light.text;
  const activeBg = isDark
    ? 'rgba(101,179,97,0.22)'
    : 'rgba(101,179,97,0.13)';
  const hoverBg = Colors.primaryFaint;

  return (
    // @ts-ignore
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        zIndex: 999999,
      }}
    >
      {/* @ts-ignore */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: isDark ? 'rgba(255,255,255,0.05)' : '#F6F6F6',
          border: `1.5px solid ${Colors.primary}`,
          borderRadius: 20,
          height: 40,
          padding: '0 14px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 13,
          color: Colors.primary,
          outline: 'none',
          position: 'relative',
          zIndex: 999999,
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={Colors.primary}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>

        <span>{LANGUAGE_LABELS[language]}</span>
        <span style={{ fontSize: 9 }}>▾</span>
      </button>

      {open && (
        // @ts-ignore
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 12,
            minWidth: 170,
            zIndex: 999999,
            pointerEvents: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          }}
        >
          {LANGUAGES.map((lang) => {
            const isActive = language === lang;

            return (
              // @ts-ignore
              <div
                key={lang}
                onClick={() => {
                  changeLanguage(lang);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  cursor: 'pointer',
                  background: isActive ? activeBg : 'transparent',
                  userSelect: 'none',
                }}
                onMouseEnter={(e: any) => {
                  e.currentTarget.style.background = hoverBg;
                }}
                onMouseLeave={(e: any) => {
                  e.currentTarget.style.background = isActive
                    ? activeBg
                    : 'transparent';
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive
                      ? Colors.primary
                      : isDark
                      ? 'rgba(101,179,97,0.18)'
                      : 'rgba(101,179,97,0.14)',
                    fontSize: 10,
                    fontWeight: 800,
                    color: isActive ? Colors.white : Colors.primary,
                  }}
                >
                  {lang.toUpperCase()}
                </span>

                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? Colors.primary : textCol,
                  }}
                >
                  {LANGUAGE_NAMES[lang]}
                </span>

                {isActive && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      color: Colors.primary,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Móvil ─────────────────────────────────────
function LanguageSelectorMobile({ style }: LanguageSelectorProps) {
  const { language, changeLanguage } = useLanguage();
  const { theme, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[{ zIndex: 9999 }, style]}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.75}
        style={[s.trigger, {
          backgroundColor: theme.inputBg,
          borderColor:     theme.primary,
        }]}
      >
        <Ionicons name="globe-outline" size={15} color={theme.primary} />
        <Text style={[s.triggerText, { color: theme.primary }]}>
          {LANGUAGE_LABELS[language]}
        </Text>
        <Ionicons name="chevron-down" size={12} color={theme.primary} />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={[s.modal, {
            backgroundColor: isDark ? Colors.dark.card : Colors.white,
            borderColor:     isDark ? 'rgba(101,179,97,0.4)' : '#DDDDDD',
          }]}>
            {LANGUAGES.map((lang) => {
              const isActive = language === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => { changeLanguage(lang); setOpen(false); }}
                  style={[s.option, isActive && { backgroundColor: theme.primaryFaint }]}
                >
                  <View style={[s.circle, {
                    backgroundColor: isActive ? theme.primary : theme.primaryFaint,
                  }]}>
                    <Text style={[s.circleText, {
                      color: isActive ? Colors.white : theme.primary,
                    }]}>
                      {lang.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[s.optionText, {
                    color:      isActive ? theme.primary : theme.text,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.medium,
                  }]}>
                    {LANGUAGE_NAMES[lang]}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={theme.primary}
                      style={{ marginLeft: 'auto' as any }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Export ────────────────────────────────────
export default function LanguageSelector(props: LanguageSelectorProps) {
  if (Platform.OS === 'web') return <LanguageSelectorWeb {...props} />;
  return <LanguageSelectorMobile {...props} />;
}

const s = StyleSheet.create({
  trigger: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    height:            40,
    borderRadius:      20,
    borderWidth:       1.5,
    paddingHorizontal: 14,
  },
  triggerText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  modal:       { borderRadius: 14, borderWidth: 1, overflow: 'hidden', minWidth: 200 },
  option:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  optionText:  { fontSize: FontSize.lg },
  circle:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  circleText:  { fontSize: FontSize.xs, fontWeight: FontWeight.black },
});