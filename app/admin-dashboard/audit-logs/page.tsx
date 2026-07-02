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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
          ) : logs.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No audit logs yet.</p>
          ) : (
            <div className='overflow-x-auto'>
              <Table className='min-w-[900px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className='whitespace-nowrap'>
                        {formatAppDateTime(log.createdAt, 'Unknown')}
                      </TableCell>
                      <TableCell className='font-medium'>{log.action}</TableCell>
                      <TableCell>
                        <div>{log.actorEmail || 'System'}</div>
                        <div className='text-xs text-muted-foreground'>{log.actorRole || '-'}</div>
                      </TableCell>
                      <TableCell>
                        <div>{log.entityType}</div>
                        <div className='text-xs text-muted-foreground'>{log.entityId || '-'}</div>
                      </TableCell>
                      <TableCell className='max-w-sm truncate text-muted-foreground'>
                        {formatMetadata(log.metadata)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
