import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import RemoteDataState from '@/shared/components/ui/RemoteDataState';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: key => key }) }));
jest.mock('@/shared/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: { primary: '#008000', text: '#000000' } }),
}));

test('renders the attendance loading state without a retry action', async () => {
  await render(<RemoteDataState loading error={false} onRetry={jest.fn()} />);
  expect(screen.getByText('dataState.loading')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

test('renders an accessible error and lets the user retry', async () => {
  const retry = jest.fn();
  await render(<RemoteDataState loading={false} error onRetry={retry} />);
  expect(screen.getByRole('alert')).toHaveTextContent('dataState.error');
  await fireEvent.press(screen.getByRole('button', { name: 'dataState.retry' }));
  expect(retry).toHaveBeenCalledTimes(1);
});

test('removes the error and retry action after successful loading', async () => {
  const view = await render(<RemoteDataState loading={false} error onRetry={jest.fn()} />);
  await view.rerender(<RemoteDataState loading={false} error={false} onRetry={jest.fn()} />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByText('dataState.error')).toBeNull();
});
