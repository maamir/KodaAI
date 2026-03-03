import ExcelJS from 'exceljs';
import { logger } from '../../infrastructure/logger';

export interface ExcelReportData {
  title: string;
  generatedAt: Date;
  dateRange?: { start: Date; end: Date };
  sheets: ExcelSheet[];
}

export interface ExcelSheet {
  name: string;
  data: ExcelSheetData;
}

export interface ExcelSheetData {
  headers: string[];
  rows: any[][];
  summary?: Record<string, any>;
}

export class ExcelGenerator {
  async generate(data: ExcelReportData): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = 'AIDLC Platform';
      workbook.created = data.generatedAt;
      workbook.modified = data.generatedAt;
      workbook.title = data.title;

      // Add summary sheet if we have summary data
      const hasSummary = data.sheets.some(sheet => sheet.data.summary);
      if (hasSummary) {
        this.addSummarySheet(workbook, data);
      }

      // Add data sheets
      for (const sheet of data.sheets) {
        this.addDataSheet(workbook, sheet);
      }

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      logger.error('Error generating Excel report:', error);
      throw error;
    }
  }

  private addSummarySheet(workbook: ExcelJS.Workbook, data: ExcelReportData): void {
    const worksheet = workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: '2563EB' } },
    });

    // Title
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = data.title;
    titleCell.font = { size: 18, bold: true, color: { argb: '1E40AF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Metadata
    worksheet.getCell('A2').value = 'Generated:';
    worksheet.getCell('B2').value = data.generatedAt.toLocaleString();
    
    if (data.dateRange) {
      worksheet.getCell('A3').value = 'Period:';
      worksheet.getCell('B3').value = `${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`;
    }

    // Collect all summaries
    let currentRow = 5;
    for (const sheet of data.sheets) {
      if (sheet.data.summary) {
        worksheet.getCell(`A${currentRow}`).value = sheet.name;
        worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };
        currentRow++;

        for (const [key, value] of Object.entries(sheet.data.summary)) {
          worksheet.getCell(`A${currentRow}`).value = this.formatLabel(key);
          worksheet.getCell(`B${currentRow}`).value = this.formatValue(value);
          worksheet.getCell(`B${currentRow}`).numFmt = this.getNumberFormat(value);
          currentRow++;
        }

        currentRow++; // Add spacing
      }
    }

    // Style the summary sheet
    worksheet.getColumn('A').width = 30;
    worksheet.getColumn('B').width = 20;
    
    // Apply borders to data area
    for (let row = 2; row <= currentRow; row++) {
      ['A', 'B'].forEach(col => {
        const cell = worksheet.getCell(`${col}${row}`);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  }

  private addDataSheet(workbook: ExcelJS.Workbook, sheet: ExcelSheet): void {
    const worksheet = workbook.addWorksheet(sheet.name);
    const { headers, rows } = sheet.data;

    // Add headers
    worksheet.addRow(headers);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Add data rows
    rows.forEach(row => {
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index]?.length || 10;
      
      rows.forEach(row => {
        const cellValue = String(row[index] || '');
        maxLength = Math.max(maxLength, cellValue.length);
      });

      column.width = Math.min(maxLength + 2, 50);
    });

    // Apply borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Alternate row colors for data rows
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F9FAFB' },
          };
        });
      }
    });

    // Freeze header row
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 },
    ];

    // Add auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): any {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return value;
  }

  private getNumberFormat(value: any): string {
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return '#,##0';
      }
      return '#,##0.00';
    }
    return '@'; // Text format
  }

  async generateFromFeatures(features: any[], metrics: any[]): Promise<Buffer> {
    const data: ExcelReportData = {
      title: 'Feature Report',
      generatedAt: new Date(),
      sheets: [
        {
          name: 'Features',
          data: this.buildFeaturesSheet(features),
        },
        {
          name: 'Metrics',
          data: this.buildMetricsSheet(metrics),
        },
      ],
    };

    return this.generate(data);
  }

  private buildFeaturesSheet(features: any[]): ExcelSheetData {
    const headers = [
      'Feature ID',
      'Name',
      'Status',
      'Phase',
      'Started At',
      'Completed At',
      'Duration (hours)',
    ];

    const rows = features.map(f => [
      f.featureId,
      f.name,
      f.status,
      f.currentPhase,
      f.startedAt ? f.startedAt.toLocaleString() : '',
      f.completedAt ? f.completedAt.toLocaleString() : '',
      f.totalDuration ? (f.totalDuration / 60).toFixed(2) : '',
    ]);

    const summary = {
      totalFeatures: features.length,
      completedFeatures: features.filter(f => f.status === 'COMPLETED').length,
      inProgressFeatures: features.filter(f => f.status === 'IN_PROGRESS').length,
    };

    return { headers, rows, summary };
  }

  private buildMetricsSheet(metrics: any[]): ExcelSheetData {
    const headers = [
      'Feature ID',
      'Metric Type',
      'Value',
      'Formula',
      'Calculated At',
    ];

    const rows = metrics.map(m => [
      m.featureId,
      m.metricType,
      m.metricValue,
      m.formula,
      m.calculatedAt.toLocaleString(),
    ]);

    return { headers, rows };
  }
}

export const excelGenerator = new ExcelGenerator();
