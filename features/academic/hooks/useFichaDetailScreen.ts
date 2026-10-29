import { AcademicPersonDetails } from '@/features/academic/components/PersonDetailsModal';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useFichaDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getFicha, programs, allFichas,
    deactivateLearner, reactivateLearner, updateLearnerInfo,
    transferLearner, regenerateTransferCode,
  } = useAcademic();
  const { alert, DialogUI } = useAppDialog();

  const [editFichaOpen, setEditFichaOpen]       = useState(false);
  const [copyMsg, setCopyMsg]                   = useState(false);
  const [editingLearner, setEditingLearner]     = useState<string | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<AcademicPersonDetails | null>(null);
  const [transferLearnerId, setTransferLearnerId] = useState<string | null>(null);
  const [destinationFichaId, setDestinationFichaId] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  // Búsqueda de aprendices — filtra por nombre, documento o correo
  const [learnerSearch, setLearnerSearch]       = useState('');

  const ficha = getFicha(id ?? '');
  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const cardBg  = theme.surface;
  const border  = theme.border;
  const bg      = isDark ? Colors.dark.background  : Colors.light.background;

    return {
    theme,
    isDark,
    t,
    id,
    programs,
    allFichas,
    deactivateLearner,
    reactivateLearner,
    updateLearnerInfo,
    transferLearner,
    regenerateTransferCode,
    alert,
    DialogUI,
    editFichaOpen,
    setEditFichaOpen,
    copyMsg,
    setCopyMsg,
    editingLearner,
    setEditingLearner,
    selectedLearner,
    setSelectedLearner,
    transferLearnerId,
    setTransferLearnerId,
    destinationFichaId,
    setDestinationFichaId,
    transferBusy,
    setTransferBusy,
    learnerSearch,
    setLearnerSearch,
    ficha,
    text,
    muted,
    cardBg,
    border,
    bg,
  };
}
