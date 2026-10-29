import {
  parseAcademicCsvV4,
  parseInstitutionalCsv,
  processAcademicCsvV4,
} from '@/features/academic/csvImport';

test('the CSV facade preserves parsing, quoted names and preview processing', () => {
  const parsed = parseAcademicCsvV4(
    'tipo,documento,nombre,apellido,correo,programa_codigo,ficha_codigo,instructor_tipo\n' +
    'programa,,Analisis de Software,,,ADSO,,\n' +
    'ficha,,,,,ADSO,1234567,\n' +
    'aprendiz,12345678,Ana,Perez,ana@example.invalid,,1234567,\n',
  );
  expect(parsed.rows).toHaveLength(3);
  const preview = processAcademicCsvV4(parsed.rows, { programs: [], fichas: [], learners: [], instructors: [] });
  expect(preview.created).toBe(3);
  expect(preview.errors).toBe(0);
});

test('the legacy format adapter remains reachable through the same public API', () => {
  const parsed = parseInstitutionalCsv('documento,nombre,apellido,correo\n12345678,Ana,Perez,ana@example.invalid\n');
  expect(parsed.rows).toHaveLength(1);
  expect(parsed.rows[0].document).toBe('12345678');
});
