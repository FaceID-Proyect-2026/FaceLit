import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useFacialRegistration } from '@/features/auth/hooks/useFacialRegistration';
import { useSessionAttendanceCapture } from '@/features/facial/useSessionAttendanceCapture';
import { LIVENESS_FRAME_COUNT, LIVENESS_FRAME_DELAY_MS, LIVENESS_PREPARATION_MS, buildLivenessSequence, replaceLivenessChallengeAtIndex } from '@/features/facial/livenessChallenges';
import { validateFacialLiveness, registerFacialEmbeddingFromImage } from '@/shared/services/facialEmbeddingService';
import { registerFacialAttendanceFromImage } from '@/shared/services/facialAttendanceService';

jest.mock('expo-camera', () => ({ useCameraPermissions: () => [{ granted: true }, jest.fn()] }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: key => key }) }));
jest.mock('@/shared/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'learner-1', role: 'APPRENTICE' } }) }));
jest.mock('@/features/facial/facialStore', () => ({ registerFacialCapture: () => ({ success: true }) }));
jest.mock('@/shared/services/facialEnrollmentService', () => ({ confirmMyFacialRegistration: jest.fn().mockResolvedValue({}) }));
jest.mock('@/shared/utils/imageToBase64', () => ({ imageUriToDataUri: jest.fn(async uri => uri) }));
jest.mock('@/shared/services/facialEmbeddingService', () => ({
  validateFacialLiveness: jest.fn(), registerFacialEmbeddingFromImage: jest.fn(),
  getFacialEmbeddingErrorMessage: error => error.message,
}));
jest.mock('@/shared/services/facialAttendanceService', () => ({ registerFacialAttendanceFromImage: jest.fn() }));

const session = { idRecordEnvironment: 'session-1', idDevice: 'device-1' };
const modes = [
  ['registration', () => useFacialRegistration({ requireResponsibilityConfirmation: false }), registerFacialEmbeddingFromImage],
  ['attendance', () => useSessionAttendanceCapture({ session }), registerFacialAttendanceFromImage],
];
const frames = label => Array.from({ length: LIVENESS_FRAME_COUNT }, (_, index) => `${label}-${index}`);


beforeEach(() => {
  jest.useFakeTimers();
  jest.replaceProperty(Platform, 'OS', 'web');
  validateFacialLiveness.mockReset().mockResolvedValue({ live: true, reason: 'LIVE_OK' });
  registerFacialEmbeddingFromImage.mockReset().mockResolvedValue({});
  registerFacialAttendanceFromImage.mockReset().mockResolvedValue({});
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); jest.restoreAllMocks(); });
async function start(hook) {
  const view = await renderHook(hook);
  await act(async () => { await view.result.current.handleOpenCamera(); });
  await act(async () => { jest.advanceTimersByTime(1500); });
  return view;
}
async function capture(view, label) {
  await act(async () => { view.result.current.handleWebCapture(frames(label), 120); });
}

test('selects two distinct challenges and replaces only the failed challenge', () => {
  for (let index = 0; index < 100; index += 1) {
    const sequence = buildLivenessSequence();
    expect(new Set(sequence.map(item => item.code)).size).toBe(2);
    const replacement = replaceLivenessChallengeAtIndex(sequence, 1);
    expect(replacement[0]).toEqual(sequence[0]);
    expect(replacement[1].code).not.toBe(sequence[0].code);
    expect(replacement[1].code).not.toBe(sequence[1].code);
  }
});

describe.each(modes)('%s challenge flow', (_name, hook, save) => {
  test('waits for preparation and finishes capturing the action before requesting validation', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const view = await start(hook);
    const takePictureAsync = jest.fn().mockResolvedValue({ uri: 'native-frame' });
    view.result.current.cameraRef.current = { takePictureAsync };
    await act(async () => { await jest.advanceTimersByTimeAsync(LIVENESS_PREPARATION_MS - 1); });
    expect(takePictureAsync).not.toHaveBeenCalled();
    await act(async () => { await jest.advanceTimersByTimeAsync(1); });
    expect(takePictureAsync).toHaveBeenCalledTimes(1);
    expect(validateFacialLiveness).not.toHaveBeenCalled();
    await act(async () => { await jest.advanceTimersByTimeAsync((LIVENESS_FRAME_COUNT - 1) * LIVENESS_FRAME_DELAY_MS - 1); });
    expect(validateFacialLiveness).not.toHaveBeenCalled();
    await act(async () => { await jest.advanceTimersByTimeAsync(1); });
    expect(takePictureAsync).toHaveBeenCalledTimes(LIVENESS_FRAME_COUNT);
    expect(validateFacialLiveness).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
  });
  test('saves only after two successful different challenges, retaining the first after a second-step failure', async () => {
    const view = await start(hook);
    const firstCode = view.result.current.livenessChallenge.code;
    await capture(view, 'first');
    expect(view.result.current.activeChallengeIndex).toBe(1);
    expect(view.result.current.livenessInstruction).toContain('Reto 2/2');
    expect(save).not.toHaveBeenCalled();
    const failedCode = view.result.current.livenessChallenge.code;
    expect(failedCode).not.toBe(firstCode);
    validateFacialLiveness.mockResolvedValueOnce({ live: false, reason: 'Acción incorrecta' });
    await capture(view, 'failed');
    expect(view.result.current.activeChallengeIndex).toBe(1);
    expect(view.result.current.errorModalTitle).toBe('Acción no realizada');
    const replacement = view.result.current.livenessChallenge.code;
    expect(replacement).not.toBe(firstCode);
    expect(replacement).not.toBe(failedCode);
    expect(save).not.toHaveBeenCalled();
    await act(async () => { view.result.current.handleCloseErrorModal(); jest.advanceTimersByTime(1500); });
    await capture(view, 'second');
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      imageFrames: [...frames('first'), ...frames('second')], livenessChallenges: [firstCode, replacement],
    }));
    expect(view.result.current.successModalVisible).toBe(true);
  });

  test('does not count a failed first challenge or submit a registration', async () => {
    const view = await start(hook);
    const first = view.result.current.livenessChallenge.code;
    validateFacialLiveness.mockResolvedValueOnce({ live: false, reason: 'Otra acción' });
    await capture(view, 'wrong');
    expect(view.result.current.activeChallengeIndex).toBe(0);
    expect(view.result.current.livenessChallenge.code).not.toBe(first);
    expect(view.result.current.errorModalVisible).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  test('ignores late validation after cancelling the camera', async () => {
    const view = await start(hook);
    let resolve;
    validateFacialLiveness.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    await capture(view, 'pending');
    await act(async () => { view.result.current.handleCancelCamera(); });
    await act(async () => { resolve({ live: true }); });
    expect(view.result.current.screenState).toBe('idle');
    expect(view.result.current.activeChallengeIndex).toBe(0);
    expect(save).not.toHaveBeenCalled();
  });

  test('does not award two successes for concurrent capture callbacks', async () => {
    const view = await start(hook);
    let resolve;
    validateFacialLiveness.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    await act(async () => {
      view.result.current.handleWebCapture(frames('one'), 120);
      view.result.current.handleWebCapture(frames('duplicate'), 120);
    });
    expect(validateFacialLiveness).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ live: true }); });
    expect(view.result.current.activeChallengeIndex).toBe(1);
    expect(save).not.toHaveBeenCalled();
  });
});
