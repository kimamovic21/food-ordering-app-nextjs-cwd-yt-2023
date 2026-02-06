import Image from 'next/image';

const ContactPage = () => {
  return (
    <section className='mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 space-y-10'>
      <div className='grid gap-8 lg:grid-cols-2 items-start'>
        <div className='order-1 lg:order-2'>
          <div className='relative w-full overflow-hidden rounded-xl border bg-white'>
            <Image
              src='/pizza-contact.jpg'
              alt='Pizza Hub contact and storefront'
              width={1200}
              height={800}
              className='h-auto w-full object-cover'
              priority
            />
          </div>
        </div>

        <div className='order-2 lg:order-1 space-y-6'>
          <header className='space-y-3'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground'>Contact Pizza Hub</h1>
            <p className='text-muted-foreground'>
              Questions, feedback, or catering inquiries? We&apos;re here to help.
            </p>
          </header>

          <section className='space-y-3'>
            <h2 className='text-2xl font-semibold text-foreground'>Get In Touch</h2>
            <ul className='space-y-2 text-foreground'>
              <li>
                <span className='font-medium'>Email:</span>{' '}
                <a className='text-primary hover:underline' href='mailto:hello@pizzahub.example'>
                  hello@pizzahub.example
                </a>
              </li>
              <li>
                <span className='font-medium'>Phone:</span>{' '}
                <a className='text-primary hover:underline' href='tel:+1234567890'>
                  +1 (234) 567-890
                </a>
              </li>
              <li>
                <span className='font-medium'>Address:</span>
                <address className='not-italic text-muted-foreground'>
                  123 Pizza Lane, Flavor Town, USA
                </address>
              </li>
            </ul>
          </section>

          <section className='space-y-3'>
            <h2 className='text-2xl font-semibold text-foreground'>Hours</h2>
            <ul className='space-y-1 text-muted-foreground'>
              <li>Mon - Thu: 11:00 AM - 9:00 PM</li>
              <li>Fri - Sat: 11:00 AM - 10:30 PM</li>
              <li>Sun: 12:00 PM - 8:00 PM</li>
            </ul>
            <p className='text-muted-foreground'>Online ordering is available during open hours.</p>
          </section>
        </div>
      </div>

      <section className='rounded-lg border border-border p-6 bg-card'>
        <h3 className='text-xl font-semibold mb-2 text-foreground'>Catering & Events</h3>
        <p className='text-muted-foreground'>
          Planning something special? Reach out and we&apos;ll help you build a crowd-pleasing menu.
        </p>
      </section>
    </section>
  );
};

export default ContactPage;
