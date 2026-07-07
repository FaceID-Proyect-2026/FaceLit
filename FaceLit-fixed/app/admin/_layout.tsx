// ─────────────────────────────────────────────
//  app/admin/_layout.tsx
//  Layout principal admin con sidebar y header
// ─────────────────────────────────────────────
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import Sidebar from '@/shared/components/layout/Sidebar';
import { LanguageSelector } from '@/shared/components/ui';
import { ThemeToggle } from '@/shared/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Protección: si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    router.replace('/auth/login' as any);
    return null;
  }

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const headerBg = isDark ? Colors.dark.surface : Colors.light.surface;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  return (
    <SafeAreaView style={[sal.safe, { backgroundColor: bg }]} edges={['top']}>
      {/* Header */}
      <View style={[sal.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
        <View style={sal.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)} style={sal.menuBtn}>
            <Ionicons name={sidebarOpen ? 'close' : 'menu'} size={22} color={text} />
          </TouchableOpacity>
          <Text style={[sal.headerTitle, { color: theme.primary }]}>FaceLit</Text>
        </View>
        <View style={sal.headerRight}>
          <LanguageSelector />
          <ThemeToggle />
          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={sal.iconBtn}
          >
            <Ionicons name="notifications-outline" size={20} color={text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sidebar overlay */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="environments/index" />
        <Stack.Screen name="environments/register" />
        <Stack.Screen name="environments/[id]" />
        <Stack.Screen name="environments/assign" />
        <Stack.Screen name="academic/index" />
        <Stack.Screen name="academic/programs/register" />
        <Stack.Screen name="academic/programs/[id]" />
        <Stack.Screen name="academic/fichas/register" />
        <Stack.Screen name="academic/fichas/[id]" />
        <Stack.Screen name="academic/fichas/[id]/learners" />
        <Stack.Screen name="schedules/index" />
        <Stack.Screen name="schedules/register" />
        <Stack.Screen name="schedules/[id]" />
        <Stack.Screen name="schedules/exceptions" />
        <Stack.Screen name="facial/index" />
        <Stack.Screen name="attendance/index" />
        <Stack.Screen name="attendance/[id]" />
        <Stack.Screen name="reports/index" />
        <Stack.Screen name="reports/by-user" />
        <Stack.Screen name="reports/by-ficha" />
        <Stack.Screen name="reports/calendar" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="profile/settings" />
      </Stack>
    </SafeAreaView>
  );
}

const sal = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
});
