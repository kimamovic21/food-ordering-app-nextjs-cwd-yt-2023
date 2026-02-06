import { Skeleton } from '@/components/ui/skeleton';

const ContactLoading = () => {
  return (
    <section className='mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 space-y-10'>
      <div className='grid gap-8 lg:grid-cols-2 items-start'>
        {/* Image Skeleton */}
        <div className='order-1 lg:order-2'>
          <div className='relative w-full overflow-hidden rounded-xl border bg-white'>
            <Skeleton className='w-full h-64 md:h-96 rounded-xl' />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className='order-2 lg:order-1 space-y-6'>
          {/* Header Section */}
          <header className='space-y-3'>
            <Skeleton className='h-10 w-3/4 rounded-md' />
            <Skeleton className='h-5 w-full rounded-md' />
            <Skeleton className='h-5 w-5/6 rounded-md' />
          </header>

          {/* Get In Touch Section */}
          <section className='space-y-3'>
            <Skeleton className='h-8 w-1/3 rounded-md' />
            <div className='space-y-2'>
              <Skeleton className='h-5 w-full rounded-md' />
              <Skeleton className='h-5 w-full rounded-md' />
              <Skeleton className='h-5 w-full rounded-md' />
            </div>
          </section>

          {/* Hours Section */}
          <section className='space-y-3'>
            <Skeleton className='h-8 w-1/3 rounded-md' />
            <div className='space-y-1'>
              <Skeleton className='h-5 w-full rounded-md' />
              <Skeleton className='h-5 w-full rounded-md' />
              <Skeleton className='h-5 w-full rounded-md' />
            </div>
            <Skeleton className='h-5 w-full rounded-md' />
          </section>
        </div>
      </div>

      {/* Catering & Events Section */}
      <section className='rounded-lg border border-border p-6 bg-card'>
        <Skeleton className='h-7 w-1/4 rounded-md mb-2' />
        <Skeleton className='h-5 w-full rounded-md' />
        <Skeleton className='h-5 w-5/6 rounded-md mt-2' />
      </section>
    </section>
  );
};

export default ContactLoading;
