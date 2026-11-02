const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = ts.transpileModule(
  fs.readFileSync(path.resolve(__dirname, '../shared/services/tokenStorage.js'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

// Load only the storage adapter, with its platform dependencies controlled.
// No React Native global mock: Expo's lazy globals must remain intact for other suites.
function loadTokens(platform, secureStore) {
  const module = { exports: {} };
  const resolve = name => {
    if (name === 'expo-secure-store') return secureStore;
    if (name === 'react-native') return { Platform: { OS: platform } };
    throw new Error('Unexpected storage dependency: ' + name);
  };
  new Function('require', 'module', 'exports', source)(resolve, module, module.exports);
  return module.exports;
}

test('web JWT stays in memory, is erased on logout and does not survive reload', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = { removeItem: jest.fn(), setItem: jest.fn(), getItem: jest.fn(() => 'legacy-token') };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    const tokens = loadTokens('web', {});
    expect(await tokens.getToken()).toBeNull();
    await tokens.saveToken('session-token');
    expect(await tokens.getToken()).toBe('session-token');
    expect(storage.removeItem).toHaveBeenCalledWith('token');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(await loadTokens('web', {}).getToken()).toBeNull();
    await tokens.removeToken();
    expect(await tokens.getToken()).toBeNull();
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('native sessions continue using SecureStore across module reloads', async () => {
  const data = new Map();
  const secure = {
    setItemAsync: jest.fn(async (key, value) => data.set(key, value)),
    getItemAsync: jest.fn(async key => data.get(key) ?? null),
    deleteItemAsync: jest.fn(async key => data.delete(key)),
  };
  await loadTokens('android', secure).saveToken('native-session');
  const restored = loadTokens('android', secure);
  expect(await restored.getToken()).toBe('native-session');
  await restored.removeToken();
  expect(await restored.getToken()).toBeNull();
});
