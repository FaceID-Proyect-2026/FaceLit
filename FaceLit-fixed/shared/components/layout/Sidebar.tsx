// ─────────────────────────────────────────────
//  shared/components/layout/Sidebar.tsx
//  Sidebar de navegación para admin/instructor
// ─────────────────────────────────────────────
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Routes } from '@/shared/constants/routes';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  module: string;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();

  if (!isOpen) return null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const activeBg = isDark ? 'rgba(101,179,97,0.15)' : 'rgba(101,179,97,0.10)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const bg = isDark ? Colors.dark.surface : Colors.light.surface;
  const border = isDark ? Colors.dark.border : Colors.light.border;

  const adminMenu: MenuItem[] = [
    { icon: 'grid-outline', label: t('sidebar.dashboard'), route: Routes.ADMIN.DASHBOARD, module: 'dashboard' },
    { icon: 'business-outline', label: t('sidebar.environments'), route: Routes.ENVIRONMENTS.LIST, module: 'environments' },
    { icon: 'school-outline', label: t('sidebar.academic'), route: Routes.ACADEMIC.PROGRAMS, module: 'academic' },
    { icon: 'time-outline', label: t('sidebar.schedules'), route: Routes.SCHEDULES.LIST, module: 'schedules' },
    { icon: 'scan-outline', label: t('sidebar.facial'), route: Routes.FACIAL.MANAGEMENT, module: 'facial' },
    { icon: 'checkmark-circle-outline', label: t('sidebar.attendance'), route: Routes.ATTENDANCE.LIST, module: 'attendance' },
    { icon: 'bar-chart-outline', label: t('sidebar.reports'), route: Routes.REPORTS.DASHBOARD, module: 'reports' },
    { icon: 'notifications-outline', label: t('sidebar.notifications'), route: Routes.NOTIFICATIONS.CENTER, module: 'notifications' },
    { icon: 'person-outline', label: t('sidebar.profile'), route: Routes.PROFILE.VIEW, module: 'profile' },
  ];

  const instructorMenu: MenuItem[] = [
    { icon: 'grid-outline', label: t('sidebar.dashboard'), route: '/instructor', module: 'dashboard' },
    { icon: 'time-outline', label: t('sidebar.mySchedules'), route: Routes.SCHEDULES.INSTRUCTOR, module: 'schedules' },
    { icon: 'checkmark-circle-outline', label: t('sidebar.attendance'), route: Routes.ATTENDANCE.INSTRUCTOR, module: 'attendance' },
    { icon: 'bar-chart-outline', label: t('sidebar.reports'), route: Routes.REPORTS.INSTRUCTOR, module: 'reports' },
    { icon: 'notifications-outline', label: t('sidebar.notifications'), route: Routes.NOTIFICATIONS.CENTER, module: 'notifications' },
    { icon: 'person-outline', label: t('sidebar.profile'), route: Routes.PROFILE.VIEW, module: 'profile' },
  ];

  const apprenticeMenu: MenuItem[] = [
    { icon: 'grid-outline', label: t('sidebar.dashboard'), route: '/apprentice', module: 'dashboard' },
    { icon: 'school-outline', label: t('sidebar.joinFicha'), route: Routes.ACADEMIC.JOIN_FICHA, module: 'academic' },
    { icon: 'time-outline', label: t('sidebar.mySchedule'), route: Routes.SCHEDULES.APPRENTICE, module: 'schedules' },
    { icon: 'checkmark-circle-outline', label: t('sidebar.myAttendance'), route: Routes.ATTENDANCE.APPRENTICE, module: 'attendance' },
    { icon: 'bar-chart-outline', label: t('sidebar.myReports'), route: Routes.REPORTS.APPRENTICE, module: 'reports' },
    { icon: 'notifications-outline', label: t('sidebar.notifications'), route: Routes.NOTIFICATIONS.CENTER, module: 'notifications' },
    { icon: 'person-outline', label: t('sidebar.profile'), route: Routes.PROFILE.VIEW, module: 'profile' },
  ];

  const menu = user?.role === 'administrador' ? adminMenu
    : user?.role === 'instructor' ? instructorMenu
    : apprenticeMenu;

  const isActive = (route: string) => {
    if (route === '/admin' || route === '/instructor' || route === '/apprentice') {
      return pathname === route;
    }
    return pathname.startsWith(route.split('[')[0]);
  };

  return (
    <View style={[ss.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      <View style={[ss.sidebar, { backgroundColor: bg, borderRightColor: border }]}>
        {/* Header */}
        <View style={[ss.header, { borderBottomColor: border }]}>
          <Text style={[ss.logo, { color: theme.primary }]}>FaceLit</Text>
          <TouchableOpacity onPress={onClose} style={ss.closeBtn}>
            <Ionicons name="close" size={22} color={muted} />
          </TouchableOpacity>
        </View>

        {/* User info */}
        {user && (
          <View style={[ss.userSection, { borderBottomColor: border }]}>
            <View style={[ss.avatar, { backgroundColor: theme.primary }]}>
              <Text style={ss.avatarText}>
                {user.name.charAt(0)}{user.lastname.charAt(0)}
              </Text>
            </View>
            <View style={ss.userInfo}>
              <Text style={[ss.userName, { color: text }]}>{user.name} {user.lastname}</Text>
              <Text style={[ss.userRole, { color: muted }]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
          </View>
        )}

        {/* Menu items */}
        <ScrollView style={ss.menuScroll} showsVerticalScrollIndicator={false}>
          {menu.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => {
                router.push(item.route as any);
                onClose();
              }}
              style={[
                ss.menuItem,
                { backgroundColor: isActive(item.route) ? activeBg : 'transparent' },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={isActive(item.route) ? theme.primary : muted}
              />
              <Text
                style={[
                  ss.menuLabel,
                  {
                    color: isActive(item.route) ? theme.primary : text,
                    fontWeight: isActive(item.route) ? FontWeight.bold : FontWeight.medium,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Logout */}
        <TouchableOpacity
          onPress={logout}
          style={[ss.logoutBtn, { borderTopColor: border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={[ss.logoutText, { color: Colors.error }]}>{t('sidebar.logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    height: '100%',
    borderRightWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  logo: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  closeBtn: { padding: 4 },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  userRole: { fontSize: FontSize.sm, marginTop: 2 },
  menuScroll: { flex: 1, paddingVertical: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  menuLabel: { fontSize: FontSize.base },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  logoutText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
