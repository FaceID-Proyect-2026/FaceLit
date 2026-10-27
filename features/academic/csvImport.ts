// Stable CSV API: parsing, preview decisions and legacy format adapters are separate.

export { normalizeText, normalizeDocument, normalizeProgramCode, parseAcademicCsvV4 } from './csv/academicCsvParser';

export type { ParsedCsvRow, ParseCsvV4Result } from './csv/academicCsvParser';

export { processAcademicCsvV4 } from './csv/academicCsvPreview';

export type { StoreSnapshots } from './csv/academicCsvPreview';

export { parseInstitutionalCsv } from './csv/institutionalCsvParser';

export type { InstitutionalCsvRow, ParseCsvResult } from './csv/institutionalCsvParser';

export const CSV_TEMPLATE = [
  'tipo,documento,nombre,apellido,correo,programa_codigo,ficha_codigo,instructor_tipo',
  'programa,,,,,ADSO,,',
  'ficha,,,,,ADSO,2825551,',
  'ficha,,,,,ADSO,2825552,',
  'aprendiz,1002345678,Juan,Pérez,juan.perez@correo.com,,2825551,',
  'instructor,1029384756,Laura,Gómez,laura.gomez@correo.com,ADSO,2825551,especifico',
  'instructor,1050607080,Carlos,Ruiz,carlos.ruiz@correo.com,,,transversal',
].join('\n');
