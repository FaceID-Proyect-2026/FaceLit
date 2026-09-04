import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import Sidebar from '@/shared/components/layout/Sidebar';
import { LanguageSelector, ThemeToggle } from '@/shared/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CoordinatorLayout() {
  const { isAuthenticated } = useAuth(); const { theme, isDark } = useTheme(); const [sidebarOpen, setSidebarOpen] = useState(false);
  if (!isAuthenticated) { router.replace('/auth/login' as any); return null; }
  const text = isDark ? Colors.dark.text : Colors.light.text; const bg = isDark ? Colors.dark.background : Colors.light.background; const surface = isDark ? Colors.dark.surface : Colors.light.surface; const border = isDark ? Colors.dark.border : Colors.light.border;
  return <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}><View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}><TouchableOpacity onPress={() => setSidebarOpen(value => !value)}><Ionicons name={sidebarOpen ? 'close' : 'menu'} size={22} color={text} /></TouchableOpacity><Text style={[styles.logo, { color: theme.primary }]}>FaceLit</Text><View style={styles.actions}><LanguageSelector /><ThemeToggle /></View></View><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><Stack screenOptions={{ headerShown: false }}><Stack.Screen name="index" /><Stack.Screen name="institutional-import" /><Stack.Screen name="transfer-requests/index" /></Stack></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderBottomWidth: 1 }, logo: { fontSize: 20, fontWeight: '900', flex: 1 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 8 } });
