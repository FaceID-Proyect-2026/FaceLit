import { act, renderHook } from '@testing-library/react-native';
import { useLoginForm } from '@/features/auth/hooks/useLoginForm';
import { getPrivacyAcceptanceStatus } from '@/shared/services/authService';

const mockLogin = jest.fn();
const mockTranslate = key => key;
jest.mock('@/shared/contexts/AuthContext', () => ({ useAuth: () => ({ login: mockLogin }) }));
jest.mock('@/shared/services/authService', () => ({ getPrivacyAcceptanceStatus: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate }) }));

beforeEach(() => {
  jest.useFakeTimers();
  mockLogin.mockReset();
  getPrivacyAcceptanceStatus.mockReset().mockResolvedValue(true);
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

async function validForm() {
  const view = await renderHook(() => useLoginForm());
  await act(async () => {
    view.result.current.setDocumentField('12345678');
    view.result.current.setField('password', 'TestPass123!');
  });
  await act(async () => { jest.advanceTimersByTime(250); });
  return view;
}

test('rejects missing document and password without sending a login request', async () => {
  const { result } = await renderHook(() => useLoginForm());
  await act(async () => { await result.current.handleSubmit(); });
  expect(result.current.errors.document).toBe('login.errors.emptyDocument');
  expect(result.current.errors.password).toBe('login.errors.emptyPassword');
  expect(mockLogin).not.toHaveBeenCalled();
  expect(result.current.loading).toBe(false);
});

test('requires privacy consent when the server has no previous acceptance', async () => {
  getPrivacyAcceptanceStatus.mockResolvedValue(false);
  const { result } = await validForm();
  await act(async () => { await result.current.handleSubmit(); });
  expect(result.current.errors.policy).toBe('login.errors.policyRequired');
  expect(mockLogin).not.toHaveBeenCalled();
  await act(async () => { result.current.setField('accepted', true); });
  mockLogin.mockResolvedValue({ success: true });
  await act(async () => { await result.current.handleSubmit(); });
  expect(mockLogin).toHaveBeenCalledWith('12345678', 'TestPass123!', true);
});

test('submits valid credentials and restores the idle state', async () => {
  mockLogin.mockResolvedValue({ success: true });
  const { result } = await validForm();
  await act(async () => { await result.current.handleSubmit(); });
  expect(mockLogin).toHaveBeenCalledWith('12345678', 'TestPass123!', true);
  expect(result.current.loading).toBe(false);
  expect(Object.values(result.current.errors).every(value => !value)).toBe(true);
});

test.each([
  [{ success: false }, 'password', 'login.errors.invalidCredentials'],
  [{ success: false, locked: true, lockRemainingSeconds: 60 }, 'blocked', 'login.errors.accountLocked'],
  [{ success: false, networkError: true, error: 'Service unavailable' }, 'general', 'Service unavailable'],
])('presents the appropriate failure state for %j', async (response, field, message) => {
  mockLogin.mockResolvedValue(response);
  const { result } = await validForm();
  await act(async () => { await result.current.handleSubmit(); });
  expect(result.current.errors[field]).toBe(message);
  expect(result.current.loading).toBe(false);
});

test('prevents a second submission while the first login is pending', async () => {
  let complete;
  mockLogin.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  const { result } = await validForm();
  let pending;
  await act(async () => {
    pending = result.current.handleSubmit();
    await result.current.handleSubmit();
  });
  expect(mockLogin).toHaveBeenCalledTimes(1);
  expect(result.current.loading).toBe(true);
  await act(async () => { complete({ success: true }); await pending; });
  expect(result.current.loading).toBe(false);
});

test('does not submit when the privacy service cannot be reached', async () => {
  getPrivacyAcceptanceStatus.mockRejectedValue(new Error('Offline'));
  const view = await renderHook(() => useLoginForm());
  await act(async () => {
    view.result.current.setDocumentField('12345678');
    view.result.current.setField('password', 'TestPass123!');
  });
  await act(async () => { await view.result.current.handleSubmit(); });
  expect(view.result.current.errors.general).toBe('login.errors.networkError');
  expect(mockLogin).not.toHaveBeenCalled();
});
