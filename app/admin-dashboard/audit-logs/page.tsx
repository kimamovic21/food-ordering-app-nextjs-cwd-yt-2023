'use client';

import { useEffect, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  createDataTableColumnHelper,
  TanStackDataTable,
  type DataTableColumnDef,
} from '@/components/shared/TanStackDataTable';
import Title from '@/components/shared/Title';
import { formatAppDateTime } from '@/libs/dateFormat';

type AuditLog = {
  _id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string | null;
};

const formatMetadata = (metadata: Record<string, unknown>) => {
  const entries = Object.entries(metadata || {}).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return 'No details';

  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ');
};

const columnHelper = createDataTableColumnHelper<AuditLog>();

const auditLogColumns = columnHelper.columns([
  columnHelper.accessor((log) => (log.createdAt ? new Date(log.createdAt).getTime() : 0), {
    id: 'createdAt',
    header: 'Time',
    sortDescFirst: true,
    cell: ({ row }) => formatAppDateTime(row.original.createdAt, 'Unknown'),
  }),
  columnHelper.accessor((log) => log.action, {
    id: 'action',
    header: 'Action',
    cell: ({ getValue }) => <span className='font-medium'>{getValue()}</span>,
  }),
  columnHelper.accessor((log) => `${log.actorEmail || 'System'} ${log.actorRole || ''}`, {
    id: 'actor',
    header: 'Actor',
    cell: ({ row }) => (
      <div>
        <div>{row.original.actorEmail || 'System'}</div>
        <div className='text-xs text-muted-foreground'>{row.original.actorRole || '-'}</div>
      </div>
    ),
  }),
  columnHelper.accessor((log) => `${log.entityType} ${log.entityId || ''}`, {
    id: 'entity',
    header: 'Entity',
    cell: ({ row }) => (
      <div>
        <div>{row.original.entityType}</div>
        <div className='text-xs text-muted-foreground'>{row.original.entityId || '-'}</div>
      </div>
    ),
  }),
  columnHelper.accessor((log) => formatMetadata(log.metadata), {
    id: 'details',
    header: 'Details',
    cell: ({ getValue }) => getValue(),
  }),
]) satisfies DataTableColumnDef<AuditLog>[];

const auditLogColumnLabels = {
  action: 'Action',
  actor: 'Actor',
  createdAt: 'Time',
  details: 'Details',
  entity: 'Entity',
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/audit-logs?page=${page}`);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || 'Failed to load audit logs');
        }

        setLogs(json.logs || []);
        setTotalPages(json.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page]);

  return (
    <div className='space-y-6'>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin-dashboard'>Admin Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Audit Logs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Title>Audit Logs</Title>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-3'>
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className='h-10 w-full' />
              ))}
            </div>
          ) : error ? (
            <p className='text-sm text-destructive'>{error}</p>
          ) : (
            <TanStackDataTable
              columns={auditLogColumns}
              data={logs}
              tableKey='audit-logs'
              searchPlaceholder='Search audit logs by time, actor, action, entity, or details...'
              emptyMessage='No audit logs yet.'
              initialSorting={[{ id: 'createdAt', desc: true }]}
              minWidthClassName='min-w-[900px]'
              columnLabels={auditLogColumnLabels}
              showPagination={false}
              getCellClassName={(columnId) =>
                columnId === 'createdAt'
                  ? 'whitespace-nowrap'
                  : columnId === 'details'
                    ? 'max-w-sm truncate text-muted-foreground'
                    : ''
              }
            />
          )}

          <div className='mt-4 flex items-center justify-between gap-3'>
            <Button
              type='button'
              variant='outline'
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <span className='text-sm text-muted-foreground'>
              Page {page} of {totalPages}
            </span>
            <Button
              type='button'
              variant='outline'
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPage;
