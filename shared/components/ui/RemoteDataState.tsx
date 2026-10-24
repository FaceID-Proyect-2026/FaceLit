import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/contexts/ThemeContext';

export default function RemoteDataState({ loading, error, onRetry }: {
  loading: boolean; error: boolean; onRetry: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  if (!loading && !error) return null;
  return (
    <View accessibilityLiveRegion="polite" style={{ padding: 16, gap: 8 }}>
      {loading ? <ActivityIndicator color={theme.primary} /> : null}
      <Text accessibilityRole={error ? 'alert' : undefined} style={{ color: theme.text }}>
        {t(loading ? 'dataState.loading' : 'dataState.error')}
      </Text>
      {error ? <TouchableOpacity accessibilityRole="button" onPress={onRetry}>
        <Text style={{ color: theme.primary }}>{t('dataState.retry')}</Text>
      </TouchableOpacity> : null}
    </View>
  );
}
