// Stable public store API. State ownership and feature operations are separated below.

export {
  hydrateAcademicStore,
  setAcademicStoreLoading,
  setAcademicStoreError,
  clearAcademicStore,
  subscribe,
  getProgramsSnapshot,
  getFichasSnapshot,
  getInstructorsSnapshot,
  getAcademicMetaSnapshot,
  getProgramById,
  getFichaById,
  getInstructorById,
  generateTransferCode,
  getOrphanLearnersSnapshot
} from './store/academicState';

export {
  registerProgram,
  updateProgramStore,
  deactivateProgramStore,
  reactivateProgramStore,
  deleteProgramStore
} from './store/programsStore';

export {
  registerFicha,
  updateFichaStore,
  regenerateTransferCodeStore,
  deactivateFichaStore,
  reactivateFichaStore,
  deleteFichaStore,
  unlinkFichaFromProgramStore,
  linkFichaToProgramStore
} from './store/fichasStore';

export {
  addLearnerStore,
  deactivateLearnerStore,
  reactivateLearnerStore,
  removeLearnerStore,
  markLearnerValidation,
  updateLearnerInfoStore,
  updateLearnerDocument,
  correctInstitutionalLearnerStore,
  moveLearnerToOrphanPoolStore,
  joinFichaByTransferCodeStore,
  joinFichaByCodeStore,
  deleteOrphanLearnerStore
} from './store/learnersStore';

export {
  registerInstructorStore,
  assignInstructorToFichaStore,
  unassignInstructorFromFichaStore,
  getInstructorsByFichaId,
  updateInstructorStore,
  deactivateInstructorStore,
  reactivateInstructorStore
} from './store/instructorsStore';

export type { OrphanLearner } from './store/academicState';
