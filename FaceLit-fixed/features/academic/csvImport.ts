// ─────────────────────────────────────────────
//  features/academic/csvImport.ts
//  Parseo del listado institucional (CSV) descrito en RF-3.3.
//  Columnas mínimas esperadas: documento, nombre, apellido, ficha.
//  Se aceptan variantes de encabezado (numero_documento, apellidos, etc.)
//  porque los archivos reales que entrega la institución no siempre usan
//  exactamente esos nombres.
//
//  Este módulo es puramente de datos (sin React / RN) para poder
//  reutilizarlo y probarlo fácil, y para no tocar el store ni las
//  pantallas ya funcionales.
// ─────────────────────────────────────────────

export interface InstitutionalCsvRow {
  document: string;
  name: string;
  lastname: string;
  fichaCode: string; // valor crudo de la columna "ficha" (puede ser número de ficha o código)
  rowIndex: number; // número de línea dentro del archivo (para reportar errores)
}

export interface ParseCsvResult {
  rows: InstitutionalCsvRow[];
  error?: string; // error de estructura (encabezados / columnas obligatorias faltantes)
  invalidRows: number; // filas con documento/nombre/apellido vacío, descartadas
}

// Normaliza texto para comparar: sin espacios extra, sin distinción de
// mayúsculas/minúsculas, tal como pide el RF-3.3.
export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Normaliza un documento: solo dígitos, sin puntos ni espacios.
export function normalizeDocument(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, '').trim();
}

// Parser de una línea CSV que respeta comillas y comas dentro de comillas.
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

const HEADER_ALIASES = {
  document: ['documento', 'numero_documento', 'numerodocumento', 'document', 'identificacion', 'no. documento', 'cedula'],
  name: ['nombre', 'nombres', 'name'],
  lastname: ['apellido', 'apellidos', 'lastname', 'last name'],
  ficha: ['ficha', 'codigo_ficha', 'codigoficha', 'ficha_code', 'fichacode', 'numero_ficha', 'numeroficha'],
};

export function parseInstitutionalCsv(csvText: string): ParseCsvResult {
  // Quita el BOM (\uFEFF) que suelen incluir los CSV exportados de Excel.
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], invalidRows: 0, error: 'academic.csvEmpty' };
  }
  const headers = parseCsvLine(lines[0]).map(h => normalizeText(h));
  const findColumn = (aliases: string[]) => headers.findIndex(header => aliases.includes(header));

  const documentIdx = findColumn(HEADER_ALIASES.document);
  const nameIdx = findColumn(HEADER_ALIASES.name);
  const lastnameIdx = findColumn(HEADER_ALIASES.lastname);
  const fichaIdx = findColumn(HEADER_ALIASES.ficha);

  if (documentIdx < 0 || nameIdx < 0 || lastnameIdx < 0) {
    return { rows: [], invalidRows: 0, error: 'academic.csvMissingColumns' };
  }

  const rows: InstitutionalCsvRow[] = [];
  let invalidRows = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const document = normalizeDocument(values[documentIdx] ?? '');
    const name = (values[nameIdx] ?? '').trim();
    const lastname = (values[lastnameIdx] ?? '').trim();
    const fichaCode = fichaIdx >= 0 ? (values[fichaIdx] ?? '').trim() : '';
    if (!document || !name || !lastname) {
      invalidRows += 1;
      continue;
    }
    rows.push({ document, name, lastname, fichaCode, rowIndex: i + 1 });
  }

  return { rows, invalidRows };
}
