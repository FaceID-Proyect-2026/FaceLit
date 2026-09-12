// ─────────────────────────────────────────────
//  app/admin/users/index.tsx
//  RF-10 — Panel de usuarios (datos quemados)
// ─────────────────────────────────────────────
import { MOCK_USERS, MockUser } from '@/features/users/mocks';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type RoleFilter   = 'ALL' | 'INSTRUCTOR' | 'APPRENTICE';
type StatusFilter = 'ALL' | 'active' | 'inactive';

export default function UsersPanel() {
  const { user }            = useAuth();
  const { theme, isDark }   = useTheme();
  const { t }               = useTranslation();
  const { alert, DialogUI } = useAppDialog();

  const [users, setUsers]         = useState<MockUser[]>(MOCK_USERS);
  const [query, setQuery]         = useState('');
  const [roleFilter, setRoleFilter]     = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // ── Colores ────────────────────────────────
  const text      = isDark ? Colors.dark.text       : Colors.light.text;
  const muted     = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const bg        = isDark ? Colors.dark.background : Colors.light.background;
  const card      = isDark ? '#0D1F14'              : Colors.white;
  const border    = isDark ? 'rgba(101,179,97,0.18)': 'rgba(101,179,97,0.20)';
  const softGreen = isDark ? 'rgba(101,179,97,0.14)': '#EAF7E8';
  const softBlue  = isDark ? 'rgba(74,144,217,0.16)': '#EAF3FC';
  const softAmber = isDark ? 'rgba(232,155,44,0.16)': '#FFF5DF';
  const softRed   = isDark ? 'rgba(217,32,39,0.14)' : '#FDECEA';

  // Guard de rol
  if (user?.role !== 'COORDINATOR' && user?.role !== 'ADMINISTRATOR') {
    router.replace('/admin' as any);
    return null;
  }

  // ── Filtrado en memoria ────────────────────
  const q = query.trim().toLowerCase();
  const filtered = users.filter(u => {
    const matchQuery =
      !q ||
      u.name.toLowerCase().includes(q)     ||
      u.lastname.toLowerCase().includes(q) ||
      u.document.includes(q)               ||
      u.email.toLowerCase().includes(q);
    const matchRole   = roleFilter   === 'ALL' || u.role   === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchQuery && matchRole && matchStatus;
  });

  // ── Acciones locales ───────────────────────
  const toggleStatus = (id: string) =>
    setUsers(prev =>
      prev.map(u =>
        u.id === id
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
          : u,
      ),
    );

  const removeUser = (id: string) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    alert(
      t('users.panel.deleteTitle'),
      t('users.panel.deleteConfirm', { name: `${target.name} ${target.lastname}` }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('users.delete'),
          style: 'destructive',
          onPress: () => setUsers(prev => prev.filter(u => u.id !== id)),
        },
      ],
    );
  };

  // ── Helpers de presentación ────────────────
  const roleColor = (role: string) => (role === 'INSTRUCTOR' ? '#4A90D9' : theme.primary);
  const roleBg    = (role: string) => (role === 'INSTRUCTOR' ? softBlue  : softGreen);
  const roleLabel = (role: string) =>
    role === 'INSTRUCTOR' ? t('users.create.roleInstructor') : t('users.create.roleApprentice');

  // ── Render fila ───────────────────────────
  const renderItem = ({ item }: { item: MockUser }) => {
    const isActive    = item.status === 'active';
    const statusColor = isActive ? Colors.success : muted;
    const statusBg    = isActive ? softGreen : (isDark ? 'rgba(255,255,255,0.06)' : '#F2F2F2');
    const displayName = `${item.name} ${item.lastname}`;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: card, borderColor: border }]}
        activeOpacity={0.82}
        onPress={() => router.push({ pathname: '/admin/users/[id]', params: { id: item.id } } as any)}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: roleColor(item.role) }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>

        {/* Cuerpo */}
        <View style={styles.cardBody}>
          <View style={styles.nameLine}>
            <Text style={[styles.userName, { color: text }]} numberOfLines={1}>
              {displayName}
            </Text>
            {/* estado */}
            <View style={[styles.pill, { backgroundColor: statusBg }]}>
              <View style={[styles.dot, { backgroundColor: statusColor }]} />
              <Text style={[styles.pillText, { color: statusColor }]}>
                {isActive ? t('users.statuses.ACTIVE') : t('users.statuses.INACTIVE')}
              </Text>
            </View>
          </View>

          <Text style={[styles.meta, { color: muted }]} numberOfLines={1}>{item.email}</Text>

          <View style={styles.bottomLine}>
            {/* rol */}
            <View style={[styles.pill, { backgroundColor: roleBg(item.role) }]}>
              <Text style={[styles.pillText, { color: roleColor(item.role) }]}>
                {roleLabel(item.role)}
              </Text>
            </View>
            <Text style={[styles.doc, { color: muted }]}>{item.document}</Text>
          </View>

          {/* tipo instructor */}
          {item.role === 'INSTRUCTOR' && item.instructorType && (
            <Text style={[styles.subMeta, { color: muted }]}>
              {item.instructorType === 'especifico'
                ? `${t('users.create.instructorTypeSpecific')}${item.programCode ? ` · ${item.programCode}` : ''}`
                : t('users.create.instructorTypeTransversal')}
            </Text>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={e => { e.stopPropagation?.(); toggleStatus(item.id); }}
            style={[
              styles.iconBtn,
              { backgroundColor: isActive ? softAmber : softGreen },
            ]}
            accessibilityLabel={isActive ? t('users.panel.deactivate') : t('users.panel.activate')}
          >
            <Ionicons
              name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
              size={18}
              color={isActive ? Colors.warning : Colors.success}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={e => { e.stopPropagation?.(); removeUser(item.id); }}
            style={[styles.iconBtn, { backgroundColor: softRed }]}
            accessibilityLabel={t('users.delete')}
          >
            <Ionicons name="trash-outline" size={17} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <FlatList
        data={filtered}
        keyExtractor={u => u.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* ── Cabecera ── */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={[styles.eyebrow, { backgroundColor: softBlue }]}>
                  <Ionicons name="people-circle-outline" size={14} color="#4A90D9" />
                  <Text style={[styles.eyebrowText, { color: '#4A90D9' }]}>
                    {t('sidebar.userManagement')}
                  </Text>
                </View>
                <Text style={[styles.title, { color: text }]}>{t('users.panel.title')}</Text>
                <Text style={[styles.subtitle, { color: muted }]}>
                  {filtered.length} {t('users.results')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backBtn, { backgroundColor: card, borderColor: border }]}
              >
                <Ionicons name="arrow-back" size={20} color={text} />
              </TouchableOpacity>
            </View>

            {/* ── Stats ── */}
            <View style={styles.statsRow}>
              {[
                { label: t('users.total'),    value: users.length,                                  bg: softGreen, icon: 'people-outline',              color: theme.primary },
                { label: t('users.active'),   value: users.filter(u => u.status === 'active').length,   bg: softBlue,  icon: 'checkmark-circle-outline', color: '#4A90D9'     },
                { label: t('users.statuses.INACTIVE'), value: users.filter(u => u.status === 'inactive').length, bg: softAmber, icon: 'pause-circle-outline', color: Colors.warning },
              ].map(s => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                    <Ionicons name={s.icon as any} size={17} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: text }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* ── Toolbar ── */}
            <View style={[styles.toolbar, { backgroundColor: card, borderColor: border }]}>
              {/* Buscador */}
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={19} color={theme.primary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('users.panel.searchPlaceholder')}
                  placeholderTextColor={muted}
                  style={[styles.searchInput, { color: text }]}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={18} color={muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filtros */}
              <View style={[styles.divider, { backgroundColor: border }]} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {/* Rol */}
                {(['ALL', 'INSTRUCTOR', 'APPRENTICE'] as RoleFilter[]).map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setRoleFilter(f)}
                    style={[
                      styles.chip,
                      {
                        borderColor:     roleFilter === f ? theme.primary : border,
                        backgroundColor: roleFilter === f ? theme.primary + '18' : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: roleFilter === f ? theme.primary : muted }]}>
                      {f === 'ALL'
                        ? t('users.all')
                        : f === 'INSTRUCTOR'
                          ? t('users.create.roleInstructor')
                          : t('users.create.roleApprentice')}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={[styles.chipSep, { backgroundColor: border }]} />

                {/* Estado */}
                {(['ALL', 'active', 'inactive'] as StatusFilter[]).map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setStatusFilter(f)}
                    style={[
                      styles.chip,
                      {
                        borderColor:     statusFilter === f ? theme.primary : border,
                        backgroundColor: statusFilter === f ? theme.primary + '18' : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: statusFilter === f ? theme.primary : muted }]}>
                      {f === 'ALL'
                        ? t('users.all')
                        : f === 'active'
                          ? t('users.statuses.ACTIVE')
                          : t('users.statuses.INACTIVE')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ── Cabecera lista + botón crear ── */}
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: text }]}>{t('users.registered')}</Text>
              <TouchableOpacity
                onPress={() => router.push('/admin/users/create' as any)}
                style={[styles.createBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="person-add-outline" size={15} color={Colors.white} />
                <Text style={styles.createBtnText}>{t('users.panel.createButton')}</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={muted} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: muted }]}>{t('users.empty')}</Text>
          </View>
        }
      />
      {DialogUI}
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, paddingHorizontal: 18 },
  listContent: { gap: 10, paddingBottom: 36 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 22, paddingBottom: 18 },
  eyebrow:     { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8 },
  eyebrowText: { fontSize: FontSize.xs, fontWeight: '800', textTransform: 'uppercase' },
  title:       { fontSize: FontSize['3xl'], fontWeight: FontWeight.black },
  subtitle:    { marginTop: 4, fontSize: FontSize.sm },
  backBtn:     { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:  { flex: 1, borderRadius: 16, padding: 12, justifyContent: 'space-between', minHeight: 96 },
  statIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: FontSize.xs, fontWeight: '600' },

  toolbar:   { borderRadius: 16, borderWidth: 1, padding: 10, marginBottom: 18 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 15 },
  divider:   { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  chips:     { gap: 7, paddingHorizontal: 2 },
  chip:      { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  chipText:  { fontSize: FontSize.xs, fontWeight: '700' },
  chipSep:   { width: StyleSheet.hairlineWidth, marginHorizontal: 2 },

  listHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  listTitle:     { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  createBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 9 },
  createBtnText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.sm },

  card:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 13 },
  avatar:   { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: '900', fontSize: 18 },
  cardBody: { flex: 1, marginLeft: 12, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  userName: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  meta:     { fontSize: FontSize.sm, marginTop: 3 },
  subMeta:  { fontSize: FontSize.xs, marginTop: 2 },
  bottomLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  doc:      { fontSize: FontSize.xs },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3 },
  dot:      { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 9, fontWeight: '800' },

  actions: { alignItems: 'center', gap: 7, marginLeft: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  empty:     { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.md, textAlign: 'center' },
});
