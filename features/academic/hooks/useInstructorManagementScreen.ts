import { deactivateInstructor, fetchInstructors, reactivateInstructor } from '@/features/academic/academicApi';
import { refreshAcademicStoreFromBackend, useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InstructorItem } from '@/features/academic/components/InstructorManagementSupport';

export function useInstructorManagementScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { programs } = useAcademic();

  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ESPECIFICO' | 'TRANSVERSAL'>('ALL');
  const [items,      setItems]      = useState<InstructorItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingItem, setEditingItem] = useState<InstructorItem | null>(null);

  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg  = theme.surface;
  const border  = theme.border;
  const inputBg = theme.inputBg;
  const bg      = isDark ? Colors.dark.background : Colors.light.background;

  const activePrograms = programs
    .filter(p => p.status === 'active')
    .map(p => ({ id: p.id, name: p.name, code: p.code ?? '' }));

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    const q = search.trim();
    if (q) {
      if (/^\d+$/.test(q)) params.document = q;
      else params.name = q;
    }
    if (typeFilter !== 'ALL') params.type = typeFilter;
    fetchInstructors(params)
      .then(data => setItems(data as InstructorItem[]))
      .catch(err => setError(err?.response?.data?.message ?? t('academic.instructorLoadError')))
      .finally(() => setLoading(false));
  }, [search, typeFilter, t]);

  useEffect(() => { load(); }, [load]);

  const openCreateModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: InstructorItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const refreshAfterLifecycleChange = async () => {
    await refreshAcademicStoreFromBackend();
    load();
  };

  const handleDeactivateInstructor = async (item: InstructorItem, fullName: string) => {
    try {
      await deactivateInstructor(item.idInstructor);
      await refreshAfterLifecycleChange();
    } catch (err: any) {
      setError(err?.message ?? err?.response?.data?.message ?? t('academic.instructorDeactivateError', { name: fullName }));
    }
  };

  const handleActivateInstructor = async (item: InstructorItem, fullName: string) => {
    try {
      await reactivateInstructor(item.idInstructor);
      await refreshAfterLifecycleChange();
    } catch (err: any) {
      setError(err?.message ?? err?.response?.data?.message ?? t('academic.instructorActivateError', { name: fullName }));
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(Routes.ACADEMIC.PROGRAMS as any);
  };

    return {
    t,
    theme,
    isDark,
    programs,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    items,
    loading,
    error,
    modalOpen,
    editingItem,
    text,
    muted,
    cardBg,
    border,
    inputBg,
    bg,
    activePrograms,
    load,
    openCreateModal,
    openEditModal,
    closeModal,
    handleDeactivateInstructor,
    handleActivateInstructor,
    handleBack,
  };
}
