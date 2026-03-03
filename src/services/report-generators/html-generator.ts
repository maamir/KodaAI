import { logger } from '../../infrastructure/logger';

export interface HTMLReportData {
  title: string;
  generatedAt: Date;
  dateRange?: { start: Date; end: Date };
  sections: HTMLSection[];
  summary?: Record<string, any>;
  includeCharts?: boolean;
}

export interface HTMLSection {
  title: string;
  content: string | Record<string, any>;
  type: 'text' | 'table' | 'chart' | 'metrics' | 'list';
}

export class HTMLGenerator {
  async generate(data: HTMLReportData): Promise<Buffer> {
    try {
      const html = this.generateHTML(data);
      return Buffer.from(html, 'utf-8');
    } catch (error) {
      logger.error('Error generating HTML report:', error);
      throw error;
    }
  }

  private generateHTML(data: HTMLReportData): string {
    const { title, generatedAt, dateRange, sections, summary, includeCharts } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    :root {
      --primary-color: #2563eb;
      --primary-dark: #1e40af;
      --secondary-color: #64748b;
      --success-color: #10b981;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
      --bg-color: #ffffff;
      --bg-secondary: #f8fafc;
      --text-color: #1e293b;
      --text-secondary: #64748b;
      --border-color: #e2e8f0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-color);
      background: var(--bg-secondary);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .report-header {
      background: var(--bg-color);
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .report-header h1 {
      font-size: 32px;
      color: var(--primary-dark);
      margin-bottom: 15px;
    }

    .report-meta {
      display: flex;
      gap: 30px;
      color: var(--text-secondary);
      font-size: 13px;
    }

    .report-meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .report-meta-item strong {
      color: var(--text-color);
    }

    .summary {
      background: var(--bg-color);
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .summary h2 {
      font-size: 20px;
      color: var(--text-color);
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--border-color);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .summary-card {
      background: var(--bg-secondary);
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid var(--primary-color);
    }

    .summary-card .label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .summary-card .value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-color);
    }

    .section {
      background: var(--bg-color);
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .section h2 {
      font-size: 22px;
      color: var(--text-color);
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--border-color);
    }

    .section h3 {
      font-size: 18px;
      color: var(--text-color);
      margin: 20px 0 10px;
    }

    .section p {
      margin-bottom: 15px;
      line-height: 1.8;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    table thead {
      background: var(--bg-secondary);
    }

    table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: var(--text-color);
      border-bottom: 2px solid var(--border-color);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }

    table tbody tr:hover {
      background: var(--bg-secondary);
    }

    .metrics-list {
      display: grid;
      gap: 12px;
    }

    .metric-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: 6px;
    }

    .metric-label {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .metric-value {
      color: var(--text-color);
      font-weight: 600;
      font-size: 16px;
    }

    .list {
      list-style: none;
      padding: 0;
    }

    .list li {
      padding: 10px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .list li:last-child {
      border-bottom: none;
    }

    .chart-placeholder {
      background: var(--bg-secondary);
      padding: 40px;
      border-radius: 8px;
      text-align: center;
      color: var(--text-secondary);
      font-style: italic;
    }

    .footer {
      text-align: center;
      padding: 30px 20px;
      color: var(--text-secondary);
      font-size: 12px;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }

    @media print {
      body {
        background: white;
      }
      
      .container {
        padding: 20px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="report-header">
      <h1>${this.escapeHtml(title)}</h1>
      <div class="report-meta">
        <div class="report-meta-item">
          <strong>Generated:</strong>
          <span>${generatedAt.toLocaleString()}</span>
        </div>
        ${dateRange ? `
          <div class="report-meta-item">
            <strong>Period:</strong>
            <span>${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}</span>
          </div>
        ` : ''}
      </div>
    </div>

    ${summary ? this.renderSummary(summary) : ''}

    ${sections.map(section => this.renderSection(section)).join('\n')}

    <div class="footer">
      <p><strong>AI-Driven Development Lifecycle (AIDLC) Platform</strong></p>
      <p>Confidential Report | Generated on ${generatedAt.toLocaleString()}</p>
    </div>
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

  private renderSection(section: HTMLSection): string {
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
      case 'list':
        renderedContent = this.renderList(content as any);
        break;
      case 'chart':
        renderedContent = `<div class="chart-placeholder">Chart: ${this.escapeHtml(String(content))}</div>`;
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
    const items = Object.entries(metrics).map(([key, value]) => {
      const label = this.formatLabel(key);
      const formattedValue = this.formatValue(value);
      
      return `
        <div class="metric-item">
          <span class="metric-label">${label}</span>
          <span class="metric-value">${formattedValue}</span>
        </div>
      `;
    });

    return `<div class="metrics-list">${items.join('\n')}</div>`;
  }

  private renderList(items: string[] | any[]): string {
    const listItems = items.map(item => {
      const text = typeof item === 'string' ? item : JSON.stringify(item);
      return `<li>${this.escapeHtml(text)}</li>`;
    });

    return `<ul class="list">${listItems.join('\n')}</ul>`;
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
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return value.toLocaleString();
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

export const htmlGenerator = new HTMLGenerator();
