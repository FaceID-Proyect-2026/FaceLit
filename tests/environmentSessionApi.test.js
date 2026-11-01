import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/shared/services/api';
import { createEnvironmentSession, fetchCurrentActiveEnvironmentSession } from '@/features/environments/environmentSessionApi';

jest.mock('@/shared/services/api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));

test('uses the same stored device and returns the persisted session from the backend', async () => {
  AsyncStorage.getItem.mockResolvedValue('same-camera');
  const saved = { idRecordEnvironment: 'server-id', idChip: 'chip', environmentName: '209-02' };
  api.post.mockResolvedValue({ data: saved });
  expect(await createEnvironmentSession({ idChip: 'chip', idEnvironment: 'room' })).toBe(saved);
  expect(api.post).toHaveBeenCalledWith('/api/environment/sessions', { idChip: 'chip', idEnvironment: 'room', deviceCode: 'same-camera' });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

test('restores current server data without cache and distinguishes no active session from connection errors', async () => {
  const saved = { idRecordEnvironment: 'server-id', idChip: 'chip', environmentName: '209-02' };
  api.get.mockResolvedValueOnce({ status: 200, data: saved }).mockResolvedValueOnce({ status: 204, data: '' })
    .mockRejectedValueOnce(new Error('offline'));
  expect(await fetchCurrentActiveEnvironmentSession()).toBe(saved);
  expect(api.get).toHaveBeenCalledWith('/api/environment/sessions/active', expect.objectContaining({ headers: { 'Cache-Control': 'no-cache' } }));
  expect(await fetchCurrentActiveEnvironmentSession()).toBeNull();
  await expect(fetchCurrentActiveEnvironmentSession()).rejects.toThrow('offline');
});
