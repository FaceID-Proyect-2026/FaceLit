// ─────────────────────────────────────────────
//  shared/components/ui/LanguageSelector.tsx
//  Selector de idioma — web DOM / móvil Modal
//
//  Web: el dropdown se renderiza mediante un portal
//  en document.body para evitar que quede tapado
//  por elementos con z-index más alto del header.
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Language, LANGUAGE_LABELS, LANGUAGE_NAMES, useLanguage } from '@/shared/contexts/I18nContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import {
    Modal, Platform, Pressable, StyleSheet,
    Text, TouchableOpacity, View, ViewStyle,
} from 'react-native';

const LANGUAGES: Language[] = ['es', 'en', 'de', 'fr'];

// Componentes SVG de banderas
const FlagES = () => (
  <svg width="20" height="14" viewBox="0 0 24 16">
    <rect width="24" height="16" fill="#C60B1E"/>
    <rect y="4" width="24" height="2" fill="#FFC400"/>
    <rect y="10" width="24" height="2" fill="#FFC400"/>
  </svg>
);

const FlagEN = () => (
  <svg width="20" height="14" viewBox="0 0 24 16">
    <rect width="24" height="16" fill="#012169"/>
    <rect y="3" width="24" height="1" fill="white"/>
    <rect y="6" width="24" height="1" fill="white"/>
    <rect y="9" width="24" height="1" fill="white"/>
    <rect y="12" width="24" height="1" fill="white"/>
    <rect x="0" y="0" width="10" height="8" fill="white"/>
    <rect x="0" y="0" width="10" height="8" fill="#C8102E" clipPath="url(#clipEN)"/>
    <defs>
      <clipPath id="clipEN">
        <polygon points="0,0 10,0 0,8"/>
      </clipPath>
    </defs>
  </svg>
);

const FlagDE = () => (
  <svg width="20" height="14" viewBox="0 0 24 16">
    <rect width="24" height="5.33" fill="#000000"/>
    <rect y="5.33" width="24" height="5.33" fill="#DD0000"/>
    <rect y="10.66" width="24" height="5.33" fill="#FFCE00"/>
  </svg>
);

const FlagFR = () => (
  <svg width="20" height="14" viewBox="0 0 24 16">
    <rect width="8" height="16" fill="#002395"/>
    <rect x="8" width="8" height="16" fill="white"/>
    <rect x="16" width="8" height="16" fill="#ED2939"/>
  </svg>
);

const LANGUAGE_FLAGS: Record<Language, () => ReactElement> = {
  es: FlagES,
  en: FlagEN,
  de: FlagDE,
  fr: FlagFR,
};

interface LanguageSelectorProps { style?: ViewStyle; }

// ── Web ───────────────────────────────────────
function LanguageSelectorWeb({ style }: LanguageSelectorProps) {
  const { language, changeLanguage } = useLanguage();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [btnRect, setBtnRect] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const bg      = isDark ? '#262626' : '#FFFFFF';
  const border  = isDark ? '#404040' : '#E2E8F0';
  const textCol = isDark ? '#FFFFFF' : '#0F172A';
  const activeBg = isDark ? '#404040' : '#E5E7EB';
  const hoverBg  = isDark ? '#333333' : '#F1F5F9';

  // Al abrir, calcular posición absoluta del botón en la ventana
  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setBtnRect({
        top:   rect.bottom + window.scrollY + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(v => !v);
  }

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    // @ts-ignore
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* @ts-ignore */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'transparent',
          border: `1.5px solid ${Colors.secondary}`,
          borderRadius: 20, height: 40, padding: '0 16px',
          cursor: 'pointer', fontWeight: 600, fontSize: 13,
          color: Colors.secondary, outline: 'none',
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700 }}>{LANGUAGE_LABELS[language]}</span>
        <span style={{ fontSize: 9 }}>▾</span>
      </button>

      {/* Portal al body — evita quedar tapado por cualquier elemento del layout */}
      {open && btnRect && typeof document !== 'undefined' && (() => {
        const ReactDOM = require('react-dom');
        return ReactDOM.createPortal(
          // @ts-ignore
          <div
            style={{
              position: 'fixed',
              top:   btnRect.top,
              right: btnRect.right,
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 12,
              minWidth: 220,
              zIndex: 2147483647, // máximo posible
              pointerEvents: 'auto',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
            onMouseDown={(e: any) => e.stopPropagation()}
          >
            {LANGUAGES.map((lang) => {
              const isActive = language === lang;
              const FlagComponent = LANGUAGE_FLAGS[lang];
              return (
                // @ts-ignore
                <div
                  key={lang}
                  onClick={() => { changeLanguage(lang); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', cursor: 'pointer',
                    background: isActive ? activeBg : 'transparent',
                    userSelect: 'none',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                  onMouseEnter={(e: any) => { e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.background = isActive ? activeBg : 'transparent'; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {/* @ts-ignore */}
                    <FlagComponent />
                  </span>
                  <span style={{
                    fontSize: 14, fontWeight: isActive ? 700 : 500,
                    color: isDark ? '#FFFFFF' : '#0F172A',
                  }}>
                    {LANGUAGE_NAMES[lang]}
                  </span>
                  {isActive && (
                    <span style={{ marginLeft: 'auto', color: Colors.secondary }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        );
      })()}
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
          backgroundColor: 'transparent',
          borderColor:     Colors.secondary,
        }]}
      >
        <Text style={[s.triggerText, { color: Colors.secondary }]}>
          {LANGUAGE_LABELS[language]}
        </Text>
        <Ionicons name="chevron-down" size={12} color={Colors.secondary} />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={[s.modal, {
            backgroundColor: isDark ? '#262626' : '#FFFFFF',
            borderColor:     isDark ? '#404040' : '#E2E8F0',
          }]}>
            {LANGUAGES.map((lang) => {
              const isActive = language === lang;
              const FlagComponent = LANGUAGE_FLAGS[lang];
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => { changeLanguage(lang); setOpen(false); }}
                  style={[s.option, isActive && { backgroundColor: isDark ? '#404040' : '#E5E7EB' }]}
                >
                  <View style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
                    {/* @ts-ignore */}
                    <FlagComponent />
                  </View>
                  <Text style={[s.optionText, {
                    color:      isActive ? (isDark ? '#FFFFFF' : '#0F172A') : theme.text,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.medium,
                  }]}>
                    {LANGUAGE_NAMES[lang]}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={Colors.secondary}
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