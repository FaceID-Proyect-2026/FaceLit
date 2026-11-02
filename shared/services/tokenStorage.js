// shared/services/tokenStorage.js
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'token';
let webToken = null;

// Remove credentials left by earlier releases. Web sessions last until reload.
function clearLegacyWebToken() {
  try { globalThis.localStorage?.removeItem(TOKEN_KEY); }
  catch { console.warn('[session] Could not clear legacy browser credential storage.'); }
}

export const saveToken = async (token) => {
  if (Platform.OS === 'web') {
    clearLegacyWebToken();
    webToken = token;
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

export const getToken = async () => {
  if (Platform.OS === 'web') {
    clearLegacyWebToken();
    return webToken;
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  if (Platform.OS === 'web') {
    webToken = null;
    clearLegacyWebToken();
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};
