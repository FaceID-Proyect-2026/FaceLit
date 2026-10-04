import { api } from './api';

let pendingConfigurationUpdate = Promise.resolve();

export const getUserConfiguration = async () => {
  const { data } = await api.get('/api/profile/configuration');
  return data;
};

export const createUserConfiguration = async (payload) => {
  const { data } = await api.post('/api/profile/configuration', payload);
  return data;
};

export const updateUserConfiguration = async (payload) => {
  const { data } = await api.put('/api/profile/configuration', payload);
  return data;
};

export const persistUserConfigurationPreferences = (language, darkMode) => {
  const persist = async () => {
    try {
      await getUserConfiguration();
    } catch (error) {
      if (error.response?.status !== 404) throw error;

      return createUserConfiguration({
        language: language.toUpperCase(),
        darkMode,
        notificationsActive: true,
      });
    }

    return updateUserConfiguration({
      language: language.toUpperCase(),
      darkMode,
      notificationsActive: true,
    });
  };

  const update = pendingConfigurationUpdate.then(persist, persist);
  pendingConfigurationUpdate = update.then(() => undefined, () => undefined);
  return update;
};