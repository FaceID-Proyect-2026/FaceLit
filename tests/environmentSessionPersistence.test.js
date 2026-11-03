import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useEnvironmentSession } from '@/features/environments/useEnvironmentSession';
import * as sessionApi from '@/features/environments/environmentSessionApi';

jest.mock('@/features/environments/environmentSessionApi', () => ({
  createEnvironmentSession: jest.fn(), fetchChipsForSessionInstructor: jest.fn(),
  fetchSessionInstructors: jest.fn(),
  searchSessionEnvironments: jest.fn(),
}));

beforeEach(() => {
  jest.useFakeTimers();
  // Keep the clock and session fixture in the process-local timezone. The hook
  // builds session times with Date.setHours, which also uses local time.
  jest.setSystemTime(new Date(2026, 9, 30, 14, 0, 0, 0));
  sessionApi.fetchSessionInstructors.mockResolvedValue([{ idInstructor: 'teacher' }]);
  sessionApi.fetchChipsForSessionInstructor.mockResolvedValue([{ idChip: 'chip', chipCode: '3145555' }]);
  sessionApi.searchSessionEnvironments.mockResolvedValue([{ idEnvironment: 'room', environmentName: '209-02' }]);
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

async function setup() {
  const view = await renderHook(() => useEnvironmentSession());
  await act(async () => { view.result.current.setSelectedInstructorId('teacher'); });
  await act(async () => { view.result.current.setSelectedChipId('chip'); });
  await waitFor(() => {
    expect(view.result.current.environments).toHaveLength(1);
  });
  await act(async () => { view.result.current.selectEnvironment(view.result.current.environments[0]); });
  return view;
}
const settings = { registrationMinutes: 10, exitTime: '16:00', shutdownTime: '16:10' };

test('saves the selected room, instructor, chip and times and returns the server session', async () => {
  const session = { idRecordEnvironment: 'persisted-session', environmentName: '209-02', chipCode: '3145555' };
  sessionApi.createEnvironmentSession.mockResolvedValue(session);
  const view = await setup();
  let result;
  await act(async () => { result = await view.result.current.saveSession(settings); });
  expect(result).toEqual({ success: true, session });
  const payload = sessionApi.createEnvironmentSession.mock.calls[0][0];
  expect(payload).toMatchObject({ idEnvironment: 'room', idInstructorInCharge: 'teacher', idChip: 'chip', registrationMinutes: 10 });
  expect(new Date(payload.exitTime).getHours()).toBe(16);
  expect(new Date(payload.shutdownTime).getHours()).toBe(16);
  expect(new Date(payload.shutdownTime).getMinutes()).toBe(10);
  expect(new Date(payload.exitTime) - new Date(payload.entryTime)).toBe(2 * 60 * 60 * 1000);
  expect(new Date(payload.shutdownTime) - new Date(payload.exitTime)).toBe(10 * 60 * 1000);
  expect(view.result.current.saving).toBe(false);
});

test('does not report a local configuration as saved when the API rejects it', async () => {
  sessionApi.createEnvironmentSession.mockRejectedValue({ response: { data: { message: 'Ficha no autorizada' } } });
  const view = await setup();
  let result;
  await act(async () => { result = await view.result.current.saveSession(settings); });
  expect(result).toEqual({ success: false, error: 'Ficha no autorizada' });
  expect(view.result.current.saving).toBe(false);
});

test('clears the previous chip when the instructor changes and allows retry after a load error', async () => {
  const view = await setup();
  sessionApi.fetchChipsForSessionInstructor.mockRejectedValueOnce(new Error('offline'));
  await act(async () => { view.result.current.setSelectedInstructorId('other'); });
  expect(view.result.current.selectedChipId).toBe('');
  expect(view.result.current.chips).toEqual([]);
  expect(view.result.current.chipsError).toBe(true);
  await act(async () => { view.result.current.reloadChips(); });
  expect(view.result.current.chipsError).toBe(false);
  expect(view.result.current.chips[0].idChip).toBe('chip');
});
