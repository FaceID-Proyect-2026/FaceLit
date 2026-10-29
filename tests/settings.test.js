import React, { useEffect } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '@/shared/contexts/ThemeContext';
import { I18nProvider, useLanguage } from '@/shared/contexts/I18nContext';
import { useUserSettings } from '@/features/profile/useUserSettings';
import { getUserConfiguration, createUserConfiguration, updateUserConfiguration } from '@/shared/services/userConfigService';

jest.mock('@/shared/services/userConfigService', () => ({
  getUserConfiguration: jest.fn(), createUserConfiguration: jest.fn(), updateUserConfiguration: jest.fn(),
}));
jest.mock('@/shared/i18n/index', () => ({
  __esModule: true,
  default: { language: 'es', changeLanguage: jest.fn().mockResolvedValue(undefined), on: jest.fn(), off: jest.fn() },
}));

const originalConfig = { language: 'ES', darkMode: false, notificationsActive: true };
function Wrapper({ children }) {
  return <I18nProvider><ThemeProvider>{children}</ThemeProvider></I18nProvider>;
}
function useSettingsScreen() {
  const settings = useUserSettings();
  const theme = useTheme();
  const language = useLanguage();
  // Same loading effect as the settings screen, using the real preference providers.
  useEffect(() => { void settings.loadAndApply(); }, [settings.loadAndApply]);
  return { ...settings, theme, language };
}
beforeEach(() => {
  getUserConfiguration.mockReset().mockResolvedValue(originalConfig);
  createUserConfiguration.mockReset().mockResolvedValue(originalConfig);
  updateUserConfiguration.mockReset().mockImplementation(async payload => payload);
});

test('theme preview stays selected and enables saving without fetching the old settings again', async () => {
  const view = await renderHook(useSettingsScreen, { wrapper: Wrapper });
  const loader = view.result.current.loadAndApply;
  expect(getUserConfiguration).toHaveBeenCalledTimes(1);
  await act(async () => { view.result.current.setDraftTheme(true); });
  expect(view.result.current.theme.isDark).toBe(true);
  expect(view.result.current.draft.darkMode).toBe(true);
  expect(view.result.current.saved).toBe(false);
  expect(view.result.current.loadAndApply).toBe(loader);
  expect(getUserConfiguration).toHaveBeenCalledTimes(1);
  await act(async () => { expect(await view.result.current.saveChanges()).toEqual({ success: true }); });
  expect(updateUserConfiguration).toHaveBeenCalledWith({ language: 'ES', darkMode: true, notificationsActive: true });
  expect(view.result.current.saved).toBe(true);
});

test.each([['es', 'ES'], ['en', 'EN'], ['de', 'DE'], ['fr', 'FR']])('previews and saves language %s using the API contract', async (language, backendCode) => {
  const view = await renderHook(useSettingsScreen, { wrapper: Wrapper });
  await act(async () => { view.result.current.setDraftLanguage(language); });
  expect(view.result.current.language.language).toBe(language);
  expect(view.result.current.draft.language).toBe(language);
  expect(view.result.current.saved).toBe(false);
  expect(getUserConfiguration).toHaveBeenCalledTimes(1);
  await act(async () => { await view.result.current.saveChanges(); });
  expect(updateUserConfiguration).toHaveBeenCalledWith(expect.objectContaining({ language: backendCode }));
});

test('failed save keeps the draft and allows retrying instead of showing Saved', async () => {
  const view = await renderHook(useSettingsScreen, { wrapper: Wrapper });
  await act(async () => { view.result.current.setDraftTheme(true); });
  updateUserConfiguration.mockRejectedValueOnce({ response: { status: 500, data: { message: 'No se pudo guardar' } } });
  await act(async () => {
    expect(await view.result.current.saveChanges()).toEqual({ success: false, error: 'No se pudo guardar' });
  });
  expect(view.result.current.saved).toBe(false);
  expect(view.result.current.saving).toBe(false);
  expect(view.result.current.draft.darkMode).toBe(true);
  await act(async () => { expect((await view.result.current.saveChanges()).success).toBe(true); });
});

test('saved preferences are restored after remounting the screen', async () => {
  let persisted = originalConfig;
  getUserConfiguration.mockImplementation(async () => persisted);
  updateUserConfiguration.mockImplementation(async payload => { persisted = payload; return payload; });
  const first = await renderHook(useSettingsScreen, { wrapper: Wrapper });
  await act(async () => { first.result.current.setDraftTheme(true); first.result.current.setDraftLanguage('fr'); });
  await act(async () => { await first.result.current.saveChanges(); });
  await first.unmount();
  const second = await renderHook(useSettingsScreen, { wrapper: Wrapper });
  expect(second.result.current.draft).toEqual({ darkMode: true, language: 'fr' });
  expect(second.result.current.theme.isDark).toBe(true);
  expect(second.result.current.language.language).toBe('fr');
  expect(second.result.current.saved).toBe(true);
});
