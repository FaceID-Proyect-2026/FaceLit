import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import * as XLSX from 'xlsx';

export interface ExportData {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  summary?: { label: string; value: string }[];
  filters?: { label: string; value: string }[];
  generatedAt: string;
}

export interface ExportOptions {
  filename: string;
  format: 'pdf' | 'excel' | 'csv';
}

function reportDuration(entry: string, exit: string): string {
  if (!/^\d{2}:\d{2}$/.test(entry) || !/^\d{2}:\d{2}$/.test(exit)) return '--';
  const [entryHour, entryMinute] = entry.split(':').map(Number);
  const [exitHour, exitMinute] = exit.split(':').map(Number);
  let minutes = exitHour * 60 + exitMinute - entryHour * 60 - entryMinute;
  if (minutes < 0) minutes += 24 * 60;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function generateCSV(data: ExportData): string {
  let csv = '';
  
  if (data.title) {
    csv += `"${data.title}"\n`;
  }
  if (data.subtitle) {
    csv += `"${data.subtitle}"\n`;
  }
  csv += '\n';
  
  if (data.filters && data.filters.length > 0) {
    csv += 'Filtros aplicados\n';
    data.filters.forEach(f => {
      csv += `"${f.label}","${f.value}"\n`;
    });
    csv += '\n';
  }
  
  if (data.summary && data.summary.length > 0) {
    csv += 'Resumen\n';
    data.summary.forEach(s => {
      csv += `"${s.label}","${s.value}"\n`;
    });
    csv += '\n';
  }
  
  csv += 'Datos\n';
  csv += data.headers.map(h => `"${h}"`).join(',') + '\n';
  data.rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  csv += '\n';
  csv += `Generado el,${data.generatedAt}\n`;
  
  return csv;
}

// ── Excel real (.xlsx) con xlsx (SheetJS) ──
// A diferencia del XML de Excel 2003 escrito a mano que había antes,
// esto genera un .xlsx real. La edición gratuita de xlsx NO permite
// pintar fondos/negritas por celda (eso es de pago), pero sí:
//   • fijar el ancho de cada columna (ws['!cols']) — arregla las
//     columnas angostas/cortadas que salían antes.
//   • fusionar celdas (ws['!merges']) — para que el título y los
//     encabezados de sección ("Filtros aplicados", "Resumen", "Datos")
//     ocupen todo el ancho de la tabla, en vez de una sola celda.
function buildExcelWorkbook(data: ExportData): XLSX.WorkBook {
  const colCount = Math.max(data.headers.length, 1);
  const sheetRows: (string | number)[][] = [];
  const merges: XLSX.Range[] = [];

  const pushMergedRow = (text: string) => {
    sheetRows.push([text]);
    merges.push({ s: { r: sheetRows.length - 1, c: 0 }, e: { r: sheetRows.length - 1, c: colCount - 1 } });
  };
  const pushBlankRow = () => sheetRows.push([]);

  if (data.title) pushMergedRow(data.title);
  if (data.subtitle) pushMergedRow(data.subtitle);
  pushBlankRow();

  if (data.filters && data.filters.length > 0) {
    pushMergedRow('Filtros aplicados');
    data.filters.forEach(f => sheetRows.push([f.label, f.value]));
    pushBlankRow();
  }

  if (data.summary && data.summary.length > 0) {
    pushMergedRow('Resumen');
    data.summary.forEach(s => sheetRows.push([s.label, s.value]));
    pushBlankRow();
  }

  pushMergedRow('Datos');
  sheetRows.push([...data.headers]);
  data.rows.forEach(row => sheetRows.push(row));
  pushBlankRow();
  sheetRows.push(['Generado el', data.generatedAt]);

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  worksheet['!cols'] = computeColumnWidths(data.headers, data.rows);
  if (merges.length > 0) worksheet['!merges'] = merges;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
  return workbook;
}

// Ancho por columna en base al contenido más largo (encabezado o
// cualquier fila), con un mínimo y un máximo razonables para que
// no queden ni angostas ni gigantes.
function computeColumnWidths(headers: string[], rows: string[][]): { wch: number }[] {
  const colCount = Math.max(headers.length, 1);
  const widths = new Array(colCount).fill(8);

  headers.forEach((h, i) => {
    widths[i] = Math.max(widths[i], String(h ?? '').length);
  });
  rows.forEach(row => {
    row.forEach((cell, i) => {
      if (i < colCount) widths[i] = Math.max(widths[i], String(cell ?? '').length);
    });
  });

  return widths.map(w => ({ wch: Math.min(Math.max(w + 2, 10), 40) }));
}

export async function exportReport(data: ExportData, options: ExportOptions): Promise<boolean> {
  try {
    // El Excel es un caso aparte: es un archivo binario (.xlsx) generado
    // por xlsx (SheetJS), no un string de texto plano como CSV/PDF —
    // por eso tiene su propia rama en vez de compartir el switch de abajo.
    if (options.format === 'excel') {
      return await exportExcelWorkbook(data, options.filename);
    }

    let content: string;
    let mimeType: string;
    let fileExtension: string;
    
    switch (options.format) {
      case 'csv':
        content = generateCSV(data);
        mimeType = 'text/csv';
        fileExtension = '.csv';
        break;
      case 'pdf':
        content = generatePDFContent(data);
        mimeType = 'application/pdf';
        fileExtension = '.pdf';
        break;
      default:
        content = generateCSV(data);
        mimeType = 'text/csv';
        fileExtension = '.csv';
    }
    
    const filename = `${options.filename}${fileExtension}`;
    
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } else {
      const file = new FileSystem.File(FileSystem.Paths.cache, filename);
      file.write(content);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: `Exportar ${options.format.toUpperCase()}` });
      } else {
        Alert.alert('Exportación no disponible', 'Este dispositivo no permite compartir el archivo generado.');
        return false;
      }
      return true;
    }
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert('Error', 'No fue posible generar el reporte. Inténtelo nuevamente.');
    return false;
  }
}

async function exportExcelWorkbook(data: ExportData, baseFilename: string): Promise<boolean> {
  try {
    const workbook = buildExcelWorkbook(data);
    const filename = `${baseFilename}.xlsx`;
    const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (Platform.OS === 'web') {
      // writeFile arma el .xlsx y dispara la descarga del navegador solo,
      // sin necesidad de armar un Blob/URL manualmente.
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
      return true;
    }

    // En nativo no hay "descarga del navegador": se escribe el binario
    // como base64 a un archivo real y se comparte con la hoja del sistema.
    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const file = new FileSystem.File(FileSystem.Paths.cache, filename);
    file.write(base64, { encoding: 'base64' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Exportar Excel' });
    } else {
      Alert.alert('Exportación no disponible', 'Este dispositivo no permite compartir el archivo generado.');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    Alert.alert('Error', 'No fue posible generar el archivo de Excel. Inténtelo nuevamente.');
    return false;
  }
}

/** Minimal, valid PDF document. The report remains usable without adding a platform-only PDF dependency. */
function generatePDFContent(data: ExportData): string {
  const clean = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[()\\]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?');
  const lines = [data.title, data.subtitle || '', ...((data.filters || []).map(f => `${f.label}: ${f.value}`)), '', ...((data.summary || []).map(s => `${s.label}: ${s.value}`)), '', data.headers.join(' | '), ...data.rows.map(row => row.join(' | ')), '', data.generatedAt]
    .flatMap(line => clean(line).match(/.{1,100}/g) || ['']);
  const pageHeight = Math.max(792, lines.length * 15 + 80);
  const stream = ['BT', '/F1 11 Tf', `50 ${pageHeight - 35} Td`, ...lines.flatMap((line, index) => [index ? '0 -15 Td' : '', `(${line}) Tj`]).filter(Boolean), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

export function generateReportData(
  reportType: 'by-user' | 'by-ficha' | 'my-performance',
  data: any,
  filters: any,
  t: (key: string) => string
): ExportData {
  const generatedAt = new Date().toLocaleString();
  
  switch (reportType) {
    case 'by-user': {
      const rows = data.map((r: any) => [
        r.date,
        r.userName,
        r.fichaNumber,
        r.programName,
        r.environmentName,
        r.entryTime || '--',
        r.exitTime || '--',
        r.delayMinutes > 0 ? `${r.delayMinutes} min` : '--',
        r.status === 'punctual' ? t('reports.statuses.punctual') : r.status === 'late' ? t('reports.statuses.late') : t('reports.statuses.absent'),
        reportDuration(r.entryTime, r.exitTime),
      ]);
      
      const stats = {
        total: data.length,
        present: data.filter((r: any) => r.status === 'punctual').length,
        late: data.filter((r: any) => r.status === 'late').length,
        absent: data.filter((r: any) => r.status === 'absent').length,
      };
      
      return {
        title: t('reports.export.title'),
        subtitle: t('reports.byUser'),
        headers: [
          t('reports.table.date'),
          t('reports.table.user'),
          t('reports.table.ficha'),
          t('reports.filters.program'),
          t('reports.table.env'),
          t('reports.table.entry'),
          t('reports.table.exit'),
          t('reports.table.delay'),
          t('reports.table.status'),
          t('reports.table.duration'),
        ],
        rows,
        summary: [
          { label: t('reports.summary.totalRecords'), value: stats.total.toString() },
          { label: t('reports.summary.present'), value: stats.present.toString() },
          { label: t('reports.summary.lateCount'), value: stats.late.toString() },
          { label: t('reports.summary.absentCount'), value: stats.absent.toString() },
        ],
        filters: [
          { label: t('reports.filters.user'), value: filters.user || t('reports.filters.all') },
          { label: t('reports.filters.ficha'), value: filters.ficha || t('reports.filters.all') },
          { label: t('reports.filters.environment'), value: filters.environment || t('reports.filters.all') },
          { label: t('reports.filters.program'), value: filters.program || t('reports.filters.all') },
          { label: t('reports.filters.dateFrom'), value: filters.dateFrom || '---' },
          { label: t('reports.filters.dateTo'), value: filters.dateTo || '---' },
        ],
        generatedAt,
      };
    }
    case 'by-ficha': {
      const rows = data.learners.map((l: any) => [
        l.name,
        l.document,
        l.totalClasses.toString(),
        l.attendances.toString(),
        l.absences.toString(),
        l.lateCount.toString(),
        `${l.percentage}%`,
      ]);
      
      return {
        title: t('reports.export.title'),
        subtitle: `${t('reports.byFicha')} - ${data.fichaNumber}`,
        headers: [
          t('reports.table.user'),
          t('reports.table.identification'),
          t('reports.table.totalClasses'),
          t('reports.table.attendances'),
          t('reports.table.absences'),
          t('reports.table.lateCount'),
          t('reports.table.percentage'),
        ],
        rows,
        summary: [
          { label: t('reports.summary.totalRecords'), value: data.totalClasses.toString() },
          { label: t('reports.summary.present'), value: data.attendances.toString() },
          { label: t('reports.summary.lateCount'), value: data.lateCount.toString() },
          { label: t('reports.summary.absentCount'), value: data.absences.toString() },
          { label: t('reports.summary.rate'), value: `${data.percentage}%` },
        ],
        filters: [
          { label: t('reports.filters.ficha'), value: data.fichaNumber },
          { label: t('reports.filters.dateFrom'), value: filters.dateFrom || '---' },
          { label: t('reports.filters.dateTo'), value: filters.dateTo || '---' },
        ],
        generatedAt,
      };
    }
    default:
      return {
        title: t('reports.export.title'),
        headers: [],
        rows: [],
        generatedAt,
      };
  }
}