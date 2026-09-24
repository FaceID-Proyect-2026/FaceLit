import { Platform } from 'react-native';
import Constants from 'expo-constants';

const defaultApiUrl = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});

const getExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') return null;
  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
};

const resolveApiUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;

  if (Platform.OS === 'web') return configuredUrl;
  if (!configuredUrl) return defaultApiUrl;
  if (!/localhost|127\.0\.0\.1/.test(configuredUrl)) return configuredUrl;

  const expoHost = getExpoHost();
  if (expoHost) {
    return configuredUrl.replace(/localhost|127\.0\.0\.1/, expoHost);
  }

  if (Platform.OS === 'android') {
    return configuredUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }

  return configuredUrl;
};

export const API_URL = resolveApiUrl();
