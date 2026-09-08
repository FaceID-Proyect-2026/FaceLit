// ─────────────────────────────────────────────
//  features/academic/instructors/csvImportInstructors.ts
//  Carga masiva del catálogo de Instructores (Prompt maestro, sección 23).
//
//  Columnas esperadas: documento, nombre, apellido, tipo (ESPECIFICO |
//  TRANSVERSAL), area (solo si tipo=ESPECIFICO), transversal (solo si
//  tipo=TRANSVERSAL; admite varias separadas por ";" o "|").
//
//  El CSV NO crea horarios — solo instructores y su clasificación
//  (sección 23). La planificación de horarios se hace después, en
//  Gestión de Horarios.
//
//  Reutiliza el parser de líneas y los normalizadores de texto ya
//  probados en csvImport.ts (listado institucional de aprendices), en
//  vez de duplicar esa lógica.
// ─────────────────────────────────────────────
import { normalizeDocument, normalizeText, parseCsvLine } from '../csvImport';
import { Area } from '../areas/types';
import { Transversal } from '../transversals/types';
import { InstructorType } from './types';

export interface InstructorCsvRow {
  document: string;
  name: string;
  lastname: string;
  type: InstructorType;
  areaName?: string;
  transversalNames: string[];
  rowIndex: number;
}

export interface InstructorCsvRowError {
  rowIndex: number;
  reason: string; // clave i18n
}

export interface ParseInstructorsCsvResult {
  rows: InstructorCsvRow[];
  rowErrors: InstructorCsvRowError[];
  structureError?: string; // clave i18n — encabezados/columnas faltantes
  duplicateInFile: number; // filas descartadas por repetir documento dentro del mismo archivo
}

const HEADER_ALIASES = {
  document: ['documento', 'numero_documento', 'numerodocumento', 'document', 'identificacion', 'cedula'],
  name: ['nombre', 'nombres', 'name'],
  lastname: ['apellido', 'apellidos', 'lastname', 'last name'],
  type: ['tipo', 'clasificacion', 'type'],
  area: ['area', 'área'],
  transversal: ['transversal', 'transversales'],
};

function splitTransversalNames(raw: string): string[] {
  return raw.split(/[;|]/).map(v => normalizeText(v)).filter(Boolean);
}

export function parseInstructorsCsv(csvText: string, activeAreas: Area[], activeTransversals: Transversal[]): ParseInstructorsCsvResult {
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], rowErrors: [], duplicateInFile: 0, structureError: 'academic.instructors.csvEmpty' };
  }

  const headers = parseCsvLine(lines[0]).map(h => normalizeText(h));
  const findColumn = (aliases: string[]) => headers.findIndex(header => aliases.includes(header));

  const documentIdx = findColumn(HEADER_ALIASES.document);
  const nameIdx = findColumn(HEADER_ALIASES.name);
  const lastnameIdx = findColumn(HEADER_ALIASES.lastname);
  const typeIdx = findColumn(HEADER_ALIASES.type);
  const areaIdx = findColumn(HEADER_ALIASES.area);
  const transversalIdx = findColumn(HEADER_ALIASES.transversal);

  if (documentIdx < 0 || nameIdx < 0 || lastnameIdx < 0 || typeIdx < 0) {
    return { rows: [], rowErrors: [], duplicateInFile: 0, structureError: 'academic.instructors.csvMissingColumns' };
  }

  const areaNames = new Set(activeAreas.map(a => normalizeText(a.name)));
  const transversalNames = new Set(activeTransversals.map(t => normalizeText(t.name)));

  const rows: InstructorCsvRow[] = [];
  const rowErrors: InstructorCsvRowError[] = [];
  const seenDocuments = new Set<string>();
  let duplicateInFile = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const rowIndex = i + 1;
    const document = normalizeDocument(values[documentIdx] ?? '');
    const name = (values[nameIdx] ?? '').trim();
    const lastname = (values[lastnameIdx] ?? '').trim();
    const typeRaw = normalizeText(values[typeIdx] ?? '').toUpperCase();

    if (!document || !name || !lastname) {
      rowErrors.push({ rowIndex, reason: 'academic.instructors.csvInvalidRow' });
      continue;
    }
    if (typeRaw !== 'ESPECIFICO' && typeRaw !== 'ESPECÍFICO' && typeRaw !== 'TRANSVERSAL') {
      rowErrors.push({ rowIndex, reason: 'academic.instructors.csvInvalidType' });
      continue;
    }
    if (seenDocuments.has(document)) {
      duplicateInFile += 1;
      continue;
    }

    const type: InstructorType = typeRaw.startsWith('ESPEC') ? 'ESPECIFICO' : 'TRANSVERSAL';

    if (type === 'ESPECIFICO') {
      const areaName = areaIdx >= 0 ? (values[areaIdx] ?? '').trim() : '';
      if (!areaName) {
        rowErrors.push({ rowIndex, reason: 'academic.instructors.csvAreaRequired' });
        continue;
      }
      if (!areaNames.has(normalizeText(areaName))) {
        rowErrors.push({ rowIndex, reason: 'academic.instructors.csvAreaNotFound' });
        continue;
      }
      seenDocuments.add(document);
      rows.push({ document, name, lastname, type, areaName, transversalNames: [], rowIndex });
    } else {
      const rawTransversal = transversalIdx >= 0 ? (values[transversalIdx] ?? '').trim() : '';
      const names = splitTransversalNames(rawTransversal);
      if (names.length === 0) {
        rowErrors.push({ rowIndex, reason: 'academic.instructors.csvTransversalRequired' });
        continue;
      }
      const unknown = names.find(n => !transversalNames.has(n));
      if (unknown) {
        rowErrors.push({ rowIndex, reason: 'academic.instructors.csvTransversalNotFound' });
        continue;
      }
      seenDocuments.add(document);
      rows.push({ document, name, lastname, type, transversalNames: names, rowIndex });
    }
  }

  return { rows, rowErrors, duplicateInFile };
}
