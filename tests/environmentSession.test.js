import { act, renderHook } from '@testing-library/react-native';
import { useEnvironmentSession } from '@/features/environments/useEnvironmentSession';
import { fetchChipsForSessionInstructor, fetchSessionInstructors, searchSessionEnvironments } from '@/features/environments/environmentSessionApi';

jest.mock('@/features/environments/environmentSessionApi', () => ({
  fetchChipsForSessionInstructor: jest.fn(), fetchSessionInstructors: jest.fn(),
  searchSessionEnvironments: jest.fn(), createEnvironmentSession: jest.fn(), getOrCreateSessionEnvironment: jest.fn(),
}));

const chip = { idChip: 'chip-1', chipCode: '3145555', programName: 'ADSO', state: 'ACTIVE' };
beforeEach(() => {
  jest.useFakeTimers();
  fetchSessionInstructors.mockReset().mockResolvedValue([]);
  searchSessionEnvironments.mockReset().mockResolvedValue([]);
  fetchChipsForSessionInstructor.mockReset().mockResolvedValue([chip]);
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
async function select(view, id = 'instructor-1') {
  await act(async () => { view.result.current.setSelectedInstructorId(id); });
}

test('reselecting the same instructor preserves loaded chips and the selected chip', async () => {
  const view = await renderHook(useEnvironmentSession);
  await select(view);
  await act(async () => { view.result.current.setSelectedChipId(chip.idChip); });
  await select(view);
  expect(view.result.current.chips).toEqual([chip]);
  expect(view.result.current.selectedChipId).toBe(chip.idChip);
  expect(fetchChipsForSessionInstructor).toHaveBeenCalledTimes(1);
});

test('a failed request can be retried without switching instructors', async () => {
  fetchChipsForSessionInstructor.mockRejectedValueOnce(new Error('Network error'));
  const view = await renderHook(useEnvironmentSession);
  await select(view);
  expect(view.result.current.chipsError).toBe(true);
  expect(view.result.current.chipsLoading).toBe(false);
  expect(view.result.current.chips).toEqual([]);
  await act(async () => { view.result.current.reloadChips(); });
  expect(view.result.current.chipsError).toBe(false);
  expect(view.result.current.chips).toEqual([chip]);
});

test('an instructor without active chips is empty rather than a connection error', async () => {
  fetchChipsForSessionInstructor.mockResolvedValueOnce([]);
  const view = await renderHook(useEnvironmentSession);
  await select(view);
  expect(view.result.current.chips).toEqual([]);
  expect(view.result.current.chipsError).toBe(false);
  expect(view.result.current.chipsLoading).toBe(false);
});

test('a slow old response does not overwrite the newly selected instructor chips', async () => {
  let resolveOld;
  fetchChipsForSessionInstructor.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; }));
  const view = await renderHook(useEnvironmentSession);
  await select(view, 'old-instructor');
  expect(view.result.current.chipsLoading).toBe(true);
  await select(view, 'new-instructor');
  await act(async () => { resolveOld([{ ...chip, idChip: 'old-chip' }]); });
  expect(view.result.current.chips).toEqual([chip]);
  expect(view.result.current.chipsLoading).toBe(false);
});

test('refreshing the same instructor retrieves newly available chips', async () => {
  const view = await renderHook(useEnvironmentSession);
  await select(view);
  const added = { ...chip, idChip: 'chip-2', chipCode: '3145556' };
  fetchChipsForSessionInstructor.mockResolvedValueOnce([chip, added]);
  await act(async () => { view.result.current.reloadChips(); });
  expect(view.result.current.chips).toEqual([chip, added]);
  expect(fetchChipsForSessionInstructor).toHaveBeenLastCalledWith('instructor-1');
});
