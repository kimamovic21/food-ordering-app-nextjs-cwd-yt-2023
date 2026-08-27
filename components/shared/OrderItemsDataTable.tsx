'use client';

import {
  createDataTableColumnHelper,
  TanStackDataTable,
  type DataTableColumnDef,
} from '@/components/shared/TanStackDataTable';

export type OrderItemsDataTableProduct = {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type OrderItemRow = OrderItemsDataTableProduct & {
  lineTotal: number;
};

type OrderItemsDataTableProps = {
  cartProducts: OrderItemsDataTableProduct[];
  tableKey: string;
};

const columnHelper = createDataTableColumnHelper<OrderItemRow>();

const orderItemsColumns = columnHelper.columns([
  columnHelper.accessor((item) => item.name, {
    id: 'name',
    header: 'Product Name',
    cell: ({ getValue }) => <span className='font-medium'>{getValue()}</span>,
  }),
  columnHelper.accessor((item) => item.size, {
    id: 'size',
    header: 'Size',
    cell: ({ getValue }) => <span className='capitalize'>{getValue()}</span>,
  }),
  columnHelper.accessor((item) => item.quantity, {
    id: 'quantity',
    header: 'Quantity',
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((item) => item.price, {
    id: 'price',
    header: 'Price',
    cell: ({ getValue }) => `$${getValue().toFixed(2)}`,
  }),
  columnHelper.accessor((item) => item.lineTotal, {
    id: 'lineTotal',
    header: 'Total',
    cell: ({ getValue }) => <span className='font-semibold'>${getValue().toFixed(2)}</span>,
  }),
]) satisfies DataTableColumnDef<OrderItemRow>[];

const alignNumericColumns = (columnId: string) => {
  if (columnId === 'quantity') {
    return 'text-center';
  }

  if (columnId === 'price' || columnId === 'lineTotal') {
    return 'text-right';
  }

  return '';
};

const OrderItemsDataTable = ({ cartProducts, tableKey }: OrderItemsDataTableProps) => {
  const rows = cartProducts.map((product) => ({
    ...product,
    lineTotal: product.price * product.quantity,
  }));

  return (
    <TanStackDataTable
      columns={orderItemsColumns}
      data={rows}
      tableKey={tableKey}
      emptyMessage='No order items found.'
      minWidthClassName='min-w-[640px]'
      className='border-border bg-background/40 shadow-none'
      showToolbar={false}
      showSearch={false}
      showColumnVisibility={false}
      showPagination={false}
      getHeaderClassName={alignNumericColumns}
      getCellClassName={alignNumericColumns}
    />
  );
};

export default OrderItemsDataTable;
