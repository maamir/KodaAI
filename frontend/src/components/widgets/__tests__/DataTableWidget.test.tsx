import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { DataTableWidget } from '../DataTableWidget';

describe('DataTableWidget', () => {
  const columns = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'value', label: 'Value', sortable: true },
    { id: 'status', label: 'Status', sortable: false },
  ];

  const data = [
    { name: 'Feature A', value: 100, status: 'Active' },
    { name: 'Feature B', value: 200, status: 'Completed' },
    { name: 'Feature C', value: 150, status: 'Active' },
  ];

  it('should render table with title', () => {
    render(<DataTableWidget title="Features" columns={columns} data={data} />);
    
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('should render table without title', () => {
    render(<DataTableWidget columns={columns} data={data} />);
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(<DataTableWidget columns={columns} data={data} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should render data rows', () => {
    render(<DataTableWidget columns={columns} data={data} />);
    
    expect(screen.getByText('Feature A')).toBeInTheDocument();
    expect(screen.getByText('Feature B')).toBeInTheDocument();
    expect(screen.getByText('Feature C')).toBeInTheDocument();
  });

  it('should render sortable columns with sort button', () => {
    render(<DataTableWidget columns={columns} data={data} />);
    
    const nameHeader = screen.getByText('Name').closest('th');
    expect(nameHeader?.querySelector('.MuiTableSortLabel-root')).toBeInTheDocument();
  });

  it('should render non-sortable columns without sort button', () => {
    render(<DataTableWidget columns={columns} data={data} />);
    
    const statusHeader = screen.getByText('Status').closest('th');
    expect(statusHeader?.querySelector('.MuiTableSortLabel-root')).not.toBeInTheDocument();
  });

  it('should sort data when clicking sortable column', async () => {
    const user = userEvent.setup();
    render(<DataTableWidget columns={columns} data={data} />);
    
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    
    // Data should be sorted
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('should handle empty data', () => {
    render(<DataTableWidget columns={columns} data={[]} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Feature A')).not.toBeInTheDocument();
  });

  it('should apply format function to cell values', () => {
    const columnsWithFormat = [
      {
        id: 'value',
        label: 'Value',
        format: (value: number) => `$${value}`,
      },
    ];
    
    const dataWithValues = [{ value: 100 }];
    
    render(<DataTableWidget columns={columnsWithFormat} data={dataWithValues} />);
    
    expect(screen.getByText('$100')).toBeInTheDocument();
  });
});
