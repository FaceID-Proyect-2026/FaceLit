import { normalizeText, normalizeDocument, parseCsvLine } from './academicCsvParser';

export interface InstitutionalCsvRow {
  document: string;
  name: string;
  lastname: string;
  fichaCode: string;
  rowIndex: number;
}

export interface ParseCsvResult {
  rows: InstitutionalCsvRow[];
  error?: string;
  invalidRows: number;
}

export const LEGACY_HEADER_ALIASES = {
  document: ['documento', 'numero_documento', 'numerodocumento', 'document', 'identificacion', 'no. documento', 'cedula'],
  name:     ['nombre', 'nombres', 'name'],
  lastname: ['apellido', 'apellidos', 'lastname', 'last name'],
  ficha:    ['ficha', 'codigo_ficha', 'codigoficha', 'ficha_code', 'fichacode', 'numero_ficha', 'numeroficha'],
};

export function parseInstitutionalCsv(csvText: string): ParseCsvResult {
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], invalidRows: 0, error: 'academic.csvEmpty' };

  const headers = parseCsvLine(lines[0]).map(h => normalizeText(h));
  const findIdx = (aliases: string[]) => headers.findIndex(h => aliases.includes(h));

  const documentIdx = findIdx(LEGACY_HEADER_ALIASES.document);
  const nameIdx     = findIdx(LEGACY_HEADER_ALIASES.name);
  const lastnameIdx = findIdx(LEGACY_HEADER_ALIASES.lastname);
  const fichaIdx    = findIdx(LEGACY_HEADER_ALIASES.ficha);

  if (documentIdx < 0 || nameIdx < 0 || lastnameIdx < 0) {
    return { rows: [], invalidRows: 0, error: 'academic.csvMissingColumns' };
  }

  const rows: InstitutionalCsvRow[] = [];
  let invalidRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const doc      = normalizeDocument(values[documentIdx] ?? '');
    const name     = (values[nameIdx] ?? '').trim();
    const lastname = (values[lastnameIdx] ?? '').trim();
    const fichaCode = fichaIdx >= 0 ? (values[fichaIdx] ?? '').trim() : '';
    if (!doc || !name || !lastname) { invalidRows++; continue; }
    rows.push({ document: doc, name, lastname, fichaCode, rowIndex: i + 1 });
  }

  return { rows, invalidRows };
}
