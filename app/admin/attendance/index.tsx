// ─────────────────────────────────────────────
//  app/admin/attendance/index.tsx
//  RF-6 V4 — Módulo de Asistencias (Coordinador)
//
//  Tres pestañas:
//    RF-6.1  Por ficha  — tarjetas + tabla coloreada
//    RF-6.2  Por usuario — búsqueda individual
//    RF-6.3  Historial   — bandeja agrupada por ficha
//
//  El tab activo se pasa como prop a cada sub-pantalla
//  para que se renderice dentro del mismo scroll raíz.
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AttendanceByFichaScreen from './by-ficha';
import AttendanceByUserScreen from './by-user';
import AttendanceHistoryScreen from './history';

type Tab = 'byFicha' | 'byUser' | 'history';

export default function AttendanceIndexScreen() {
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('byFicha');

  const text    = isDark ? Colors.dark.text    : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'           : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg      = isDark ? Colors.dark.background : Colors.light.background;

  const tabs: { key: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { key: 'byFicha', label: t('attendance.rf6.tabByFicha'), icon: 'people-outline' },
    { key: 'byUser',  label: t('attendance.rf6.tabByUser'),  icon: 'person-outline' },
    { key: 'history', label: t('attendance.rf6.tabHistory'), icon: 'time-outline'   },
  ];

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {/* Encabezado */}
      <View style={s.header}>
        <Text style={[s.title, { color: text }]}>{t('attendance.title')}</Text>
        <Text style={[s.subtitle, { color: muted }]}>{t('attendance.rf6.subtitle')}</Text>
      </View>

      {/* Tab bar */}
      <View style={[s.tabBar, { backgroundColor: cardBg, borderColor: border }]}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                s.tabBtn,
                active && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={tab.icon}
                size={17}
                color={active ? theme.primary : muted}
              />
              <Text style={[s.tabLabel, { color: active ? theme.primary : muted, fontWeight: active ? FontWeight.black : FontWeight.regular }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenido del tab activo */}
      <View style={s.tabContent}>
        {activeTab === 'byFicha' && <AttendanceByFichaScreen />}
        {activeTab === 'byUser'  && <AttendanceByUserScreen  />}
        {activeTab === 'history' && <AttendanceHistoryScreen />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title:      { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 4 },
  subtitle:   { fontSize: FontSize.sm, lineHeight: 19 },

  tabBar:     { flexDirection: 'row', borderBottomWidth: 1, borderTopWidth: 1 },
  tabBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel:   { fontSize: FontSize.sm },

  tabContent: { flex: 1 },
});
