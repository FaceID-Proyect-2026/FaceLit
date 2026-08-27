import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

function generateExcelXML(data: ExportData): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
<Styles>
<Style ss:ID="Default" ss:Name="Normal">
<Alignment ss:Vertical="Bottom"/>
<Borders/>
<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
<Interior/>
<NumberFormat/>
<Protection/>
</Style>
<Style ss:ID="Header">
<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
<Interior ss:Color="#65B361" ss:Pattern="Solid"/>
<Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
</Style>
<Style ss:ID="Title">
<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Bold="1"/>
</Style>
<Style ss:ID="Subtitle">
<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Italic="1"/>
</Style>
</Styles>
<Worksheet ss:Name="Reporte">
<Table ss:ExpandedColumnCount="${data.headers.length}" x:FullColumns="1" x:FullRows="1">`;

  let rowIndex = 1;
  
  if (data.title) {
    xml += `<Row><Cell ss:StyleID="Title" ss:MergeAcross="${data.headers.length - 1}"><Data ss:Type="String">${escapeXml(data.title)}</Data></Cell></Row>`;
    rowIndex++;
  }
  if (data.subtitle) {
    xml += `<Row><Cell ss:StyleID="Subtitle" ss:MergeAcross="${data.headers.length - 1}"><Data ss:Type="String">${escapeXml(data.subtitle)}</Data></Cell></Row>`;
    rowIndex++;
  }
  rowIndex++;
  
  if (data.filters && data.filters.length > 0) {
    xml += `<Row><Cell ss:StyleID="Title" ss:MergeAcross="${data.headers.length - 1}"><Data ss:Type="String">Filtros aplicados</Data></Cell></Row>`;
    rowIndex++;
    data.filters.forEach(f => {
      xml += `<Row><Cell><Data ss:Type="String">${escapeXml(f.label)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(f.value)}</Data></Cell></Row>`;
      rowIndex++;
    });
    rowIndex++;
  }
  
  if (data.summary && data.summary.length > 0) {
    xml += `<Row><Cell ss:StyleID="Title" ss:MergeAcross="${data.headers.length - 1}"><Data ss:Type="String">Resumen</Data></Cell></Row>`;
    rowIndex++;
    data.summary.forEach(s => {
      xml += `<Row><Cell><Data ss:Type="String">${escapeXml(s.label)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(s.value)}</Data></Cell></Row>`;
      rowIndex++;
    });
    rowIndex++;
  }
  
  xml += `<Row><Cell ss:StyleID="Title" ss:MergeAcross="${data.headers.length - 1}"><Data ss:Type="String">Datos</Data></Cell></Row>`;
  rowIndex++;
  
  xml += '<Row>';
  data.headers.forEach(h => {
    xml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
  });
  xml += '</Row>';
  rowIndex++;
  
  data.rows.forEach(row => {
    xml += '<Row>';
    row.forEach(cell => {
      xml += `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`;
    });
    xml += '</Row>';
    rowIndex++;
  });
  
  rowIndex++;
  xml += `<Row><Cell><Data ss:Type="String">Generado el</Data></Cell><Cell><Data ss:Type="String">${escapeXml(data.generatedAt)}</Data></Cell></Row>`;
  
  xml += `</Table></Worksheet></Workbook>`;
  
  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

export async function exportReport(data: ExportData, options: ExportOptions): Promise<boolean> {
  try {
    let content: string;
    let mimeType: string;
    let fileExtension: string;
    
    switch (options.format) {
      case 'csv':
        content = generateCSV(data);
        mimeType = 'text/csv';
        fileExtension = '.csv';
        break;
      case 'excel':
        content = generateExcelXML(data);
        mimeType = 'application/vnd.ms-excel';
        fileExtension = '.xls';
        break;
      case 'pdf':
        content = generatePDFContent(data);
        mimeType = 'text/plain';
        fileExtension = '.txt';
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

function generatePDFContent(data: ExportData): string {
  let content = `%PDF-1.4\n% FaceLit Export\n`;
  content += `Title: ${data.title}\n`;
  if (data.subtitle) content += `Subtitle: ${data.subtitle}\n`;
  content += `Generated: ${data.generatedAt}\n\n`;
  
  if (data.filters && data.filters.length > 0) {
    content += 'Filtros aplicados:\n';
    data.filters.forEach(f => content += `  ${f.label}: ${f.value}\n`);
    content += '\n';
  }
  
  if (data.summary && data.summary.length > 0) {
    content += 'Resumen:\n';
    data.summary.forEach(s => content += `  ${s.label}: ${s.value}\n`);
    content += '\n';
  }
  
  content += 'Datos:\n';
  content += data.headers.join('\t') + '\n';
  data.rows.forEach(row => content += row.join('\t') + '\n');
  
  return content;
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
        r.entryTime || '--',
        r.exitTime || '--',
        r.status === 'punctual' ? t('reports.statuses.punctual') : r.status === 'late' ? t('reports.statuses.late') : t('reports.statuses.absent'),
        r.environmentName,
        r.delayMinutes > 0 ? `${r.delayMinutes} min` : '--',
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
          t('reports.table.entry'),
          t('reports.table.exit'),
          t('reports.table.status'),
          t('reports.table.env'),
          t('reports.table.delay'),
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
          { label: t('reports.filters.status'), value: filters.status || t('reports.filters.all') },
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
