'use client';

import { useId, useState, type ReactNode } from 'react';
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type ColumnVisibilityState,
  type PaginationState,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Search,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/libs/utils';

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
});

export type DataTableColumnDef<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData,
  CellData
>;

export const createDataTableColumnHelper = <TData extends RowData>() =>
  createColumnHelper<typeof dataTableFeatures, TData>();

type TanStackDataTableProps<TData extends RowData> = {
  columns: DataTableColumnDef<TData>[];
  data: TData[];
  tableKey: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  initialPageSize?: number;
  initialSorting?: SortingState;
  minWidthClassName?: string;
  className?: string;
  columnLabels?: Record<string, string>;
  toolbarContent?: ReactNode;
  getRowClassName?: (row: TData) => string;
  getHeaderClassName?: (columnId: string) => string;
  getCellClassName?: (columnId: string, row: TData) => string;
  showToolbar?: boolean;
  showSearch?: boolean;
  showColumnVisibility?: boolean;
  showPagination?: boolean;
};

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') {
    return <ArrowUp className='size-4' aria-hidden='true' />;
  }

  if (direction === 'desc') {
    return <ArrowDown className='size-4' aria-hidden='true' />;
  }

  return <ArrowUpDown className='size-4 opacity-50' aria-hidden='true' />;
}

function getColumnLabel(columnId: string, columnLabels?: Record<string, string>) {
  return columnLabels?.[columnId] ?? columnId;
}

export function TanStackDataTable<TData extends RowData>({
  columns,
  data,
  tableKey,
  searchPlaceholder = 'Search table...',
  emptyMessage = 'No results found.',
  initialPageSize = 10,
  initialSorting = [],
  minWidthClassName = 'min-w-[760px]',
  className,
  columnLabels,
  toolbarContent,
  getRowClassName,
  getHeaderClassName,
  getCellClassName,
  showToolbar = true,
  showSearch = true,
  showColumnVisibility = true,
  showPagination = true,
}: TanStackDataTableProps<TData>) {
  const searchInputId = `${tableKey}-${useId()}-search`;
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const tablePagination = showPagination
    ? pagination
    : {
        pageIndex: 0,
        pageSize: Math.max(data.length, 1),
      };

  const table = useTable(
    {
      key: tableKey,
      data,
      columns,
      features: dataTableFeatures,
      state: {
        columnVisibility,
        globalFilter,
        pagination: tablePagination,
        sorting,
      },
      globalFilterFn: filterFn_includesString,
      onColumnVisibilityChange: setColumnVisibility,
      onGlobalFilterChange: setGlobalFilter,
      onPaginationChange: showPagination ? setPagination : () => undefined,
      onSortingChange: setSorting,
    },
    (state) => state
  );

  const filteredRowsCount = table.getFilteredRowModel().rows.length;
  const visibleColumnsCount = table.getVisibleLeafColumns().length;
  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  const shouldShowColumnVisibility = showColumnVisibility && hideableColumns.length > 0;
  const shouldShowToolbar =
    showToolbar && (showSearch || Boolean(toolbarContent) || shouldShowColumnVisibility);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-white/10 bg-card/70 shadow-sm',
        className
      )}
    >
      {shouldShowToolbar ? (
        <div className='flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between'>
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            {showSearch ? (
              <>
                <label className='sr-only' htmlFor={searchInputId}>
                  Search
                </label>
                <div className='relative w-full max-w-md'>
                  <Search
                    className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
                    aria-hidden='true'
                  />
                  <Input
                    id={searchInputId}
                    value={globalFilter}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    placeholder={searchPlaceholder}
                    className='h-11 rounded-full border-white/15 bg-background/70 pl-9 pr-10'
                  />
                  {globalFilter ? (
                    <button
                      type='button'
                      onClick={() => setGlobalFilter('')}
                      className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-white/10 hover:text-foreground'
                      aria-label='Clear search'
                    >
                      <X className='size-4' aria-hidden='true' />
                    </button>
                  ) : null}
                </div>
                <span className='hidden shrink-0 text-sm text-muted-foreground lg:inline'>
                  {filteredRowsCount} of {data.length} rows
                </span>
              </>
            ) : null}
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {toolbarContent}

            {shouldShowColumnVisibility ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type='button' variant='outline' className='h-10 gap-2 rounded-full'>
                    <Columns3 className='size-4' aria-hidden='true' />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-52'>
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hideableColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                      onSelect={(event) => event.preventDefault()}
                      className='capitalize'
                    >
                      {getColumnLabel(column.id, columnLabels)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className='overflow-x-auto'>
        <Table className={cn('w-full', minWidthClassName)}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                      getHeaderClassName?.(header.column.id)
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type='button'
                        onClick={header.column.getToggleSortingHandler()}
                        className='inline-flex items-center gap-2 rounded-md py-1 text-left transition hover:text-foreground'
                      >
                        <table.FlexRender header={header} />
                        <SortIcon direction={header.column.getIsSorted()} />
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    'border-white/10 transition hover:bg-white/[0.03]',
                    getRowClassName?.(row.original)
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'px-4 py-4 align-middle',
                        getCellClassName?.(cell.column.id, row.original)
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnsCount || columns.length}
                  className='h-32 text-center text-muted-foreground'
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination ? (
        <div className='flex flex-col gap-3 border-t border-white/10 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between'>
          <span>
            Page {tablePagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>

          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex items-center gap-2'>
              <span>Rows</span>
              <Select
                value={`${tablePagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className='h-9 w-[82px] rounded-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-center gap-1'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-9 rounded-full'
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label='First page'
              >
                <ChevronsLeft className='size-4' aria-hidden='true' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-9 rounded-full'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label='Previous page'
              >
                <ChevronLeft className='size-4' aria-hidden='true' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-9 rounded-full'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label='Next page'
              >
                <ChevronRight className='size-4' aria-hidden='true' />
              </Button>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-9 rounded-full'
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label='Last page'
              >
                <ChevronsRight className='size-4' aria-hidden='true' />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
