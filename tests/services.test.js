import axios from 'axios';
import { api } from '@/shared/services/api';
import { login } from '@/shared/services/authService';
import { saveToken } from '@/shared/services/tokenStorage';
import { registerFacialEmbeddingFromImage, validateFacialLiveness } from '@/shared/services/facialEmbeddingService';
import { setLearnerAccountState } from '@/features/academic/academicApi';
import {
  fetchAttendanceMatrix, registerFacialAttendanceEvent,
  registerFacialAttendanceFromImage, initializeFacialSessionAbsences, updateFacialEventExcuse,
} from '@/shared/services/facialAttendanceService';

// Keep Axios serialization and the actual service functions; replace only transport.
// This contract test does not start or authenticate against a backend server.
jest.mock('@/shared/services/api', () => ({ api: jest.requireActual('axios').default.create() }));
jest.mock('@/shared/services/tokenStorage', () => ({ saveToken: jest.fn(), removeToken: jest.fn() }));

let requests;
function respond(data, status = 200) {
  api.defaults.adapter = async config => {
    requests.push(config);
    const response = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 400) throw new axios.AxiosError('HTTP error', 'ERR_BAD_RESPONSE', config, null, response);
    return response;
  };
}
beforeEach(() => { requests = []; respond({}); });

test('login sends the agreed payload and stores the issued token', async () => {
  respond({ token: 'test-only-token', role: 'APRENDIZ' });
  const data = await login('12345678', 'TestPass123!', true);
  expect(requests[0].url).toBe('/api/auth/login');
  expect(JSON.parse(requests[0].data)).toEqual({ numberDocument: '12345678', password: 'TestPass123!', privacyAccepted: true });
  expect(saveToken).toHaveBeenCalledWith('test-only-token');
  expect(data.role).toBe('APRENDIZ');
});

test('rejected credentials do not persist a token', async () => {
  respond({ message: 'Unauthorized' }, 401);
  await expect(login('12345678', 'TestPass123!', true)).rejects.toMatchObject({ response: { status: 401 } });
  expect(saveToken).not.toHaveBeenCalled();
});

const range = { idChip: 'qa-chip', dateFrom: '2026-10-01', dateTo: '2026-10-25' };
test.each([{ learners: [] }, { learners: [{ learnerId: 'qa-learner', days: [] }] }])('returns the attendance matrix including an empty result: %j', async ({ learners }) => {
  const matrix = { idChip: 'qa-chip', sessions: [], learners };
  respond(matrix);
  await expect(fetchAttendanceMatrix(range)).resolves.toEqual(matrix);
  expect(requests[0]).toMatchObject({ method: 'get', url: '/api/facial/events/attendance-matrix', params: range });
});

test.each([401, 403, 500])('propagates HTTP %s instead of presenting empty attendance as success', async status => {
  respond({ message: 'Rejected' }, status);
  await expect(fetchAttendanceMatrix(range)).rejects.toMatchObject({ response: { status } });
  expect(requests).toHaveLength(1);
});

test('propagates a connection timeout', async () => {
  api.defaults.adapter = async config => { throw new axios.AxiosError('Timeout', 'ECONNABORTED', config); };
  await expect(fetchAttendanceMatrix(range)).rejects.toMatchObject({ code: 'ECONNABORTED' });
});

test('registers an attendance event using the explicit timestamp and score', async () => {
  const payload = { idRecordEnvironment: 'qa-session', idDevice: 'qa-device', idApprentice: 'qa-apprentice',
    eventDatetime: '2026-10-25T12:00:00.000Z', eventType: 'ENTRY', recognitionResult: 'MATCH', matchScore: 0.95, origin: 'PC' };
  respond({ idFacialEvent: 'qa-event' });
  await expect(registerFacialAttendanceEvent(payload)).resolves.toEqual({ idFacialEvent: 'qa-event' });
  expect(requests[0].url).toBe('/api/facial/events');
  expect(JSON.parse(requests[0].data)).toEqual(payload);
});

test('preserves challenge frames in a facial capture request', async () => {
  const payload = { idRecordEnvironment: 'qa-session', idDevice: 'qa-device', imageBase64: 'synthetic-placeholder',
    imageFrames: ['synthetic-frame-1', 'synthetic-frame-2'], livenessChallenge: 'BLINK', livenessChallenges: ['BLINK'], origin: 'PC' };
  await registerFacialAttendanceFromImage(payload);
  expect(requests[0].url).toBe('/api/facial/events/from-image');
  expect(JSON.parse(requests[0].data)).toEqual(payload);
});

test('initializes absences using a session parameter', async () => {
  await initializeFacialSessionAbsences('qa-session');
  expect(requests[0]).toMatchObject({ method: 'post', url: '/api/facial/events/initialize-absences', params: { idRecordEnvironment: 'qa-session' } });
});

test('updates an excuse using PATCH and the agreed identifiers', async () => {
  const payload = { idRecordEnvironment: 'qa-session', idApprentice: 'qa-apprentice', excuse: true };
  await updateFacialEventExcuse(payload);
  expect(requests[0]).toMatchObject({ method: 'patch', url: '/api/facial/events/excuse' });
  expect(JSON.parse(requests[0].data)).toEqual(payload);
});

test('enrolment uses the authenticated backend and sends no service credential or claimed audit author', async () => {
  await registerFacialEmbeddingFromImage({ userId: 'owner', imageBase64: 'synthetic',
    imageFrames: ['one', 'two', 'three'], livenessChallenges: ['BLINK'], resetToken: 'grant', createdBy: 'spoofed' });
  expect(requests[0].url).toBe('/api/facial/embeddings/from-image');
  expect(requests[0].headers.get('X-API-Key')).toBeUndefined();
  expect(JSON.parse(requests[0].data)).toMatchObject({ user_id: 'owner', reset_token: 'grant', image_frames: ['one', 'two', 'three'] });
  expect(JSON.parse(requests[0].data)).not.toHaveProperty('created_by');
});

test('liveness also uses the backend without exposing the internal key', async () => {
  respond({ live: true, reason: 'LIVE_OK' });
  await expect(validateFacialLiveness({ imageFrames: ['one', 'two', 'three'], livenessChallenge: 'BLINK' })).resolves.toEqual({ live: true, reason: 'LIVE_OK' });
  expect(requests[0].url).toBe('/api/facial/embeddings/liveness-check');
  expect(requests[0].headers.get('X-API-Key')).toBeUndefined();
});

test('learner lifecycle is persisted using existing user management without changing identity or role', async () => {
  respond({ documentNumber: '12345678', firstName: 'Test', lastName: 'Learner', email: 'test@example.invalid', role: 'APPRENTICE' });
  await setLearnerAccountState('learner-id', false);
  expect(requests.map(request => request.method)).toEqual(['get', 'put']);
  expect(JSON.parse(requests[1].data)).toEqual({ numberDocument: '12345678', firstName: 'Test', lastName: 'Learner', email: 'test@example.invalid', role: 'APPRENTICE', accountStatus: 'INACTIVE' });
});
