import { Platform } from 'react-native';
import Constants from 'expo-constants';

const defaultApiUrl = Platform.select({
  android: 'http://10.0.2.2:8080',
  ios: 'http://localhost:8080',
  default: 'http://localhost:8080',
});

const defaultEmbeddingApiUrl = Platform.select({
  android: 'http://10.0.2.2:8090',
  ios: 'http://localhost:8090',
  default: 'http://localhost:8090',
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

const resolveLocalUrl = (configuredUrl, fallbackUrl) => {
  const targetUrl = configuredUrl || fallbackUrl;

  if (Platform.OS === 'web') return targetUrl;
  if (!targetUrl) return fallbackUrl;
  if (!/localhost|127\.0\.0\.1/.test(targetUrl)) return targetUrl;

  const expoHost = getExpoHost();
  if (expoHost) {
    return targetUrl.replace(/localhost|127\.0\.0\.1/, expoHost);
  }

  if (Platform.OS === 'android') {
    return targetUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }

  return targetUrl;
};

export const API_URL = resolveLocalUrl(process.env.EXPO_PUBLIC_API_URL, defaultApiUrl);
export const EMBEDDING_API_URL = resolveLocalUrl(
  process.env.EXPO_PUBLIC_EMBEDDING_API_URL,
  defaultEmbeddingApiUrl,
);
export const EMBEDDING_API_KEY = process.env.EXPO_PUBLIC_EMBEDDING_API_KEY || 'change-me';
