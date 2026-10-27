import { formatDateTime, getBogotaDateTimeParts, wasEditedRecently } from '@/shared/utils/dates';
import { fetchNotifications } from '@/shared/services/notificationService';
import { pushNotification, setNotificationsOwner } from '@/features/notifications/notificationsStore';
import { api } from '@/shared/services/api';
import { hydrateAcademicStore, getFichasSnapshot, updateLearnerInfoStore } from '@/features/academic/academicStore';

jest.mock('@/shared/services/api', () => ({ api: { get: jest.fn(), patch: jest.fn() } }));
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-26T02:15:30Z'));
  setNotificationsOwner('date-test-owner');
});
afterEach(() => { jest.useRealTimers(); });

test.each([
  ['2026-10-26T02:15:30Z', '2026-10-25', '21:15'],
  ['2026-01-01T03:00:00Z', '2025-12-31', '22:00'],
  ['2026-10-26T05:00:00Z', '2026-10-26', '00:00'],
  ['2026-10-25T21:15:30-05:00', '2026-10-25', '21:15'],
])('formats instant %s in Colombia without shifting it twice', (instant, date, time) => {
  expect(getBogotaDateTimeParts(instant)).toEqual({ date, time });
});

test('academic timestamps use Bogota rather than the device timezone', () => {
  expect(formatDateTime('2026-10-26T02:15:30Z')).toContain('21:15:30');
  expect(formatDateTime(null)).toBe('Sin registro');
  expect(formatDateTime('not-a-date', '—')).toBe('—');
});

test('equivalent offsets do not mark a record as edited', () => {
  expect(wasEditedRecently('2026-10-26T02:15:30Z', '2026-10-25T21:15:30-05:00')).toBe(false);
  expect(wasEditedRecently('2026-10-26T01:15:30Z', '2026-10-26T02:15:30Z')).toBe(true);
});

const notification = {
  id: 'n-date', recipientUserId: 'date-test-owner', type: 'user_profile_updated', category: 'SEGURIDAD',
  channel: 'APP', title: 'Actualización', message: 'Cambios guardados', read: false,
};
test('remote notifications preserve the instant and show Colombia date and clock', async () => {
  api.get.mockResolvedValue({ data: [{ ...notification, createdAt: '2026-10-26T02:15:30Z' }] });
  expect(await fetchNotifications()).toEqual([expect.objectContaining({
    createdAt: '2026-10-26T02:15:30.000Z', date: '2026-10-25', time: '21:15',
  })]);
});

test('invalid remote dates are not replaced with a fictional current timestamp', async () => {
  api.get.mockResolvedValue({ data: [{ ...notification, createdAt: 'invalid' }] });
  expect(await fetchNotifications()).toEqual([expect.objectContaining({ createdAt: undefined, date: '', time: '' })]);
});

test('local notification date and clock refer to the same Bogota instant', () => {
  expect(pushNotification('user_profile_updated', 'Actualización', 'Cambios guardados')).toMatchObject({
    createdAt: '2026-10-26T02:15:30.000Z', date: '2026-10-25', time: '21:15',
  });
});

test('a learner update keeps the server audit and does not forge a ficha modification time', () => {
  const created = '2026-10-20T15:00:00Z';
  const serverEdit = '2026-10-26T01:05:00Z';
  hydrateAcademicStore({ programs: [], instructors: [], fichas: [{
    id: 'ficha-date-test', createdAt: created, updatedAt: created,
    learners: [{ id: 'learner-date-test', name: 'Ana', lastname: 'Lopez', document: '12345678',
      email: 'ana@example.invalid', createdAt: created, updatedAt: created }],
  }] });
  updateLearnerInfoStore('ficha-date-test', 'learner-date-test', { name: 'Andrea', updatedAt: serverEdit });
  const ficha = getFichasSnapshot()[0];
  expect(ficha.updatedAt).toBe(created);
  expect(ficha.learners[0]).toMatchObject({ name: 'Andrea', createdAt: created, updatedAt: serverEdit });
});
