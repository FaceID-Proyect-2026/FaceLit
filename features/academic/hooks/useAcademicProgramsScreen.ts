import { ProgramStatusFilter, useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';
import { ViewMode } from '@/features/academic/components/AcademicProgramsSupport';

export function useAcademicProgramsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const {
    programs, allPrograms, allFichas, allInstructors, orphanLearners, search, setSearch, statusFilter, setStatusFilter, deactivateProgram, reactivateProgram, deleteProgram, loading, loadError,
  } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [viewMode] = useState<ViewMode>('programs');
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [fichaModalOpen, setFichaModalOpen] = useState(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const inputBg = theme.inputBg;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const filterOptions: { value: ProgramStatusFilter; label: string }[] = [
    { value: 'all', label: t('environments.filter.all') },
    { value: 'active', label: t('environments.filter.active') },
    { value: 'inactive', label: t('environments.filter.inactive') },
  ];

  // Eliminar (desactivación lógica) — solo disponible para programas Activos.
  const handleDeactivate = (id: string, name: string) => {
    alert(t('academic.programDelete'), `${name}\n\n${t('academic.programDeactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.programDelete'), style: 'destructive', onPress: async () => {
        try { await deactivateProgram(id); } catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo actualizar el programa.'); }
      }},
    ]);
  };

  // Eliminar completamente — solo disponible para programas Inactivos.
  const handleDeleteCompletely = (id: string, name: string) => {
    alert(t('academic.programDeleteCompletely'), `${name}\n\n${t('academic.programDeleteCompletelyConfirm')}`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: async () => {
        try { await deleteProgram(id); alert('✓', t('academic.programDeleteCompletelySuccess')); }
        catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo eliminar el programa.'); }
      }},
    ]);
  };

  const handleReactivate = (id: string, name: string) => {
    alert(t('academic.alreadyActive'), `${name}\n\n${t('environments.reactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('environments.reactivate'), onPress: async () => {
        try { await reactivateProgram(id); } catch (error: any) { alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo reactivar el programa.'); }
      } },
    ]);
  };

  // Muestra el onboarding solo si la base academica esta completamente vacia.
  const hasData =
    allPrograms.length > 0 ||
    allFichas.length > 0 ||
    allInstructors.length > 0 ||
    orphanLearners.length > 0 ||
    allFichas.some(ficha => ficha.learners.length > 0);

  const tabTitles: Record<ViewMode, string> = {
    programs: t('academic.programs'),
    unlinked: t('academic.unlinkedFichas'),
    orphans: t('academic.orphanLearners'),
  };
  const tabSubtitles: Record<ViewMode, string> = {
    programs: t('academic.programsListSubtitle', 'Consulta, filtra y administra los programas de formación y sus fichas asociadas.'),
    unlinked: t('academic.unlinkedListSubtitle', 'Fichas sin programa asociado. Vincúlalas a un programa activo o gestiona su ciclo de vida.'),
    orphans: t('academic.orphanLearnersSubtitle', 'Aprendices trasladados que quedaron sin ficha, a la espera de unirse a otra con un código.'),
  };

    return {
    theme,
    isDark,
    t,
    programs,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    loadError,
    DialogUI,
    isMobile,
    viewMode,
    programModalOpen,
    setProgramModalOpen,
    fichaModalOpen,
    setFichaModalOpen,
    text,
    muted,
    cardBg,
    border,
    inputBg,
    bg,
    filterOptions,
    handleDeactivate,
    handleDeleteCompletely,
    handleReactivate,
    hasData,
    tabTitles,
    tabSubtitles,
  };
}
