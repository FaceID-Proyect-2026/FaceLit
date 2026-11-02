import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import LoginRoute from '@/app/auth/login';

const mockSubmit = jest.fn();
const mockDocument = jest.fn();
const mockField = jest.fn();
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: key => key }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useRouter: () => ({ back: jest.fn() }) }));
jest.mock('@/shared/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, theme: { primary: '#008000', border: '#dddddd' } }),
}));
jest.mock('@/shared/hooks/useAppDialog', () => ({ useAppDialog: () => ({ alert: jest.fn(), DialogUI: null }) }));
jest.mock('@/features/auth/components/PrivacyNoticeModal', () => () => null);
jest.mock('@/features/auth/components/LoginTransitionOverlay', () => () => null);
jest.mock('@/features/auth/hooks/useLoginForm', () => ({
  useLoginForm: () => ({
    form: { document: '', password: '', accepted: true }, errors: {},
    loading: false, alreadyAccepted: true, privacyStatusKnown: true, privacyChecking: false,
    setField: mockField, setDocumentField: mockDocument, handleSubmit: mockSubmit,
  }),
}));

test('the login route still sends document, password and submit to the existing form hook', async () => {
  await render(<LoginRoute />);
  await fireEvent.changeText(screen.getByLabelText('login.document'), '12345678');
  await fireEvent.changeText(screen.getByLabelText('login.password'), 'synthetic-password');
  await fireEvent.press(screen.getByText('login.loginBtn'));
  expect(mockDocument).toHaveBeenCalledWith('12345678');
  expect(mockField).toHaveBeenCalledWith('password', 'synthetic-password');
  expect(mockSubmit).toHaveBeenCalledTimes(1);
});
