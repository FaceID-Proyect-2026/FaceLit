import { fetchNotifications } from '@/shared/services/notificationService';
import { getNotificationsSnapshot, setNotificationsOwner, loadNotifications } from '@/features/notifications/notificationsStore';

jest.mock('@/shared/services/notificationService', () => ({
  fetchNotifications: jest.fn(), markAllNotificationsReadRemote: jest.fn(),
  markNotificationReadRemote: jest.fn(), resolveFacialNotificationRemote: jest.fn(),
}));
beforeEach(() => { setNotificationsOwner(''); });

test('initial inbox has no demonstration notifications', () => {
  expect(getNotificationsSnapshot()).toEqual([]);
});

test('remote inbox is restricted to its current owner', async () => {
  setNotificationsOwner('a');
  fetchNotifications.mockResolvedValue([{ id: 'one', recipientUserId: 'a' }, { id: 'other', recipientUserId: 'b' }]);
  await loadNotifications();
  expect(getNotificationsSnapshot().map(n => n.id)).toEqual(['one']);
});

test('an old account response cannot overwrite the next account inbox', async () => {
  let finish;
  setNotificationsOwner('a');
  fetchNotifications.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const old = loadNotifications();
  setNotificationsOwner('b');
  fetchNotifications.mockResolvedValueOnce([{ id: 'new', recipientUserId: 'b' }]);
  await loadNotifications();
  finish([{ id: 'old', recipientUserId: 'a' }]);
  await old;
  expect(getNotificationsSnapshot().map(n => n.id)).toEqual(['new']);
  setNotificationsOwner('');
  expect(getNotificationsSnapshot()).toEqual([]);
});
