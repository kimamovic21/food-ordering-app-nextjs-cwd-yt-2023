'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import Title from '@/components/shared/Title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import useProfile from '@/hooks/useProfile';
import { formatAppDateTime } from '@/libs/dateFormat';

type SupportTicket = {
  _id: string;
  orderId?:
    | string
    | {
        _id: string;
        email: string;
        orderStatus: string;
        total: number;
        createdAt: string;
      }
    | null;
  restaurantId?:
    | string
    | {
        _id: string;
        name: string;
      }
    | null;
  target: 'restaurant_support' | 'app_support';
  category: string;
  subject: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved';
  priority: 'low' | 'normal' | 'high';
  responseNote?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
};

const statusLabels = {
  open: 'Open',
  in_review: 'In review',
  resolved: 'Resolved',
};

const statusFilterOptions = ['all', 'open', 'in_review', 'resolved'] as const;
type StatusFilter = (typeof statusFilterOptions)[number];

const categoryLabels: Record<string, string> = {
  order_issue: 'Order issue',
  delivery_issue: 'Delivery issue',
  food_quality: 'Food quality',
  missing_item: 'Missing item',
  wrong_item: 'Wrong item',
  courier_issue: 'Courier issue',
  app_issue: 'App issue',
  other: 'Other',
};

const getStatusClass = (status: SupportTicket['status']) => {
  if (status === 'open') {
    return 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-100';
  }

  if (status === 'in_review') {
    return 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-100';
  }

  return 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-100';
};

const getId = (value: string | { _id: string } | null | undefined) =>
  typeof value === 'string' ? value : value?._id || '';

const MyReportsPage = () => {
  const { data: profileData, loading: profileLoading } = useProfile();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsStringLiteral(statusFilterOptions).withDefault('all')
  );

  const fetchTickets = useCallback(async () => {
    if (!profileData?.email) {
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/support-tickets?${params.toString()}`, {
        cache: 'no-store',
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to load reports');
      }

      setTickets(Array.isArray(json.tickets) ? json.tickets : []);
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [profileData?.email, statusFilter]);

  useEffect(() => {
    if (!profileLoading) {
      void fetchTickets();
    }
  }, [fetchTickets, profileLoading]);

  const ticketStats = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === 'open').length,
      inReview: tickets.filter((ticket) => ticket.status === 'in_review').length,
      resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
    }),
    [tickets]
  );

  if (profileLoading || loading) {
    return (
      <section className='mx-auto max-w-6xl px-4 py-8'>
        <Skeleton className='mb-4 h-9 w-48' />
        <Skeleton className='mb-6 h-4 w-96 max-w-full' />
        <div className='grid gap-4 md:grid-cols-3'>
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className='h-24 rounded-xl' />
          ))}
        </div>
      </section>
    );
  }

  if (!profileData?.email) {
    return (
      <section className='mx-auto max-w-3xl px-4 py-12 text-center'>
        <Title>My Reports</Title>
        <p className='mt-3 text-muted-foreground'>Please sign in to view your support reports.</p>
      </section>
    );
  }

  return (
    <section className='mx-auto max-w-6xl px-4 py-8'>
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <Title>My Reports</Title>
          <p className='mt-2 text-sm text-muted-foreground'>
            Follow problem reports you sent to restaurant support or app support.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              void setStatusFilter(value as StatusFilter);
            }}
          >
            <SelectTrigger className='w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All statuses</SelectItem>
              <SelectItem value='open'>Open</SelectItem>
              <SelectItem value='in_review'>In review</SelectItem>
              <SelectItem value='resolved'>Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button type='button' variant='outline' onClick={() => fetchTickets()} className='gap-2'>
            <RefreshCw className='size-4' />
            Refresh
          </Button>
        </div>
      </div>

      <div className='mb-6 grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Open</CardDescription>
            <CardTitle>{ticketStats.open}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>In review</CardDescription>
            <CardTitle>{ticketStats.inReview}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Resolved</CardDescription>
            <CardTitle>{ticketStats.resolved}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <AlertCircle className='mx-auto mb-3 size-10 text-muted-foreground' />
            <p className='font-medium'>No reports found</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Reports you send from order or delivery pages will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {tickets.map((ticket) => {
            const orderId = getId(ticket.orderId);
            const restaurant =
              typeof ticket.restaurantId === 'object' && ticket.restaurantId
                ? ticket.restaurantId
                : null;

            return (
              <Card key={ticket._id}>
                <CardHeader>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='space-y-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge className={getStatusClass(ticket.status)}>
                          {statusLabels[ticket.status]}
                        </Badge>
                        <Badge variant='outline'>{categoryLabels[ticket.category]}</Badge>
                        <Badge variant='secondary'>
                          {ticket.target === 'app_support'
                            ? 'App support'
                            : restaurant?.name || 'Restaurant support'}
                        </Badge>
                      </div>
                      <CardTitle>{ticket.subject}</CardTitle>
                      <CardDescription>
                        Sent on {formatAppDateTime(ticket.createdAt)}
                      </CardDescription>
                    </div>
                    {orderId && (
                      <Button asChild variant='outline' size='sm' className='gap-2'>
                        <Link href={`/my-orders/${orderId}`}>
                          <ExternalLink className='size-4' />
                          Order
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed'>
                    {ticket.description}
                  </div>

                  {(ticket.contactEmail || ticket.contactPhone) && (
                    <div className='rounded-lg border p-4 text-sm'>
                      <p className='mb-2 font-semibold'>Follow-up contact</p>
                      <div className='grid gap-2 sm:grid-cols-2'>
                        {ticket.contactEmail && (
                          <div>
                            <span className='text-muted-foreground'>Email</span>
                            <p>{ticket.contactEmail}</p>
                          </div>
                        )}
                        {ticket.contactPhone && (
                          <div>
                            <span className='text-muted-foreground'>Mobile phone</span>
                            <p>{ticket.contactPhone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {ticket.responseNote ? (
                    <div className='rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950/30'>
                      <p className='mb-1 font-semibold text-green-800 dark:text-green-100'>
                        Support response
                      </p>
                      <p className='whitespace-pre-wrap text-green-900 dark:text-green-100/90'>
                        {ticket.responseNote}
                      </p>
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      Support has not added a response note yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MyReportsPage;
