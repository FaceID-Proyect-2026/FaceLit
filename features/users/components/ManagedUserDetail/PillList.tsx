import { Text, View } from 'react-native';
import { styles } from '@/features/users/components/ManagedUserDetailStyles';

export function PillList({ items, empty, color }: { items?: string[]; empty: string; color: string }) {
  const uniqueItems = [...new Set((items ?? []).filter(Boolean))];
  if (!uniqueItems.length) {
    return <Text style={[styles.infoText, { color }]}>{empty}</Text>;
  }

  return (
    <View style={styles.pillList}>
      {uniqueItems.map((item) => (
        <View key={item} style={[styles.smallPill, { borderColor: color + '55', backgroundColor: color + '12' }]}>
          <Text style={[styles.smallPillText, { color }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}
