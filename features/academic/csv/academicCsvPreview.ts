import { CsvImportSummaryV4 } from '../types';
import { ParsedCsvRow } from './academicCsvParser';

export interface StoreSnapshots {
  programs: { id: string; name: string; code?: string; status: string; fichas: string[] }[];
  fichas: { id: string; number: string; programId: string; status: string; transferCode: string; learners: { id: string; document: string; status: string }[] }[];
  learners: { id: string; document: string; email: string; fichaId: string; status: string }[];
  instructors: { id: string; document: string; email: string; instructorType: string; programId?: string; status: string }[];
}

export function processAcademicCsvV4(
  parsedRows: ParsedCsvRow[],
  snapshots: StoreSnapshots,
): CsvImportSummaryV4 {
  const summary: CsvImportSummaryV4 = {
    created: 0, updated: 0, blocked: 0, errors: 0, rows: [], generatedPasswords: [],
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
