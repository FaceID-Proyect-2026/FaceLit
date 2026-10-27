const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { execFileSync } = require('node:child_process');
const root = path.dirname(require.resolve('../package.json'));

function load(file, mocks = {}, globals = {}, cache = new Map()) {
  const full = path.resolve(root, file);
  if (cache.has(full)) return cache.get(full).exports;
  const mod = { exports: {} }; cache.set(full, mod);
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
    fileName: full,
  }).outputText;
  const requireLocal = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    let resolved = name.startsWith('@/') ? path.resolve(root, name.slice(2))
      : name.startsWith('.') ? path.resolve(path.dirname(full), name) : null;
    if (!resolved) throw new Error(`Unexpected dependency: ${name}`);
    resolved = ['.ts', '.tsx', '.js'].map(ext => resolved + ext).find(candidate => fs.existsSync(candidate));
    if (!resolved) throw new Error(`Cannot resolve ${name}`);
    return load(resolved, mocks, globals, cache);
  };
  new Function('require', 'module', 'exports', 'navigator', 'localStorage', code)(
    requireLocal, mod, mod.exports, globals.navigator, globals.localStorage,
  );
  return mod.exports;
}

const { isMobileEntry, mobileEntryRoute } = load('shared/utils/entryPlatform.ts');
const devices = [
  ['web', { userAgent: 'Windows NT 10.0; Win64; x64', maxTouchPoints: 0 }, false],
  ['web', { userAgent: 'Windows NT 10.0', maxTouchPoints: 10 }, false],
  ['web', { userAgent: 'Macintosh; Intel Mac OS X', maxTouchPoints: 0 }, false],
  ['web', { userAgent: 'X11; Linux x86_64' }, false],
  ['web', { userAgent: 'iPhone; CPU iPhone OS 18_0 like Mac OS X' }, true],
  ['web', { userAgent: 'Linux; Android 15; Mobile' }, true],
  ['web', { userAgent: 'Linux; Android 15; Tablet' }, true],
  ['web', { userAgent: 'iPad; CPU OS 18_0' }, true],
  ['web', { userAgent: 'Macintosh; Intel Mac OS X', maxTouchPoints: 5 }, true],
  ['web', { userAgentData: { mobile: true } }, true],
  ['web', { userAgent: 'Windows NT', innerWidth: 320 }, false],
  ['web', undefined, false], ['android', undefined, true], ['ios', undefined, true],
];
for (const [platform, device, expected] of devices) assert.equal(isMobileEntry(platform, device), expected);
for (const [role, target] of [['APPRENTICE', '/apprentice'], ['INSTRUCTOR', '/instructor'], ['COORDINATOR', '/admin'], ['ADMINISTRATOR', '/admin']]) {
  assert.equal(mobileEntryRoute(false, role), '/auth/login');
  assert.equal(mobileEntryRoute(true, role), target);
}

function entry({ platform = 'web', device, auth = { loading: false, isAuthenticated: false, role: null }, ready = true }) {
  const unset = Symbol('unset'); let state = unset; let effects = [];
  const react = {
    createElement: (type, props) => ({ type, props }),
    useState: initial => {
      if (state === unset) state = initial;
      return [state, value => { state = value; }];
    },
    useEffect: callback => { effects.push(callback); },
  };
  const Redirect = Symbol('Redirect');
  const mocks = {
    react,
    'react-native': { Platform: { OS: platform }, StyleSheet: { create: styles => styles } },
    'expo-router': { Redirect, useRootNavigationState: () => ready ? { key: 'root' } : undefined },
    '@/shared/contexts/AuthContext': { useAuth: () => auth },
    '@/shared/contexts/ThemeContext': {}, '@/shared/components/ui': {},
    '@expo/vector-icons': {}, 'expo-linear-gradient': {}, 'react-i18next': {},
    'react-native-safe-area-context': {},
  };
  const screen = load('app/index.tsx', mocks, { navigator: device }).default;
  assert.equal(screen(), null, 'Initial/static render must never expose the landing before detection');
  effects.forEach(effect => effect()); effects = [];
  return { result: screen(), Redirect };
}

let view = entry({ device: { userAgent: 'Windows NT', innerWidth: 320 } });
assert.equal(view.result.type.name, 'LandingScreen');
view = entry({ device: { userAgent: 'Windows NT' }, auth: { loading: true } });
assert.equal(view.result.type.name, 'LandingScreen');
for (const options of [
  { platform: 'android' }, { platform: 'ios' },
  { device: { userAgent: 'iPhone' } }, { device: { userAgent: 'Android' } },
  { device: { userAgent: 'iPad' } },
]) {
  view = entry(options);
  assert.equal(view.result.type, view.Redirect);
  assert.equal(view.result.props.href, '/auth/login');
}
assert.equal(entry({ platform: 'android', auth: { loading: true } }).result, null);
assert.equal(entry({ platform: 'android', ready: false }).result, null);
view = entry({ platform: 'android', auth: { loading: false, isAuthenticated: true, role: 'APPRENTICE' } });
assert.equal(view.result.props.href, '/apprentice');

// Preserve the landing behavior while allowing the approved light-palette tokens.
function landingBody(text, readDependency) {
  const ast = ts.createSourceFile('index.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'LandingScreen');
  if (declaration) return declaration.body.getText(ast).replace(/\r\n/g, '\n');
  const imported = ast.statements.find(node => ts.isImportDeclaration(node) && node.importClause?.name?.text === 'LandingScreen');
  assert.ok(imported, 'The entry route must resolve the existing landing screen');
  return landingBody(readDependency(imported.moduleSpecifier.text.replace(/^@\//, '') + '.tsx'), readDependency);
}
const readCurrent = file => fs.readFileSync(path.join(root, file), 'utf8');
const readHead = file => execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' });
const expectedLandingBody = landingBody(readHead('app/index.tsx'), readHead)
  .replace("backgroundColor: isDark ? '#02180E' : Colors.white", "backgroundColor: isDark ? '#02180E' : Colors.light.surface")
  .replace(": ['#FAFAFA', '#FFFFFF', '#F1F5F9']", ': Colors.light.gradient')
  .replace("backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF'", "backgroundColor: isDark ? '#1A1A1A' : Colors.light.surface");
assert.equal(landingBody(readCurrent('app/index.tsx'), readCurrent), expectedLandingBody);

if (process.argv.includes('--exported-web')) {
  const entryHtml = fs.readFileSync(path.join(root, '.expo/entry-validation/index.html'), 'utf8');
  const loginHtml = fs.readFileSync(path.join(root, '.expo/entry-validation/auth/login.html'), 'utf8');
  assert.equal(entryHtml.includes('Transformando'), false);
  assert.match(loginHtml, /<input[^>]*type=.password./);
  console.log('OK: exported HTML does not expose the landing before detection; existing login keeps its password input.');
}

async function testExistingAuthServices(platform) {
  const browserValues = new Map(); const secureValues = new Map(); let created = false;
  const account = { numberDocument: '1000000000', firstName: 'Ana', lastName: 'Prueba', email: 'test@example.invalid', role: 'COORDINATOR' };
  const localStorage = { setItem: (k, v) => browserValues.set(k, v), getItem: k => browserValues.get(k) ?? null, removeItem: k => browserValues.delete(k) };
  const mocks = {
    'react-native': { Platform: { OS: platform } },
    'expo-secure-store': {
      setItemAsync: async (k, v) => secureValues.set(k, v),
      getItemAsync: async k => secureValues.get(k) ?? null,
      deleteItemAsync: async k => secureValues.delete(k),
    },
    './api': { api: {
      post: async (url, data) => {
        if (url === '/api/auth/logout') return { data: null };
        if (url === '/api/admin/users') {
          assert.deepEqual(data, account);
          if (created) throw Object.assign(new Error('Duplicate'), { response: { status: 409 } });
          created = true;
          return { data: { ...account, userId: 'registered-user' } };
        }
        assert.equal(url, '/api/auth/login');
        assert.equal(created, true); assert.equal(data.numberDocument, account.numberDocument);
        if (data.password !== 'A1!TestPassword') throw Object.assign(new Error('Invalid credentials'), { response: { status: 401 } });
        assert.equal(data.privacyAccepted, true);
        return { data: { token: 'simulated-session-token', userId: 'registered-user', role: account.role } };
      },
      get: async url => { assert.equal(url, '/api/profile/me'); return { data: { ...account, idUser: 'registered-user' } }; },
    } },
  };
  const users = load('shared/services/userManagementService.js', mocks, { localStorage });
  const registered = await users.createManagedUser(account);
  assert.equal(registered.userId, 'registered-user');
  await assert.rejects(users.createManagedUser(account), error => error.response.status === 409);
  let auth = load('shared/services/authService.js', mocks, { localStorage });
  assert.equal((await auth.login(account.numberDocument, 'A1!TestPassword', true)).role, 'COORDINATOR');
  // Recreate frontend modules as on a restart; only platform token storage survives.
  auth = load('shared/services/authService.js', mocks, { localStorage });
  const tokens = load('shared/services/tokenStorage.js', mocks, { localStorage });
  assert.equal(await tokens.getToken(), 'simulated-session-token');
  assert.equal((await auth.getMyProfile()).idUser, registered.userId);
  assert.equal(browserValues.has('token'), platform === 'web');
  assert.equal(secureValues.has('token'), platform !== 'web');
  await auth.logout(); assert.equal(await tokens.getToken(), null);
  await assert.rejects(auth.login(account.numberDocument, 'incorrect', true), error => error.response.status === 401);
  assert.equal(await tokens.getToken(), null);
}

Promise.all(['web', 'android', 'ios'].map(testExistingAuthServices)).then(() => {
  console.log('OK: device detection, first render, mobile redirects, active session, unchanged desktop landing, existing registration/login contracts and token persistence. Backend responses and storage adapters are simulated.');
}).catch(error => { console.error(error); process.exitCode = 1; });
