const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative, mocks, globals = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', '__DEV__', code)(name => {
    if (!Object.hasOwn(mocks, name)) throw new Error(`Unexpected dependency: ${name}`);
    return mocks[name];
  }, module, module.exports, globals.dev ?? false);
  return module.exports;
}

function hooks() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const state = initial => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
  };
  return {
    begin() { cursor = 0; },
    flush() { const pending = effects; effects = []; pending.forEach(effect => effect()); },
    useState: state,
    useRef(initial) { return state({ current: initial })[0]; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index][i]))) {
        slots[index] = deps;
        effects.push(effect);
      }
    },
    useCallback(fn) { return fn; },
    createContext() { return { Provider: 'Provider' }; },
    createElement(type, props) { return { type, props }; },
  };
}

async function verifyRecovery() {
  const authorization = load('shared/services/recoveryAuthorization.ts', {});
  const requests = [];
  const recovery = load('shared/services/passwordRecoveryService.js', {
    './api': { api: { post: async (...args) => { requests.push(args); return { data: { resetToken: 'synthetic-authorization' } }; } } },
    './recoveryAuthorization': authorization,
  });
  await recovery.requestRecovery('fixture@example.test');
  const verified = await recovery.verifyToken('fixture@example.test', '123456');
  authorization.rememberRecoveryAuthorization('fixture@example.test', verified.resetToken);
  assert.equal(authorization.readRecoveryAuthorization('other@example.test'), null);
  const token = authorization.readRecoveryAuthorization('FIXTURE@example.test');
  await recovery.resetPassword('fixture@example.test', token, 'Synthetic1!', 'Synthetic1!');
  assert.deepEqual(requests[1][1], { email: 'fixture@example.test', token: '123456' });
  assert.deepEqual(requests[2][1], { email: 'fixture@example.test', token, newPassword: 'Synthetic1!', confirmPassword: 'Synthetic1!' });
  authorization.clearRecoveryAuthorization();
  assert.equal(authorization.readRecoveryAuthorization('fixture@example.test'), null);
}

async function verifyLogout() {
  for (const status of [204, 401, 0, 500]) {
    const events = [];
    const auth = load('shared/services/authService.js', {
      './api': { api: { post: async url => {
        assert.equal(url, '/api/auth/logout'); events.push('server');
        if (status !== 204) throw status ? { response: { status } } : new Error('Network Error');
      } } },
      './tokenStorage': { saveToken() {}, removeToken: async () => { events.push('local'); } },
    });
    if ([204, 401].includes(status)) {
      await auth.logout(); assert.deepEqual(events, ['server', 'local']);
    } else {
      await assert.rejects(auth.logout()); assert.deepEqual(events, ['server']);
    }
  }
}

async function verify401() {
  let request;
  let reject;
  const events = [];
  const api = { interceptors: {
    request: { use: fn => { request = fn; } },
    response: { use: (_, fn) => { reject = fn; } },
  } };
  load('shared/services/api.js', {
    axios: { create: () => api },
    '../constants/api': { API_URL: 'http://fixture.invalid' },
    './tokenStorage': { getToken: async () => 'synthetic-jwt', removeToken: async () => { events.push('storage'); } },
    './sessionEvents': { notifySessionRejected: () => { events.push('context'); } },
  });
  assert.equal((await request({ url: '/api/auth/verify-token', headers: {} })).headers.Authorization, undefined);
  assert.equal((await request({ url: '/api/profile/me', headers: {} })).headers.Authorization, 'Bearer synthetic-jwt');
  const unauthorized = { config: { url: '/api/profile/me' }, response: { status: 401 } };
  await assert.rejects(reject(unauthorized), error => error === unauthorized);
  assert.deepEqual(events, ['storage', 'context']);
  events.length = 0;
  await assert.rejects(reject({ config: { url: '/api/auth/login' }, response: { status: 401 } }));
  assert.deepEqual(events, []);
}

async function verifyRestoration() {
  for (const status of [401, 0]) {
    const react = hooks();
    const token = JSON.stringify({ mock: true, exp: Date.now() / 1000 + 3600, id: 'fixture-user', role: 'APPRENTICE' });
    const t = key => key;
    const alert = () => {};
    let cleared = 0;
    const { AuthProvider } = load('shared/contexts/AuthContext.tsx', {
      react,
      'react-i18next': { useTranslation: () => ({ t }) },
      'expo-router': { router: { replace() {} } },
      '@/shared/constants/routes': { Routes: { ADMIN: { DASHBOARD: '/admin' } } },
      '@/shared/hooks/useAppDialog': { useAppDialog: () => ({ alert, DialogUI: null }) },
      '@/shared/services/sessionEvents': { onSessionRejected: () => () => {} },
      '@/shared/services/auditLogger': { logSuccess() {}, logFailure() {}, logBlocked() {} },
      '@/shared/services/authService': { login() {}, logout() {}, getMyProfile: async () => {
        throw status ? { response: { status } } : new Error('Network Error');
      } },
      '@/shared/services/tokenStorage': { getToken: async () => token, removeToken: async () => { cleared++; } },
    });
    react.begin(); AuthProvider({ children: null }); react.flush();
    await new Promise(resolve => setImmediate(resolve));
    react.begin(); const value = AuthProvider({ children: null }).props.value;
    assert.equal(value.loading, false);
    assert.equal(value.isAuthenticated, status !== 401);
    assert.equal(cleared, status === 401 ? 1 : 0);
  }
}

function verifyGuard() {
  for (const route of ['/profile', '/profile/settings', '/notifications']) {
    const react = hooks();
    const redirects = [];
    let ready = false;
    const { useAuthGuard } = load('shared/hooks/useAuthGuard.ts', {
      react,
      'expo-router': { router: { replace: value => redirects.push(value) }, useRootNavigationState: () => ready ? { key: 'root' } : undefined },
    });
    const render = (authenticated, loading) => {
      react.begin(); const result = useAuthGuard(authenticated, '/auth/login', loading); react.flush(); return result;
    };
    assert.equal(render(false, true).canRenderContent, false, route);
    assert.deepEqual(redirects, []);
    ready = true;
    assert.equal(render(true, false).canRenderContent, true);
    assert.equal(render(false, false).canRenderContent, false);
    render(false, false);
    assert.deepEqual(redirects, ['/auth/login']);
  }
}

async function verifyConnectionFailures() {
  const react = hooks();
  let failure = Object.assign(new Error('timeout of 15000ms exceeded'), { isAxiosError: true });
  let pending;
  let resent = 0;
  const { useVerificationCode } = load('features/auth/hooks/useVerificationCode.ts', {
    react,
    'react-i18next': { useTranslation: () => ({ t: key => key }) },
    '@/shared/services/auditLogger': { logFailure() {}, logSuccess() {} },
  });
  const render = () => {
    react.begin();
    return useVerificationCode({ namespace: 'verifyIdentity',
      onVerify: async () => { if (pending) return pending; throw failure; },
      onResend: async () => { resent++; },
    });
  };
  render().setCode('123456');
  for (let i = 0; i < 6; i++) await render().handleVerify();
  assert.equal(render().exhausted, false);
  assert.equal(render().error, 'passwordRecovery.errors.networkError');
  failure = { response: { status: 503 } };
  await render().handleVerify();
  assert.equal(render().error, 'passwordRecovery.errors.serverError');
  failure = { response: { status: 400 } };
  await render().handleVerify();
  assert.match(render().error, /4 intentos restantes/);
  let finish;
  pending = new Promise(resolve => { finish = resolve; });
  const checking = render().handleVerify();
  await render().handleResend();
  assert.equal(resent, 0);
  finish(); await checking; pending = null;
  failure = { response: { status: 429 } };
  await render().handleVerify();
  assert.equal(render().exhausted, true);
}

(async () => {
  await verifyRecovery(); await verifyLogout(); await verify401(); await verifyRestoration(); verifyGuard(); await verifyConnectionFailures();
  console.log('PASS: recovery contracts and memory isolation, server-first logout, network failure, 401 cleanup/restoration and login redirection.');
})().catch(error => { console.error(error); process.exitCode = 1; });
