import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import NotificationDetail from '@/features/notifications/components/NotificationDetail';
import { router } from 'expo-router';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: key => key, i18n: { language: 'es' } }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/shared/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, theme: { primary: '#008000', border: '#dddddd' } }),
}));
const request = { id: 'request-1', category: 'facial', type: 'facial_reregister_request', channel: 'app',
  title: '', message: '', date: '2026-11-02', time: '12:00', read: false, meta: {} };

test('a coordinator can still accept the same facial request from its extracted detail', async () => {
  const decide = jest.fn().mockResolvedValue(undefined);
  await render(<NotificationDetail notif={request} isApprentice={false} isCoordinator resolvingId={null}
    decisionError={null} handleFacialDecision={decide} />);
  await fireEvent.press(screen.getByText('notifications.detail.accept'));
  expect(decide).toHaveBeenCalledWith('request-1', 'accepted');
});

test('an apprentice has no coordinator actions and keeps the authorized facial navigation', async () => {
  const decide = jest.fn();
  await render(<NotificationDetail notif={{ ...request, type: 'facial_authorization_expired' }}
    isApprentice isCoordinator={false} resolvingId={null} decisionError={null} handleFacialDecision={decide} />);
  expect(screen.queryByText('notifications.detail.accept')).toBeNull();
  await fireEvent.press(screen.getByText('notifications.templates.resetUi.openFacial'));
  expect(router.push).toHaveBeenCalledWith('/apprentice/facial');
  expect(decide).not.toHaveBeenCalled();
});
