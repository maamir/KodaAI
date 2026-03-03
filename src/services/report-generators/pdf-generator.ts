import puppeteer from 'puppeteer';
import { logger } from '../../infrastructure/logger';

export interface PDFReportData {
  title: string;
  generatedAt: Date;
  dateRange?: { start: Date; end: Date };
  sections: ReportSection[];
  summary?: Record<string, any>;
  includeCharts?: boolean;
}

export interface ReportSection {
  title: string;
  content: string | Record<string, any>;
  type: 'text' | 'table' | 'chart' | 'metrics';
}

export class PDFGenerator {
  async generate(data: PDFReportData): Promise<Buffer> {
    try {
      const html = this.generateHTML(data);
      const pdf = await this.convertHTMLToPDF(html);
      return pdf;
    } catch (error) {
      logger.error('Error generating PDF report:', error);
      throw error;
    }
  }

  private generateHTML(data: PDFReportData): string {
    const { title, generatedAt, dateRange, sections, summary } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      padding: 40px;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .header .meta {
      color: #6b7280;
      font-size: 11px;
    }
    
    .summary {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .summary h2 {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 15px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .summary-card {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }
    
    .summary-card .label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .summary-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      font-size: 20px;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    
    .section h3 {
      font-size: 16px;
      color: #374151;
      margin-bottom: 10px;
      margin-top: 15px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    table th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    
    table tr:hover {
      background: #f9fafb;
    }
    
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .metric-row:last-child {
      border-bottom: none;
    }
    
    .metric-label {
      color: #6b7280;
      font-weight: 500;
    }
    
    .metric-value {
      color: #1f2937;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 10px;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.escapeHtml(title)}</h1>
    <div class="meta">
      Generated: ${generatedAt.toLocaleString()}
      ${dateRange ? `| Period: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}` : ''}
    </div>
  </div>

  ${summary ? this.renderSummary(summary) : ''}

  ${sections.map(section => this.renderSection(section)).join('\n')}

  <div class="footer">
    <p>AI-Driven Development Lifecycle (AIDLC) Platform - Confidential Report</p>
    <p>Generated on ${generatedAt.toLocaleString()}</p>
  </div>
</body>
</html>
    `;
  }

  private renderSummary(summary: Record<string, any>): string {
    const cards = Object.entries(summary).map(([key, value]) => {
      const label = this.formatLabel(key);
      const formattedValue = this.formatValue(value);
      
      return `
        <div class="summary-card">
          <div class="label">${label}</div>
          <div class="value">${formattedValue}</div>
        </div>
      `;
    });

    return `
      <div class="summary">
        <h2>Executive Summary</h2>
        <div class="summary-grid">
          ${cards.join('\n')}
        </div>
      </div>
    `;
  }

  private renderSection(section: ReportSection): string {
    const { title, content, type } = section;

    let renderedContent = '';

    switch (type) {
      case 'text':
        renderedContent = `<p>${this.escapeHtml(String(content))}</p>`;
        break;
      case 'table':
        renderedContent = this.renderTable(content as any);
        break;
      case 'metrics':
        renderedContent = this.renderMetrics(content as Record<string, any>);
        break;
      case 'chart':
        renderedContent = `<p><em>Chart visualization: ${this.escapeHtml(String(content))}</em></p>`;
        break;
      default:
        renderedContent = `<pre>${JSON.stringify(content, null, 2)}</pre>`;
    }

    return `
      <div class="section">
        <h2>${this.escapeHtml(title)}</h2>
        ${renderedContent}
      </div>
    `;
  }

  private renderTable(data: { headers: string[]; rows: any[][] }): string {
    if (!data.headers || !data.rows) {
      return '<p>No data available</p>';
    }

    const headerRow = data.headers.map(h => `<th>${this.escapeHtml(h)}</th>`).join('');
    const bodyRows = data.rows.map(row => {
      const cells = row.map(cell => `<td>${this.escapeHtml(String(cell))}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');

    return `
      <table>
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    `;
  }

  private renderMetrics(metrics: Record<string, any>): string {
    const rows = Object.entries(metrics).map(([key, value]) => {
      const label = this.formatLabel(key);
      const formattedValue = this.formatValue(value);
      
      return `
        <div class="metric-row">
          <span class="metric-label">${label}</span>
          <span class="metric-value">${formattedValue}</span>
        </div>
      `;
    });

    return `<div class="metrics">${rows.join('\n')}</div>`;
  }

  private async convertHTMLToPDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private formatValue(value: any): string {
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toLocaleString();
      }
      return value.toFixed(2);
    }
    return String(value);
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

export const pdfGenerator = new PDFGenerator();
