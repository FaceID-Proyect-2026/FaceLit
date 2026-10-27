import { CsvRowResult } from '@/features/academic/types';
import { Colors } from '@/shared/constants/colors';

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const MAX_FILE_LABEL = '20 MB';

export function catColor(cat: CsvRowResult['category']) {
  return { created: Colors.success, updated: Colors.info, blocked: Colors.warning, error: Colors.error }[cat];
}

export function catIcon(cat: CsvRowResult['category']) {
  return { created: 'checkmark-circle', updated: 'refresh-circle', blocked: 'warning', error: 'close-circle' }[cat];
}

export function catLabel(cat: CsvRowResult['category'], t: (k: string) => string) {
  return { created: t('academic.csvV4Created'), updated: t('academic.csvV4Updated'), blocked: t('academic.csvV4Blocked'), error: t('academic.csvV4Errors') }[cat];
}

export function translateCsvType(type: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    programa: 'academic.csvV4TypeProgram',
    ficha: 'academic.csvV4TypeFicha',
    aprendiz: 'academic.csvV4TypeLearner',
    instructor: 'academic.csvV4TypeInstructor',
  };
  return keys[type] ? t(keys[type]) : type;
}

export function resultCategoryLabel(cat: CsvRowResult['category'], t: (key: string) => string) {
  return {
    created: t('academic.csvV4Created'),
    updated: t('academic.csvV4Updated'),
    blocked: t('academic.csvV4Blocked'),
    error: t('academic.csvV4Errors'),
  }[cat];
}
