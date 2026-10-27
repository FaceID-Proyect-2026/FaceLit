import React from 'react';
import { render, screen } from '@testing-library/react-native';
import FaceGuideOverlay from '@/features/auth/components/FaceGuideOverlay';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, fallback) => fallback || key }) }));

test('shows processing instead of stale no-face or action instructions while awaiting validation', async () => {
  const view = await render(<FaceGuideOverlay primaryColor="#008000" screenState="ready"
    isPositioning={false} quality="checking" requiresLiveness livenessCaptureActive
    liveWarning="noSkin" isProcessing />);
  expect(screen.getByText('Validando… Relaja el rostro.')).toBeTruthy();
  expect(screen.queryByText(/No se detecta ningún rostro/)).toBeNull();
  expect(screen.queryByText(/Realiza ahora/)).toBeNull();
  await view.rerender(<FaceGuideOverlay primaryColor="#008000" screenState="ready"
    isPositioning={false} quality="checking" requiresLiveness liveWarning="noSkin" />);
  expect(screen.queryByText(/Validando/)).toBeNull();
  expect(screen.getByText('No se detecta ningún rostro')).toBeTruthy();
});
