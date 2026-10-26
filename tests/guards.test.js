import { renderHook } from '@testing-library/react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useAuthGuard } from '@/shared/hooks/useAuthGuard';
import { useRoleGuard } from '@/shared/hooks/useRoleGuard';
import { logBlocked } from '@/shared/services/auditLogger';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, useRootNavigationState: jest.fn() }));
jest.mock('@/shared/services/auditLogger', () => ({ logBlocked: jest.fn() }));

beforeEach(() => { useRootNavigationState.mockReturnValue({ key: 'ready' }); });

test('waits for navigation and session restoration before redirecting', async () => {
  useRootNavigationState.mockReturnValue(undefined);
  const view = await renderHook(({ loading }) => useAuthGuard(false, '/auth/login', loading), {
    initialProps: { loading: true },
  });
  expect(view.result.current.canRenderContent).toBe(false);
  expect(router.replace).not.toHaveBeenCalled();
  useRootNavigationState.mockReturnValue({ key: 'ready' });
  await view.rerender({ loading: true });
  expect(router.replace).not.toHaveBeenCalled();
  await view.rerender({ loading: false });
  expect(router.replace).toHaveBeenCalledWith('/auth/login');
});

test('hides protected content when the session is lost after login', async () => {
  const view = await renderHook(({ authenticated }) => useAuthGuard(authenticated), {
    initialProps: { authenticated: true },
  });
  expect(view.result.current.canRenderContent).toBe(true);
  await view.rerender({ authenticated: false });
  expect(view.result.current.canRenderContent).toBe(false);
  expect(router.replace).toHaveBeenCalledWith('/auth/login');
});

const roles = ['APPRENTICE', 'INSTRUCTOR', 'COORDINATOR', 'ADMINISTRATOR', 'COORDINATOR_REGISTER'];
const areas = [
  { area: 'apprentice', allowedRoles: ['APPRENTICE'] },
  { area: 'instructor', allowedRoles: ['INSTRUCTOR'] },
  { area: 'admin', allowedRoles: ['COORDINATOR', 'ADMINISTRATOR'] },
];
const home = {
  APPRENTICE: '/apprentice', INSTRUCTOR: '/instructor', COORDINATOR: '/admin',
  ADMINISTRATOR: '/admin', COORDINATOR_REGISTER: '/auth/login',
};

describe.each(areas)('role guard contract for $area', ({ allowedRoles }) => {
  test.each(roles)('allows or rejects %s without rendering forbidden content', async role => {
    const { result } = await renderHook(() => useRoleGuard({ isAuthenticated: true, role, allowedRoles }));
    const allowed = allowedRoles.includes(role);
    expect(result.current.canRenderContent).toBe(allowed);
    if (allowed) {
      expect(router.replace).not.toHaveBeenCalled();
      expect(logBlocked).not.toHaveBeenCalled();
    } else {
      expect(router.replace).toHaveBeenCalledWith(home[role]);
      expect(logBlocked).toHaveBeenCalledWith('UNAUTHORIZED_ACCESS_ATTEMPT', expect.objectContaining({ userRole: role }));
    }
  });

  test.each([false, true])('denies missing role with authentication=%s', async isAuthenticated => {
    const { result } = await renderHook(() => useRoleGuard({ isAuthenticated, role: null, allowedRoles }));
    expect(result.current.canRenderContent).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/auth/login');
  });
});

test('role guard hides content until navigation is ready', async () => {
  useRootNavigationState.mockReturnValue(undefined);
  const { result } = await renderHook(() => useRoleGuard({
    isAuthenticated: true, role: 'APPRENTICE', allowedRoles: ['APPRENTICE'],
  }));
  expect(result.current.canRenderContent).toBe(false);
  expect(router.replace).not.toHaveBeenCalled();
});
