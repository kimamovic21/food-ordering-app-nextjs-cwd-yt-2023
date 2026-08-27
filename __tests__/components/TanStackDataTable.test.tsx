/**
 * @vitest-environment jsdom
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  createDataTableColumnHelper,
  TanStackDataTable,
  type DataTableColumnDef,
} from '@/components/shared/TanStackDataTable';

type TestRow = {
  name: string;
  role: string;
  total: number;
};

const rows: TestRow[] = [
  { name: 'Bob Admin', role: 'admin', total: 44 },
  { name: 'Alice Customer', role: 'user', total: 12 },
  { name: 'John Courier', role: 'courier', total: 20 },
];

const columnHelper = createDataTableColumnHelper<TestRow>();

const columns = columnHelper.columns([
  columnHelper.accessor((row) => row.name, {
    id: 'name',
    header: 'Name',
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => row.role, {
    id: 'role',
    header: 'Role',
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((row) => row.total, {
    id: 'total',
    header: 'Total',
    cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
  }),
]) satisfies DataTableColumnDef<TestRow>[];

describe('TanStackDataTable', () => {
  it('filters rows with global search', async () => {
    const user = userEvent.setup();

    render(
      <TanStackDataTable
        columns={columns}
        data={rows}
        tableKey='test-search-table'
        searchPlaceholder='Search test rows...'
      />
    );

    await user.type(screen.getByPlaceholderText('Search test rows...'), 'courier');

    expect(screen.getByText('John Courier')).toBeInTheDocument();
    expect(screen.queryByText('Alice Customer')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 3 rows')).toBeInTheDocument();
  });

  it('sorts and paginates rows', async () => {
    const user = userEvent.setup();

    render(
      <TanStackDataTable
        columns={columns}
        data={rows}
        tableKey='test-sort-pagination-table'
        initialPageSize={2}
      />
    );

    expect(screen.getByText('Alice Customer')).toBeInTheDocument();
    expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    expect(screen.queryByText('John Courier')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('John Courier')).toBeInTheDocument();
    expect(screen.queryByText('Alice Customer')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'First page' }));
    await user.click(screen.getByRole('button', { name: /Total/i }));
    await user.click(screen.getByRole('button', { name: /Total/i }));

    const bodyRows = screen.getAllByRole('row').slice(1);
    expect(within(bodyRows[0]).getByText('Alice Customer')).toBeInTheDocument();
  });

  it('renders all rows in simple mode without toolbar or pagination controls', () => {
    render(
      <TanStackDataTable
        columns={columns}
        data={rows}
        tableKey='test-simple-table'
        initialPageSize={1}
        showToolbar={false}
        showSearch={false}
        showColumnVisibility={false}
        showPagination={false}
      />
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Columns/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Page 1 of/i)).not.toBeInTheDocument();
    expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    expect(screen.getByText('Alice Customer')).toBeInTheDocument();
    expect(screen.getByText('John Courier')).toBeInTheDocument();
  });
});
