// ─────────────────────────────────────────────
//  features/academic/csvImport.ts
//
//  RF-3.1 / RF-3.1.1 V4 — Parser y validador del CSV académico
//  Columnas: tipo, documento, nombre, apellido, correo,
//            programa_codigo, ficha_codigo, instructor_tipo
//
//  Reglas completas según RF-3 V4 Parte B §1-8.
//  Este módulo es puramente de datos (sin React/RN) para
//  poder reutilizarlo y probarlo sin montar pantallas.
// ─────────────────────────────────────────────

import { CsvImportSummaryV4 } from './types';

// ── Constantes RF-3 V4 §1-8 ──────────────────
const MAX_FILE_ROWS = 5000;     // §1
const VALID_TIPOS = ['programa', 'ficha', 'aprendiz', 'instructor'] as const;
type TipoValue = typeof VALID_TIPOS[number];

// ── Utilidades ────────────────────────────────

/** Normaliza texto: trim + colapsa espacios + lowercase */
export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Normaliza documento: solo dígitos */
export function normalizeDocument(value: string): string {
  return value.replace(/[^0-9]/g, '').trim();
}

/** Normaliza código de programa: trim + uppercase */
export function normalizeProgramCode(value: string): string {
  return value.trim().toUpperCase();
}

/** Valida documento: exactamente 10 dígitos numéricos (RF-1 V4 §1 / RF-3 V4 §3) */
function isValidDocument(doc: string): boolean {
  return /^\d{10}$/.test(doc);
}

/** Valida correo: formato estándar (RF-3 V4 §5) */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valida código de programa: letras y números, 2-15 chars (RF-3 V4 §6) */
function isValidProgramCode(code: string): boolean {
  return /^[A-Z0-9]{2,15}$/.test(code);
}

/** Valida código de ficha: exactamente 7 dígitos (RF-3 V4 §7) */
function isValidFichaCode(code: string): boolean {
  return /^\d{7}$/.test(code);
}

/** Valida nombre/apellido: letras + espacios, 2-60 chars (RF-3 V4 §4) */
function isValidName(name: string): boolean {
  if (name.length < 2 || name.length > 60) return false;
  return /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(name);
}

// ── Parser de línea CSV ───────────────────────
// Respeta comillas y comas dentro de comillas.
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') { value += '"'; i++; }
    else if (ch === '"') { quoted = !quoted; }
    else if (ch === ',' && !quoted) { values.push(value.trim()); value = ''; }
    else { value += ch; }
  }
  values.push(value.trim());
  return values;
}

// ── Alias de encabezados aceptados ───────────
const HEADER_ALIASES: Record<string, string[]> = {
  tipo:              ['tipo', 'type'],
  documento:         ['documento', 'document', 'numerodocumento', 'numero_documento', 'cedula'],
  nombre:            ['nombre', 'nombre', 'nombres', 'name'],
  apellido:          ['apellido', 'apellidos', 'lastname', 'last name'],
  correo:            ['correo', 'email', 'correo electronico', 'correo electrónico'],
  programa_codigo:   ['programa_codigo', 'program_code', 'programa', 'codigo_programa'],
  ficha_codigo:      ['ficha_codigo', 'ficha_code', 'ficha', 'codigo_ficha', 'numero_ficha'],
  instructor_tipo:   ['instructor_tipo', 'instructor_type', 'tipo_instructor'],
};

function findColumn(headers: string[], aliases: string[]): number {
  return headers.findIndex(h => aliases.includes(h));
}

// ── Resultado parcial de una fila procesada ───
export interface ParsedCsvRow {
  rowIndex: number;
  tipo: TipoValue;
  // Campos presentes según el tipo
  documento?: string;
  nombre?: string;
  apellido?: string;
  correo?: string;
  programaCodigo?: string;
  fichaCodigo?: string;
  instructorTipo?: 'especifico' | 'transversal';
  // Errores de formato detectados en esta fila
  errors: string[];        // mensajes listos para mostrar al Coordinador
  warnings: string[];      // advertencias no bloqueantes
}

export interface ParseCsvV4Result {
  /** Error estructural del archivo (sin columna tipo, vacío, etc.) */
  fileError?: string;
  rows: ParsedCsvRow[];
  totalRows: number;
  invalidRows: number;     // filas con tipo desconocido o error estructural grave
}

// ─────────────────────────────────────────────
//  FUNCIÓN PRINCIPAL: parseAcademicCsvV4
//  Lee y valida el archivo CSV según RF-3 V4 §1-8.
//  No accede al store — solo valida formato.
//  La resolución de referencias (¿existe el programa?) la hace
//  processAcademicCsvV4 que recibe snapshots del store.
// ─────────────────────────────────────────────
export function parseAcademicCsvV4(csvText: string): ParseCsvV4Result {
  // §1 — quitar BOM
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);

  // §1 — archivo vacío
  if (lines.length === 0) {
    return { fileError: 'academic.csvV4FileEmpty', rows: [], totalRows: 0, invalidRows: 0 };
  }

  // Parsear encabezados (normalizar a minúscula)
  const rawHeaders = parseCsvLine(lines[0]).map(h => normalizeText(h));

  // §1 — columna `tipo` obligatoria
  const tipoIdx = findColumn(rawHeaders, HEADER_ALIASES.tipo);
  if (tipoIdx < 0) {
    return { fileError: 'academic.csvV4MissingTipo', rows: [], totalRows: 0, invalidRows: 0 };
  }

  // §1 — archivo sin filas de datos
  if (lines.length < 2) {
    return { fileError: 'academic.csvV4NoDataRows', rows: [], totalRows: 0, invalidRows: 0 };
  }

  // §1 — demasiadas filas
  if (lines.length - 1 > MAX_FILE_ROWS) {
    return {
      fileError: `academic.csvV4TooManyRows`,
      rows: [], totalRows: lines.length - 1, invalidRows: 0,
    };
  }

  const docIdx       = findColumn(rawHeaders, HEADER_ALIASES.documento);
  const nombreIdx    = findColumn(rawHeaders, HEADER_ALIASES.nombre);
  const apellidoIdx  = findColumn(rawHeaders, HEADER_ALIASES.apellido);
  const correoIdx    = findColumn(rawHeaders, HEADER_ALIASES.correo);
  const progIdx      = findColumn(rawHeaders, HEADER_ALIASES.programa_codigo);
  const fichaIdx     = findColumn(rawHeaders, HEADER_ALIASES.ficha_codigo);
  const instTipoIdx  = findColumn(rawHeaders, HEADER_ALIASES.instructor_tipo);

  const rows: ParsedCsvRow[] = [];
  let invalidRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1; // número de línea para mensajes (header = 1)
    const values = parseCsvLine(lines[i]);
    const get = (idx: number) => (idx >= 0 ? (values[idx] ?? '').trim() : '');

    // §2 — columna tipo obligatoria en toda fila
    const rawTipo = get(tipoIdx);
    if (!rawTipo) {
      invalidRows++;
      rows.push({
        rowIndex: rowNum, tipo: 'aprendiz' as TipoValue,
        errors: [`La columna 'tipo' no puede estar vacía en la fila ${rowNum}.`],
        warnings: [],
      });
      continue;
    }

    // §2 — normalizar tipo a minúscula antes de comparar
    const normalizedTipo = rawTipo.toLowerCase().trim() as TipoValue;
    if (!(VALID_TIPOS as readonly string[]).includes(normalizedTipo)) {
      invalidRows++;
      rows.push({
        rowIndex: rowNum, tipo: normalizedTipo as TipoValue,
        errors: [
          `Tipo de fila no reconocido en la fila ${rowNum}: '${rawTipo}'. ` +
          `Debe ser 'programa', 'ficha', 'aprendiz' o 'instructor'.`,
        ],
        warnings: [],
      });
      continue;
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const row: ParsedCsvRow = { rowIndex: rowNum, tipo: normalizedTipo, errors, warnings };

    if (normalizedTipo === 'programa') {
      // §6 — programa_codigo obligatorio
      const code = normalizeProgramCode(get(progIdx));
      if (!code) {
        errors.push(`El código de programa es obligatorio en la fila ${rowNum}.`);
      } else if (!/^[A-Z0-9\s]*$/.test(code.replace(/\s/g, ''))) {
        errors.push(`El código de programa de la fila ${rowNum} solo puede contener letras y números, sin espacios.`);
      } else if (!isValidProgramCode(code.replace(/\s/g, ''))) {
        errors.push(`El código de programa de la fila ${rowNum} debe tener entre 2 y 15 caracteres.`);
      } else {
        row.programaCodigo = code.replace(/\s/g, '');
      }
      // nombre del programa — usa la columna 'nombre' si está disponible
      if (nombreIdx >= 0) {
        const name = (values[nombreIdx] ?? '').trim();
        if (name) row.nombre = name;
      }
    }

    else if (normalizedTipo === 'ficha') {
      // §7 — ficha_codigo obligatorio
      const fichaCode = get(fichaIdx);
      if (!fichaCode) {
        errors.push(`El código de ficha es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidFichaCode(fichaCode)) {
        errors.push(`El código de ficha de la fila ${rowNum} debe tener 7 dígitos numéricos.`);
      } else {
        row.fichaCodigo = fichaCode;
      }
      // §6 — programa_codigo obligatorio para ficha
      const progCode = normalizeProgramCode(get(progIdx));
      if (!progCode) {
        errors.push(`El código de programa es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidProgramCode(progCode)) {
        errors.push(`El código de programa de la fila ${rowNum} debe tener entre 2 y 15 caracteres alfanuméricos.`);
      } else {
        row.programaCodigo = progCode;
      }
    }

    else if (normalizedTipo === 'aprendiz') {
      // §3 — documento
      const rawDoc = get(docIdx);
      const doc = normalizeDocument(rawDoc);
      if (!rawDoc) {
        errors.push(`El documento es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidDocument(doc)) {
        errors.push(`El documento de la fila ${rowNum} debe tener exactamente 10 dígitos numéricos.`);
      } else {
        row.documento = doc;
      }

      // §4 — nombre y apellido
      const nombre = (values[nombreIdx] ?? '').trim();
      if (!nombre) {
        errors.push(`El nombre es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidName(nombre)) {
        errors.push(
          nombre.length < 2
            ? `El nombre de la fila ${rowNum} parece incompleto.`
            : `El nombre de la fila ${rowNum} solo puede contener letras.`,
        );
      } else {
        row.nombre = nombre;
      }

      const apellido = (values[apellidoIdx] ?? '').trim();
      if (!apellido) {
        errors.push(`El apellido es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidName(apellido)) {
        errors.push(
          apellido.length < 2
            ? `El apellido de la fila ${rowNum} parece incompleto.`
            : `El apellido de la fila ${rowNum} solo puede contener letras.`,
        );
      } else {
        row.apellido = apellido;
      }

      // §5 — correo obligatorio para aprendiz
      const correo = normalizeText(get(correoIdx)).replace(/\s/g, '');
      if (!correo) {
        errors.push(`El correo es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidEmail(correo)) {
        errors.push(`El correo de la fila ${rowNum} no tiene un formato válido.`);
      } else {
        row.correo = correo;
      }

      // ficha_codigo obligatorio para aprendiz
      const fichaCode = get(fichaIdx);
      if (fichaCode) {
        if (!isValidFichaCode(fichaCode)) {
          errors.push(`El código de ficha de la fila ${rowNum} debe tener 7 dígitos numéricos.`);
        } else {
          row.fichaCodigo = fichaCode;
        }
      }
    }

    else if (normalizedTipo === 'instructor') {
      // §3 — documento
      const rawDoc = get(docIdx);
      const doc = normalizeDocument(rawDoc);
      if (!rawDoc) {
        errors.push(`El documento es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidDocument(doc)) {
        errors.push(`El documento de la fila ${rowNum} debe tener exactamente 10 dígitos numéricos.`);
      } else {
        row.documento = doc;
      }

      // §4 — nombre y apellido
      const nombre = (values[nombreIdx] ?? '').trim();
      if (!nombre) {
        errors.push(`El nombre es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidName(nombre)) {
        errors.push(
          nombre.length < 2
            ? `El nombre de la fila ${rowNum} parece incompleto.`
            : `El nombre de la fila ${rowNum} solo puede contener letras.`,
        );
      } else {
        row.nombre = nombre;
      }

      const apellido = (values[apellidoIdx] ?? '').trim();
      if (!apellido) {
        errors.push(`El apellido es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidName(apellido)) {
        errors.push(
          apellido.length < 2
            ? `El apellido de la fila ${rowNum} parece incompleto.`
            : `El apellido de la fila ${rowNum} solo puede contener letras.`,
        );
      } else {
        row.apellido = apellido;
      }

      // §5 — correo obligatorio para instructor
      const correo = normalizeText(get(correoIdx)).replace(/\s/g, '');
      if (!correo) {
        errors.push(`El correo es obligatorio en la fila ${rowNum}.`);
      } else if (!isValidEmail(correo)) {
        errors.push(`El correo de la fila ${rowNum} no tiene un formato válido.`);
      } else {
        row.correo = correo;
      }

      // §8 — instructor_tipo obligatorio
      const rawInstTipo = get(instTipoIdx).toLowerCase();
      if (!rawInstTipo) {
        errors.push(`Debes indicar si el instructor es 'especifico' o 'transversal' en la fila ${rowNum}.`);
      } else if (rawInstTipo !== 'especifico' && rawInstTipo !== 'transversal') {
        errors.push(
          `El tipo de instructor de la fila ${rowNum} no es válido. Debe ser 'especifico' o 'transversal'.`,
        );
      } else {
        row.instructorTipo = rawInstTipo as 'especifico' | 'transversal';

        const progCode = normalizeProgramCode(get(progIdx));

        if (rawInstTipo === 'especifico') {
          // §8 — específico requiere programa_codigo
          if (!progCode) {
            errors.push(`Un instructor específico debe indicar el programa al que pertenece (fila ${rowNum}).`);
          } else if (!isValidProgramCode(progCode)) {
            errors.push(`El código de programa de la fila ${rowNum} debe tener entre 2 y 15 caracteres alfanuméricos.`);
          } else {
            row.programaCodigo = progCode;
          }
        } else {
          // §8 — transversal NO debe tener programa (advertencia, no error)
          if (progCode) {
            warnings.push(
              `Se ignoró el programa indicado en la fila ${rowNum} porque los instructores transversales no quedan atados a un solo programa.`,
            );
          }
        }
      }
    }

    rows.push(row);
  }

  return { rows, totalRows: lines.length - 1, invalidRows };
}

// ─────────────────────────────────────────────
//  FUNCIÓN SECUNDARIA: processAcademicCsvV4
//  Recibe las filas ya parseadas + snapshots del store
//  y decide: created / updated / blocked / error.
//  Devuelve el resumen RF-3.1 con las 4 categorías.
//
//  Se ejecuta en la pantalla csv-upload.tsx después
//  de parseAcademicCsvV4 y antes de confirmar los cambios
//  al store.
// ─────────────────────────────────────────────

export interface StoreSnapshots {
  programs: Array<{ id: string; name: string; code?: string; status: string; fichas: string[] }>;
  fichas: Array<{ id: string; number: string; programId: string; status: string; transferCode: string; learners: Array<{ id: string; document: string; status: string }> }>;
  learners: Array<{ id: string; document: string; email: string; fichaId: string; status: string }>;
  instructors: Array<{ id: string; document: string; email: string; instructorType: string; programId?: string; status: string }>;
}

export function processAcademicCsvV4(
  parsedRows: ParsedCsvRow[],
  snapshots: StoreSnapshots,
): CsvImportSummaryV4 {
  const summary: CsvImportSummaryV4 = {
    created: 0, updated: 0, blocked: 0, errors: 0, rows: [],
  };

  // Colectar programas y fichas que se crearán en este mismo archivo
  // (para validar referencias hacia adelante — RF-3.1 §6)
  const newPrograms = new Set<string>();   // programa_codigo normalizados
  const newFichas   = new Set<string>();   // ficha_codigo

  for (const row of parsedRows) {
    if (row.tipo === 'programa' && row.programaCodigo) newPrograms.add(row.programaCodigo);
    if (row.tipo === 'ficha' && row.fichaCodigo)       newFichas.add(row.fichaCodigo);
  }

  // Índices rápidos del store
  const programByCode = new Map(snapshots.programs.map(p => [p.code ?? '', p]));
  const fichaByNumber = new Map(snapshots.fichas.map(f => [f.number, f]));
  const learnerByDoc  = new Map(snapshots.learners.map(l => [l.document, l]));
  const instructorByDoc = new Map(snapshots.instructors.map(i => [i.document, i]));

  for (const row of parsedRows) {
    // Filas con errores de formato no se procesan
    if (row.errors.length > 0) {
      summary.errors++;
      summary.rows.push({
        rowIndex: row.rowIndex,
        category: 'error',
        tipo: row.tipo,
        identifier: row.documento ?? row.programaCodigo ?? row.fichaCodigo ?? `fila ${row.rowIndex}`,
        message: row.errors.join(' | '),
        ...row.warnings.length > 0 ? { message: row.errors.join(' | ') + ' · ' + row.warnings.join(' | ') } : {},
      });
      continue;
    }

    // ── Programa ──────────────────────────────
    if (row.tipo === 'programa' && row.programaCodigo) {
      const existing = programByCode.get(row.programaCodigo);
      if (existing) {
        summary.updated++;
        summary.rows.push({ rowIndex: row.rowIndex, category: 'updated', tipo: 'programa', identifier: row.programaCodigo, message: `Programa '${row.programaCodigo}' actualizado.` });
      } else {
        summary.created++;
        summary.rows.push({ rowIndex: row.rowIndex, category: 'created', tipo: 'programa', identifier: row.programaCodigo, message: `Programa '${row.programaCodigo}' creado.` });
      }
    }

    // ── Ficha ─────────────────────────────────
    else if (row.tipo === 'ficha' && row.fichaCodigo && row.programaCodigo) {
      // Verificar que el programa existe o se está creando en este mismo archivo
      const progExists = programByCode.has(row.programaCodigo) || newPrograms.has(row.programaCodigo);
      if (!progExists) {
        summary.errors++;
        summary.rows.push({
          rowIndex: row.rowIndex, category: 'error', tipo: 'ficha',
          identifier: row.fichaCodigo,
          message: `El programa '${row.programaCodigo}' indicado en la fila ${row.rowIndex} no existe.`,
        });
        continue;
      }
      const existing = fichaByNumber.get(row.fichaCodigo);
      if (existing) {
        summary.updated++;
        summary.rows.push({ rowIndex: row.rowIndex, category: 'updated', tipo: 'ficha', identifier: row.fichaCodigo, message: `Ficha '${row.fichaCodigo}' actualizada.` });
      } else {
        summary.created++;
        summary.rows.push({ rowIndex: row.rowIndex, category: 'created', tipo: 'ficha', identifier: row.fichaCodigo, message: `Ficha '${row.fichaCodigo}' creada.` });
      }
    }

    // ── Aprendiz ──────────────────────────────
    else if (row.tipo === 'aprendiz' && row.documento) {
      // Verificar referencia de ficha
      if (row.fichaCodigo) {
        const fichaExists = fichaByNumber.has(row.fichaCodigo) || newFichas.has(row.fichaCodigo);
        if (!fichaExists) {
          summary.errors++;
          summary.rows.push({
            rowIndex: row.rowIndex, category: 'error', tipo: 'aprendiz',
            identifier: row.documento,
            message: `La ficha '${row.fichaCodigo}' indicada en la fila ${row.rowIndex} no existe.`,
          });
          continue;
        }
      }

      const existing = learnerByDoc.get(row.documento);

      if (!existing) {
        summary.created++;
        summary.rows.push({ rowIndex: row.rowIndex, category: 'created', tipo: 'aprendiz', identifier: row.documento, message: `Aprendiz ${row.nombre} ${row.apellido} (${row.documento}) creado.` });
      } else {
        // Cambio de ficha — verificar si es un conflicto (§6 RF-3.1)
        const currentFicha = fichaByNumber.get(existing.fichaId) ?? snapshots.fichas.find(f => f.learners.some(l => l.document === row.documento));
        if (row.fichaCodigo && currentFicha && currentFicha.number !== row.fichaCodigo && existing.status === 'active') {
          // Cambio de ficha: bloquear y pedir confirmación explícita (RF-3.1.1 §"Actualización del código de ficha")
          summary.blocked++;
          summary.rows.push({
            rowIndex: row.rowIndex, category: 'blocked', tipo: 'aprendiz',
            identifier: row.documento,
            message: `El aprendiz ${row.nombre ?? ''} ${row.apellido ?? ''} (${row.documento}) está en la ficha ${currentFicha.number} pero el archivo indica la ficha ${row.fichaCodigo}. Confirma el cambio manualmente.`,
            conflictRecordId: existing.id,
            conflictRecordType: 'learner',
          });
        } else {
          summary.updated++;
          summary.rows.push({ rowIndex: row.rowIndex, category: 'updated', tipo: 'aprendiz', identifier: row.documento, message: `Aprendiz ${row.documento} actualizado.` });
        }
      }
    }

    // ── Instructor ────────────────────────────
    else if (row.tipo === 'instructor' && row.documento) {
      // Verificar referencia de programa (si específico)
      if (row.instructorTipo === 'especifico' && row.programaCodigo) {
        const progExists = programByCode.has(row.programaCodigo) || newPrograms.has(row.programaCodigo);
        if (!progExists) {
          summary.errors++;
          summary.rows.push({
            rowIndex: row.rowIndex, category: 'error', tipo: 'instructor',
            identifier: row.documento,
            message: `El programa '${row.programaCodigo}' indicado en la fila ${row.rowIndex} no existe.`,
          });
          continue;
        }
      }

      const existing = instructorByDoc.get(row.documento);

      // Verificar conflicto: mismo documento pero rol distinto en aprendices
      if (learnerByDoc.has(row.documento)) {
        summary.blocked++;
        summary.rows.push({
          rowIndex: row.rowIndex, category: 'blocked', tipo: 'instructor',
          identifier: row.documento,
          message: `El documento ${row.documento} ya está registrado como aprendiz. No puede registrarse también como instructor.`,
        });
        continue;
      }

      // Verificar que no cambia de programa asignado en conflicto (RF-3.1 §5)
      if (existing && row.instructorTipo === 'especifico' && existing.programId && existing.programId !== row.programaCodigo) {
        summary.blocked++;
        summary.rows.push({
          rowIndex: row.rowIndex, category: 'blocked', tipo: 'instructor',
          identifier: row.documento,
          message: `El instructor ${row.documento} ya está asignado al programa '${existing.programId}'. El archivo indica el programa '${row.programaCodigo}'. Confirma el cambio manualmente.`,
          conflictRecordId: existing.id,
          conflictRecordType: 'instructor',
        });
        continue;
      }

      if (existing) {
        summary.updated++;
        summary.rows.push({ rowIndex: row.rowIndex, category: 'updated', tipo: 'instructor', identifier: row.documento, message: `Instructor ${row.nombre ?? ''} ${row.apellido ?? ''} (${row.documento}) actualizado.` });
      } else {
        summary.created++;
        summary.rows.push({ rowIndex: row.rowIndex, category: 'created', tipo: 'instructor', identifier: row.documento, message: `Instructor ${row.nombre ?? ''} ${row.apellido ?? ''} (${row.documento}) creado.` });
      }

      // Advertencias de la fila (ej. transversal con programa ignorado)
      if (row.warnings.length > 0) {
        const last = summary.rows[summary.rows.length - 1];
        last.message += ' · ' + row.warnings.join(' · ');
      }
    }
  }

  return summary;
}

// ── Plantilla CSV descargable (RF-3.1.1) ──────
export const CSV_TEMPLATE = [
  'tipo,documento,nombre,apellido,correo,programa_codigo,ficha_codigo,instructor_tipo',
  'programa,,,,,ADSO,,',
  'ficha,,,,,ADSO,2825551,',
  'ficha,,,,,ADSO,2825552,',
  'aprendiz,1002345678,Juan,Pérez,juan.perez@correo.com,,2825551,',
  'instructor,1029384756,Laura,Gómez,laura.gomez@correo.com,ADSO,,especifico',
  'instructor,1050607080,Carlos,Ruiz,carlos.ruiz@correo.com,,,transversal',
].join('\n');

// ── Compatibilidad con csvImport V3 (fichas/[id].tsx usa parseInstitutionalCsv) ──
// Se conserva la interfaz antigua para no romper el código existente de fichas/[id].tsx.
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

const LEGACY_HEADER_ALIASES = {
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
