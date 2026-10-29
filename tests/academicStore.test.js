import {
  addLearnerStore,
  clearAcademicStore,
  getAcademicMetaSnapshot,
  getFichasSnapshot,
  getProgramsSnapshot,
  getOrphanLearnersSnapshot,
  hydrateAcademicStore,
  joinFichaByCodeStore,
  moveLearnerToOrphanPoolStore,
  registerFicha,
  setAcademicStoreError,
  setAcademicStoreLoading,
  subscribe,
  updateProgramStore,
} from '@/features/academic/academicStore';

jest.mock('@/features/notifications/notificationsStore', () => ({ pushNotification: jest.fn() }));

beforeEach(() => {
  clearAcademicStore();
  hydrateAcademicStore({
    programs: [{ id: 'program', name: 'Original', status: 'active', fichas: [], instructorIds: [] }],
    fichas: [],
    instructors: [],
  });
});

test('program and group modules share one state and one subscription lifecycle', () => {
  const changed = jest.fn();
  const unsubscribe = subscribe(changed);
  const group = registerFicha('1234567', 'program');
  expect(getFichasSnapshot()[0].id).toBe(group.id);
  expect(getProgramsSnapshot()[0].fichas).toEqual([group.id]);
  updateProgramStore('program', 'Updated', 'active');
  expect(getProgramsSnapshot()[0].name).toBe('Updated');
  expect(changed).toHaveBeenCalledTimes(2);
  unsubscribe();
  updateProgramStore('program', 'Final', 'active');
  expect(changed).toHaveBeenCalledTimes(2);
});

test('learner operations retain orphan-pool membership across module boundaries', () => {
  const first = registerFicha('1234567', 'program');
  const second = registerFicha('7654321', 'program');
  const learner = { id: 'learner', document: '12345678', name: 'Test Learner', email: 'test@example.invalid', status: 'active' };
  expect(addLearnerStore(first.id, learner).success).toBe(true);
  moveLearnerToOrphanPoolStore(first.id, learner.id);
  expect(getOrphanLearnersSnapshot()).toHaveLength(1);
  expect(joinFichaByCodeStore(learner.id, second.number).success).toBe(true);
  expect(getOrphanLearnersSnapshot()).toHaveLength(0);
  expect(getFichasSnapshot().find(group => group.id === second.id).learners[0].id).toBe(learner.id);
});

test('metadata snapshots remain referentially stable until state changes', () => {
  expect(getAcademicMetaSnapshot()).toBe(getAcademicMetaSnapshot());
  setAcademicStoreLoading(true);
  const loading = getAcademicMetaSnapshot();
  expect(loading).toEqual({ loading: true, loadError: null });
  setAcademicStoreError('unavailable');
  expect(getAcademicMetaSnapshot()).not.toBe(loading);
  expect(getAcademicMetaSnapshot()).toEqual({ loading: false, loadError: 'unavailable' });
});
