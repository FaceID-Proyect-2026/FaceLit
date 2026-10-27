

export const MAX_FILE_ROWS = 5000;

export const VALID_TIPOS = ['programa', 'ficha', 'aprendiz', 'instructor'] as const;

export type TipoValue = typeof VALID_TIPOS[number];

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeDocument(value: string): string {
  return value.replace(/[^0-9]/g, '').trim();
}

export function normalizeProgramCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidDocument(doc: string): boolean {
  return /^\d{6,15}$/.test(doc);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidProgramCode(code: string): boolean {
  return /^[A-Z0-9]{2,15}$/.test(code);
}

export function isValidFichaCode(code: string): boolean {
  return /^\d{7}$/.test(code);
}

export function isValidName(name: string): boolean {
  if (name.length < 2 || name.length > 60) return false;
  return /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(name);
}

export function parseCsvLine(line: string): string[] {
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

export const HEADER_ALIASES: Record<string, string[]> = {
  tipo:              ['tipo', 'type'],
  documento:         ['documento', 'document', 'numerodocumento', 'numero_documento', 'cedula'],
  nombre:            ['nombre', 'nombre', 'nombres', 'name'],
  apellido:          ['apellido', 'apellidos', 'lastname', 'last name'],
  correo:            ['correo', 'email', 'correo electronico', 'correo electrónico'],
  programa_codigo:   ['programa_codigo', 'program_code', 'programa', 'codigo_programa'],
  ficha_codigo:      ['ficha_codigo', 'ficha_code', 'ficha', 'codigo_ficha', 'numero_ficha'],
  instructor_tipo:   ['instructor_tipo', 'instructor_type', 'tipo_instructor'],
};

export function findColumn(headers: string[], aliases: string[]): number {
  return headers.findIndex(h => aliases.includes(h));
}

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
        errors.push(`El documento de la fila ${rowNum} debe tener entre 6 y 15 dígitos numéricos.`);
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
        errors.push(`El documento de la fila ${rowNum} debe tener entre 6 y 15 dígitos numéricos.`);
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
        const fichaCode = get(fichaIdx);
        if (fichaCode) {
          if (!isValidFichaCode(fichaCode)) {
            errors.push(`El código de ficha de la fila ${rowNum} debe tener 7 dígitos numéricos.`);
          } else {
            row.fichaCodigo = fichaCode;
          }
        }

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
