import React from 'react';
import { render, screen } from '@testing-library/react-native';
import FaceGuideOverlay from '@/features/auth/components/FaceGuideOverlay';
import { LIVENESS_CHALLENGES, formatLivenessStep } from '@/features/facial/livenessChallenges';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, fallback) => fallback || key }) }));

test.each(LIVENESS_CHALLENGES)('separates preparation, action and processing for $code', async challenge => {
  const instruction = formatLivenessStep(challenge, 0);
  const props = { primaryColor: '#008000', screenState: 'ready', isPositioning: false,
    quality: 'good', requiresLiveness: true, liveWarning: 'none', livenessInstruction: instruction };
  const view = await render(<FaceGuideOverlay {...props} />);
  expect(screen.getByText('Prepárate con el rostro relajado. Espera a que aparezca «Hazlo ahora».')).toBeTruthy();
  expect(screen.queryByText(`${instruction}. Hazlo ahora.`)).toBeNull();
  await view.rerender(<FaceGuideOverlay {...props} livenessCaptureActive />);
  expect(screen.getByText(`${instruction}. Hazlo ahora.`)).toBeTruthy();
  await view.rerender(<FaceGuideOverlay {...props} livenessCaptureActive isProcessing />);
  expect(screen.getByText('Captura terminada. Validando el reto…')).toBeTruthy();
  expect(screen.queryByText(`${instruction}. Hazlo ahora.`)).toBeNull();
});

test('shows processing instead of stale no-face or action instructions while awaiting validation', async () => {
  const view = await render(<FaceGuideOverlay primaryColor="#008000" screenState="ready"
    isPositioning={false} quality="checking" requiresLiveness livenessCaptureActive
    liveWarning="noSkin" isProcessing />);
  expect(screen.getByText('Captura terminada. Validando el reto…')).toBeTruthy();
  expect(screen.queryByText(/No se detecta ningún rostro/)).toBeNull();
  expect(screen.queryByText(/Realiza ahora/)).toBeNull();
  await view.rerender(<FaceGuideOverlay primaryColor="#008000" screenState="ready"
    isPositioning={false} quality="checking" requiresLiveness liveWarning="noSkin" />);
  expect(screen.queryByText(/Validando/)).toBeNull();
  expect(screen.getByText('No se detecta ningún rostro')).toBeTruthy();
});
