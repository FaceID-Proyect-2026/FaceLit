import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, TextInput, TouchableOpacity } from 'react-native';
import { ai } from '@/features/auth/components/NewPasswordStyles';

export function AnimatedInputRow({
  iconName, value, onChange, placeholder, placeholderColor,
  textColor, bgColor, borderColor, secureTextEntry, onToggle,
  showToggle, editable,
}: {
  iconName: any; value: string; onChange: (v: string) => void;
  placeholder: string; placeholderColor: string; textColor: string;
  bgColor: string; borderColor: string; secureTextEntry: boolean;
  onToggle?: () => void; showToggle?: boolean; editable?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onFocus = () => Animated.spring(scaleAnim, { toValue: 1.015, friction: 6, useNativeDriver: true }).start();
  const onBlur  = () => Animated.spring(scaleAnim, { toValue: 1,     friction: 6, useNativeDriver: true }).start();

  return (
    <Animated.View style={[ai.row, { backgroundColor: bgColor, borderColor, transform: [{ scale: scaleAnim }] }]}>
      <Ionicons name={iconName} size={18} color={placeholderColor} />
      <TextInput
        style={[ai.input, { color: textColor }] as any}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable !== false}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {showToggle && onToggle && (
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} size={18} color={placeholderColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
