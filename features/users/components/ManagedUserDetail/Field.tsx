import { Colors } from '@/shared/constants/colors';
import { Text, TextInput, View } from 'react-native';
import { styles } from '@/features/users/components/ManagedUserDetailStyles';

export function Field({
  label,
  value,
  onChange,
  error,
  keyboard,
  textColor,
  mutedColor,
  borderColor,
  labelColor,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  keyboard?: 'default' | 'email-address' | 'numeric';
  textColor: string;
  mutedColor: string;
  borderColor: string;
  labelColor: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: labelColor }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor={mutedColor}
        keyboardType={keyboard ?? 'default'}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        style={[styles.field, { color: textColor, borderColor: error ? Colors.error : borderColor }]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}
