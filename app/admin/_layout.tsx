// ─────────────────────────────────────────────
//  app/admin/_layout.tsx
//  Layout principal admin con sidebar y header
// ─────────────────────────────────────────────
import Sidebar from '@/shared/components/layout/Sidebar';
import { LanguageSelector, ThemeToggle } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const { isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { canRenderContent } = useAuthGuard(isAuthenticated);

  if (!canRenderContent) {
    return (
      <SafeAreaView style={[sal.safe, { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }]}>
        <View style={sal.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
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
        <Stack.Screen
          name="environments/register"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="environments/[id]" />
        <Stack.Screen name="environments/assign" />
        <Stack.Screen name="academic/index" />
        <Stack.Screen
          name="academic/programs/register"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="academic/programs/[id]" />
        <Stack.Screen
          name="academic/fichas/register"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
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
        <Stack.Screen name="reports/my-performance" />
        <Stack.Screen name="reports/excuses-review" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="profile/settings" />
      </Stack>
    </SafeAreaView>
  );
}

const sal = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    position: 'relative',
    zIndex: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
});
