import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { deleteManagedUser, getManagedUser, getManagedUsers, updateManagedUser } from '@/shared/services/userManagementService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_CONSENT' | 'BLOCKED';
type UserRole = 'APPRENTICE' | 'INSTRUCTOR' | 'ADMINISTRATOR' | 'COORDINATOR';
interface ManagedUser {
  userId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  role?: string;
  accountStatus?: AccountStatus;
  documentNumber?: string;
  documentType?: string;
  birthDate?: string;
  registrationDate?: string;
  chipName?: string;
  chipCode?: string;
  programName?: string;
  hasSession?: boolean;
}

const statusValues: AccountStatus[] = ['ACTIVE', 'INACTIVE', 'PENDING_CONSENT', 'BLOCKED'];
const roleValues: UserRole[] = ['APPRENTICE', 'INSTRUCTOR', 'ADMINISTRATOR', 'COORDINATOR'];

function getApiErrorMessage(error: any, fallback: string) {
  const data = error.response?.data;
  if (data?.message) return data.message;
  if (data && typeof data === 'object') {
    const messages = Object.values(data).filter(value => typeof value === 'string');
    if (messages.length) return messages.join('\n');
  }
  return fallback;
}

export default function UserManagementScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [draft, setDraft] = useState({ firstName: '', lastName: '', accountStatus: 'ACTIVE' as AccountStatus, role: 'APPRENTICE' as UserRole });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'ALL'>('ALL');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const softGreen = isDark ? 'rgba(101,179,97,0.14)' : '#EAF7E8';
  const softBlue = isDark ? 'rgba(74,144,217,0.16)' : '#EAF3FC';
  const softAmber = isDark ? 'rgba(232,155,44,0.16)' : '#FFF5DF';
  const filteredUsers = users.filter(item => {
    const status = item.accountStatus ?? 'ACTIVE';
    return (statusFilter === 'ALL' || status === statusFilter) && (roleFilter === 'ALL' || item.role === roleFilter);
  });
  const statusLabel = (status: AccountStatus) => t(`users.statuses.${status}`);
  const roleLabel = (role?: string) => role ? t(`users.roles.${role}`, { defaultValue: role }) : '-';

  const loadUsers = async () => {
    setLoading(true);
    try {
      setUsers(await getManagedUsers(search));
    } catch (error: any) {
      setUsers([]);
      alert(t('common.error'), getApiErrorMessage(error, t('users.loadError')));
    } finally {
      setLoading(false);
    }
  };

  const canManageUsers = user?.role === 'ADMINISTRATOR' || user?.role === 'COORDINATOR';
  const canDeleteUsers = user?.role === 'ADMINISTRATOR';

  useEffect(() => { if (canManageUsers) loadUsers(); }, [canManageUsers]);

  if (!canManageUsers) {
    router.replace(Routes.ADMIN.DASHBOARD as any);
    return null;
  }

  const openDetails = async (item: ManagedUser) => {
    try {
      const details = await getManagedUser(item.userId);
      setSelected(details);
      setDraft({
        firstName: details.firstName ?? '',
        lastName: details.lastName ?? '',
        accountStatus: details.accountStatus ?? 'ACTIVE',
        role: details.role ?? 'APPRENTICE',
      });
    } catch (error: any) {
      alert(t('common.error'), getApiErrorMessage(error, t('users.loadError')));
    }
  };

  const saveUser = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateManagedUser(selected.userId, draft);
      setSelected(null);
      await loadUsers();
    } catch (error: any) {
      alert(t('common.error'), getApiErrorMessage(error, t('users.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const removeUser = (item: ManagedUser) => {
    alert(t('users.deleteTitle'), t('users.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('users.delete'), style: 'destructive', onPress: async () => {
        try { await deleteManagedUser(item.userId); await loadUsers(); }
        catch (error: any) { alert(t('common.error'), getApiErrorMessage(error, t('users.deleteError'))); }
      } },
    ]);
  };

  const renderUser = ({ item }: { item: ManagedUser }) => {
    const status = item.accountStatus ?? 'ACTIVE';
    const displayName = [item.firstName, item.lastName].filter(Boolean).join(' ') || item.email;
    const statusColor = status === 'ACTIVE' ? Colors.success : status === 'BLOCKED' ? Colors.error : Colors.warning;
    const statusBg = status === 'ACTIVE' ? softGreen : status === 'BLOCKED' ? Colors.error + '18' : softAmber;
    return (
      <TouchableOpacity onPress={() => openDetails(item)} style={[styles.userCard, { backgroundColor: card, borderColor: border }]} activeOpacity={0.82}>
        <View style={[styles.avatar, { backgroundColor: item.role === 'APPRENTICE' ? theme.primary : '#4A90D9' }]}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userBody}>
          <View style={styles.nameLine}>
            <Text style={[styles.userName, { color: text }]} numberOfLines={1}>{displayName}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}><View style={[styles.statusDot, { backgroundColor: statusColor }]} /><Text style={[styles.statusText, { color: statusColor }]}>{statusLabel(status)}</Text></View>
          </View>
          <Text style={[styles.email, { color: muted }]} numberOfLines={1}>{item.email}</Text>
          <View style={styles.detailLine}>
            <Text style={[styles.roleText, { color: theme.primary }]}>{roleLabel(item.role)}</Text>
            <Text style={[styles.meta, { color: muted }]}>{item.documentNumber ?? '-'}</Text>
          </View>
          {item.role === 'APPRENTICE' && <View style={styles.fichaLine}><Ionicons name="school-outline" size={13} color={muted} /><Text style={[styles.meta, { color: muted }]} numberOfLines={1}>{item.chipName ?? t('users.pendingFicha')}</Text></View>}
        </View>
        <View style={styles.actions}>
          <Ionicons name="chevron-forward" size={19} color={muted} />
          {canDeleteUsers && (
            <TouchableOpacity onPress={(event) => { event.stopPropagation(); removeUser(item); }} style={[styles.iconButton, { backgroundColor: Colors.error + '18' }]} accessibilityLabel={t('users.delete')}>
              <Ionicons name="trash-outline" size={17} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.safe, { backgroundColor: bg }]}> 
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.userId}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <View style={[styles.eyebrow, { backgroundColor: softGreen }]}><Ionicons name="shield-checkmark-outline" size={14} color={theme.primary} /><Text style={[styles.eyebrowText, { color: theme.primary }]}>{t('users.adminLabel')}</Text></View>
                <Text style={[styles.title, { color: text }]}>{t('users.title')}</Text>
                <Text style={[styles.subtitle, { color: muted }]}>{t('users.subtitle')}</Text>
              </View>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: card, borderColor: border }]}><Ionicons name="arrow-back" size={20} color={text} /></TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: softGreen }]}><View style={[styles.statIcon, { backgroundColor: theme.primary + '24' }]}><Ionicons name="people-outline" size={18} color={theme.primary} /></View><Text style={[styles.statValue, { color: text }]}>{users.length}</Text><Text style={[styles.statLabel, { color: muted }]}>{t('users.total')}</Text></View>
              <View style={[styles.statCard, { backgroundColor: softBlue }]}><View style={[styles.statIcon, { backgroundColor: '#4A90D9' + '24' }]}><Ionicons name="checkmark-circle-outline" size={18} color="#4A90D9" /></View><Text style={[styles.statValue, { color: text }]}>{users.filter(item => item.accountStatus === 'ACTIVE').length}</Text><Text style={[styles.statLabel, { color: muted }]}>{t('users.active')}</Text></View>
              <View style={[styles.statCard, { backgroundColor: softAmber }]}><View style={[styles.statIcon, { backgroundColor: Colors.warning + '24' }]}><Ionicons name="school-outline" size={18} color={Colors.warning} /></View><Text style={[styles.statValue, { color: text }]}>{users.filter(item => item.role === 'APPRENTICE').length}</Text><Text style={[styles.statLabel, { color: muted }]}>{t('users.apprentices')}</Text></View>
            </View>
            <View style={[styles.toolbar, { backgroundColor: card, borderColor: border }]}>
              <View style={styles.search}>
                <Ionicons name="search-outline" size={19} color={theme.primary} />
                <TextInput value={search} onChangeText={setSearch} onSubmitEditing={loadUsers} placeholder={t('users.search')} placeholderTextColor={muted} style={[styles.searchInput, { color: text }]} returnKeyType="search" />
                {search.length > 0 && <TouchableOpacity onPress={() => { setSearch(''); loadUsers(); }}><Ionicons name="close-circle" size={18} color={muted} /></TouchableOpacity>}
              </View>
              <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                  {(['ALL', 'ACTIVE', 'INACTIVE', 'BLOCKED'] as const).map(filter => <TouchableOpacity key={filter} onPress={() => setStatusFilter(filter)} style={[styles.filterChip, { borderColor: statusFilter === filter ? theme.primary : border, backgroundColor: statusFilter === filter ? theme.primary + '18' : 'transparent' }]}><Text style={[styles.filterText, { color: statusFilter === filter ? theme.primary : muted }]}>{filter === 'ALL' ? t('users.all') : statusLabel(filter)}</Text></TouchableOpacity>)}
                </ScrollView>
              </View>
            </View>
            <View style={styles.resultsHeader}><Text style={[styles.resultsTitle, { color: text }]}>{t('users.registered')}</Text><Text style={[styles.resultsCount, { color: muted }]}>{filteredUsers.length} {t('users.results')}</Text></View>
          </>
        )}
        ListEmptyComponent={!loading ? <Text style={[styles.empty, { color: muted }]}>{t('users.empty')}</Text> : null}
      />
      {loading && <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />}
      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}><ScrollView contentContainerStyle={styles.modalScroll}><View style={[styles.modal, { backgroundColor: card }]}>
          <View style={styles.modalHeader}><View><Text style={[styles.modalTitle, { color: text }]}>{t('users.details')}</Text><Text style={[styles.modalSubtitle, { color: muted }]}>{roleLabel(selected?.role)}</Text></View><TouchableOpacity onPress={() => setSelected(null)}><Ionicons name="close" size={22} color={muted} /></TouchableOpacity></View>
          <View style={[styles.profileBanner, { backgroundColor: softGreen }]}><View style={[styles.modalAvatar, { backgroundColor: theme.primary }]}><Text style={styles.modalAvatarText}>{(selected?.firstName ?? '?').charAt(0).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={[styles.profileName, { color: text }]}>{selected?.firstName} {selected?.lastName}</Text><Text style={[styles.profileEmail, { color: muted }]}>{selected?.email}</Text></View></View>
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>{t('users.editData')}</Text>
          <TextInput value={draft.firstName} onChangeText={value => setDraft(current => ({ ...current, firstName: value }))} placeholder={t('users.firstName')} placeholderTextColor={muted} style={[styles.field, { color: text, borderColor: border }]} />
          <TextInput value={draft.lastName} onChangeText={value => setDraft(current => ({ ...current, lastName: value }))} placeholder={t('users.lastName')} placeholderTextColor={muted} style={[styles.field, { color: text, borderColor: border }]} />
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>{t('users.readonlyData')}</Text>
          <View style={styles.infoGrid}><Text style={[styles.infoItem, { color: muted }]}>{t('users.document')}: {selected?.documentNumber ?? '-'}</Text><Text style={[styles.infoItem, { color: muted }]}>{t('users.birthDate')}: {selected?.birthDate ?? '-'}</Text><Text style={[styles.infoItem, { color: muted }]}>{t('users.ficha')}: {selected?.chipName ?? t('users.noFicha')}</Text><Text style={[styles.infoItem, { color: muted }]}>{t('users.program')}: {selected?.programName ?? '-'}</Text></View>
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>{t('users.status')}</Text>
          <View style={styles.statusRow}>{statusValues.map(status => <TouchableOpacity key={status} onPress={() => setDraft(current => ({ ...current, accountStatus: status }))} style={[styles.statusOption, { borderColor: draft.accountStatus === status ? theme.primary : border, backgroundColor: draft.accountStatus === status ? theme.primary + '18' : 'transparent' }]}><Text style={{ color: draft.accountStatus === status ? theme.primary : text, fontSize: 12, fontWeight: '600' }}>{statusLabel(status)}</Text></TouchableOpacity>)}</View>
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>{t('users.role')}</Text>
          <View style={styles.roleGrid}>{roleValues.map(role => <TouchableOpacity key={role} onPress={() => setDraft(current => ({ ...current, role }))} style={[styles.roleOption, { borderColor: draft.role === role ? theme.primary : border, backgroundColor: draft.role === role ? theme.primary + '18' : 'transparent' }]}><Text style={{ color: draft.role === role ? theme.primary : text, fontSize: 12, fontWeight: '600' }}>{roleLabel(role)}</Text></TouchableOpacity>)}</View>
          <View style={styles.modalActions}><TouchableOpacity onPress={() => setSelected(null)} style={styles.cancelAction}><Text style={{ color: muted }}>{t('common.cancel')}</Text></TouchableOpacity><TouchableOpacity onPress={saveUser} disabled={saving} style={[styles.saveAction, { backgroundColor: theme.primary }]}><Ionicons name="save-outline" size={17} color={Colors.white} /><Text style={styles.saveActionText}>{saving ? t('common.loading') : t('common.save')}</Text></TouchableOpacity></View>
        </View></ScrollView></View>
      </Modal>
      {DialogUI}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 22, paddingBottom: 18 },
  headerCopy: { flex: 1 },
  eyebrow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  eyebrowText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black },
  subtitle: { marginTop: 5, fontSize: FontSize.sm },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, minHeight: 108, borderRadius: 16, padding: 12, justifyContent: 'space-between' },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 23, fontWeight: '900', marginTop: 5 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  toolbar: { borderRadius: 16, borderWidth: 1, padding: 10, marginBottom: 18 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
  filterRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(101,179,97,0.16)', marginTop: 5, paddingTop: 9 },
  filterContent: { gap: 7 },
  filterChip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  filterText: { fontSize: 11, fontWeight: '700' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  resultsTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  resultsCount: { fontSize: FontSize.sm },
  list: { gap: 10, paddingBottom: 30 },
  userCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 13 },
  avatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: '900', fontSize: 18 },
  userBody: { flex: 1, marginLeft: 12, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  userName: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  email: { fontSize: 12, marginTop: 3 },
  detailLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  roleText: { fontSize: 11, fontWeight: '800' },
  meta: { fontSize: 11, marginTop: 3 },
  fichaLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },
  actions: { alignItems: 'center', gap: 7, marginLeft: 8 },
  iconButton: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  loader: { position: 'absolute', top: 230, left: 0, right: 0 },
  empty: { textAlign: 'center', marginTop: 40, marginBottom: 40 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: 18 },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  modal: { borderRadius: 20, padding: 20, gap: 11 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 21, fontWeight: '900' },
  modalSubtitle: { fontSize: 12, marginTop: 3 },
  profileBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 12, marginVertical: 2 },
  modalAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalAvatarText: { color: Colors.white, fontSize: 17, fontWeight: '900' },
  profileName: { fontSize: 15, fontWeight: '800' },
  profileEmail: { fontSize: 12, marginTop: 3 },
  sectionLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 5 },
  field: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  infoGrid: { gap: 6, padding: 11, borderRadius: 11, backgroundColor: 'rgba(127,127,127,0.08)' },
  infoItem: { fontSize: 12 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusOption: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleOption: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 8 },
  cancelAction: { paddingHorizontal: 8, paddingVertical: 11 },
  saveAction: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  saveActionText: { color: Colors.white, fontWeight: '800', fontSize: 13 },
});
