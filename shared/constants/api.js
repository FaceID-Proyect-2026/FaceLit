import { Platform } from 'react-native';

const defaultApiUrl = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});

export const API_URL = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;