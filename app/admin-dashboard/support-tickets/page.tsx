'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { sonnerToast } from '@/components/shared/SonnerToastComponent';
import useProfile from '@/hooks/useProfile';
import { formatAppDateTime } from '@/libs/dateFormat';

type SupportTicket = {
  _id: string;
  reporterId?:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
  reporterRole: 'user' | 'courier' | 'admin';
  reporterName: string;
  reporterEmail: string;
  contactEmail?: string;
  contactPhone?: string;
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

const SupportTicketsPage = () => {
  const { data: profileData, loading: profileLoading } = useProfile();
  const [{ status: statusFilter, ticketId }, setTicketQuery] = useQueryStates({
    status: parseAsStringLiteral(statusFilterOptions).withDefault('all'),
    ticketId: parseAsString.withDefault(''),
  });
  const highlightedTicketId = ticketId.trim();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});

  const isAdmin = profileData?.role === 'admin';

  const fetchTickets = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (highlightedTicketId) {
        params.set('ticketId', highlightedTicketId);
      }

      const response = await fetch(`/api/support-tickets?${params.toString()}`, {
        cache: 'no-store',
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to load support tickets');
      }

      const nextTickets = Array.isArray(json.tickets) ? json.tickets : [];
      setTickets(nextTickets);
      setResponseNotes(
        Object.fromEntries(
          nextTickets.map((ticket: SupportTicket) => [ticket._id, ticket.responseNote || ''])
        )
      );
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [highlightedTicketId, isAdmin, statusFilter]);

  useEffect(() => {
    if (!profileLoading && isAdmin) {
      void fetchTickets();
    }
  }, [fetchTickets, isAdmin, profileLoading]);

  const ticketStats = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === 'open').length,
      inReview: tickets.filter((ticket) => ticket.status === 'in_review').length,
      resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
    }),
    [tickets]
  );

  const updateTicket = async (ticketId: string, status: SupportTicket['status']) => {
    setUpdatingTicketId(ticketId);

    try {
      const response = await fetch('/api/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status,
          responseNote: responseNotes[ticketId] || '',
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to update ticket');
      }

      setTickets((current) =>
        current.map((ticket) => (ticket._id === ticketId ? json.ticket : ticket))
      );
      sonnerToast.success('Ticket updated');
    } catch (error) {
      sonnerToast.error(error instanceof Error ? error.message : 'Failed to update ticket');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  if (profileLoading || loading) {
    return (
      <section className='space-y-6'>
        <Skeleton className='h-10 w-64' />
        <div className='grid gap-4 md:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-28 rounded-lg' />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className='h-56 rounded-lg' />
        ))}
      </section>
    );
  }

  if (!isAdmin) {
    return <p className='text-sm text-muted-foreground'>Only admins can view support tickets.</p>;
  }

  return (
    <section className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <Title>Support Tickets</Title>
          <p className='mt-2 text-sm text-muted-foreground'>
            Review reported order, delivery, and app issues from customers and couriers.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              void setTicketQuery({ status: value as StatusFilter });
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

      <div className='grid gap-4 md:grid-cols-3'>
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
          <CardContent className='py-10 text-center text-sm text-muted-foreground'>
            No support tickets found.
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {tickets.map((ticket) => {
            const orderId = getId(ticket.orderId);
            const reporter =
              typeof ticket.reporterId === 'object' && ticket.reporterId ? ticket.reporterId : null;
            const restaurant =
              typeof ticket.restaurantId === 'object' && ticket.restaurantId
                ? ticket.restaurantId
                : null;

            return (
              <Card
                key={ticket._id}
                className={
                  highlightedTicketId === ticket._id ? 'border-primary shadow-md' : undefined
                }
              >
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
                        Reported by {reporter?.name || ticket.reporterName || ticket.reporterEmail}{' '}
                        ({ticket.reporterRole}) on {formatAppDateTime(ticket.createdAt)}
                      </CardDescription>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {orderId && (
                        <Button asChild variant='outline' size='sm' className='gap-2'>
                          <Link href={`/admin-dashboard/orders/${orderId}`}>
                            <ExternalLink className='size-4' />
                            Order
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed'>
                    {ticket.description}
                  </div>

                  {(ticket.contactEmail || ticket.contactPhone || ticket.reporterEmail) && (
                    <div className='rounded-lg border p-4 text-sm'>
                      <p className='mb-2 font-semibold'>Reporter contact</p>
                      <div className='grid gap-2 sm:grid-cols-2'>
                        <div>
                          <span className='text-muted-foreground'>Email</span>
                          <p>{ticket.contactEmail || ticket.reporterEmail}</p>
                        </div>
                        {ticket.contactPhone && (
                          <div>
                            <span className='text-muted-foreground'>Mobile phone</span>
                            <p>{ticket.contactPhone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className='space-y-2'>
                    <label htmlFor={`response-note-${ticket._id}`} className='text-sm font-medium'>
                      Internal response note
                    </label>
                    <Textarea
                      id={`response-note-${ticket._id}`}
                      value={responseNotes[ticket._id] || ''}
                      onChange={(event) =>
                        setResponseNotes((current) => ({
                          ...current,
                          [ticket._id]: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder='Add what was checked or how this was handled.'
                    />
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => updateTicket(ticket._id, 'in_review')}
                      disabled={updatingTicketId === ticket._id || ticket.status === 'in_review'}
                    >
                      Mark in review
                    </Button>
                    <Button
                      type='button'
                      onClick={() => updateTicket(ticket._id, 'resolved')}
                      disabled={updatingTicketId === ticket._id || ticket.status === 'resolved'}
                      className='gap-2'
                    >
                      <CheckCircle2 className='size-4' />
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

const SupportTicketsPageWithSuspense = () => (
  <Suspense
    fallback={
      <section className='space-y-6'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-28 rounded-lg' />
      </section>
    }
  >
    <SupportTicketsPage />
  </Suspense>
);

export default SupportTicketsPageWithSuspense;
