// ─────────────────────────────────────────────
//  app/instructor/_layout.tsx
//  Layout instructor con sidebar
// ─────────────────────────────────────────────
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import Sidebar from '@/shared/components/layout/Sidebar';
import { LanguageSelector, ThemeToggle } from '@/shared/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InstructorLayout() {
  const { isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!isAuthenticated) { router.replace('/auth/login' as any); return null; }

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const headerBg = isDark ? Colors.dark.surface : Colors.light.surface;
  const border = isDark ? Colors.dark.border : Colors.light.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <SafeAreaView style={[il.safe, { backgroundColor: bg }]} edges={['top']}>
      <View style={[il.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
        <View style={il.headerLeft}>
          <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)} style={il.menuBtn}>
            <Ionicons name={sidebarOpen ? 'close' : 'menu'} size={22} color={text} />
          </TouchableOpacity>
          <Text style={[il.headerTitle, { color: theme.primary }]}>FaceLit</Text>
        </View>
        <View style={il.headerRight}>
          <LanguageSelector />
          <ThemeToggle />
          <TouchableOpacity onPress={() => router.push('/notifications' as any)} style={il.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={text} />
          </TouchableOpacity>
        </View>
      </View>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="index" />
      </Stack>
    </SafeAreaView>
  );
}

const il = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
});
