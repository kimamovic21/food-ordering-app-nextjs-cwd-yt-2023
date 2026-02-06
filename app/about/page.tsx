import Image from 'next/image';

const AboutPage = () => {
  return (
    <section className='mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 space-y-10'>
      <div className='grid gap-8 lg:grid-cols-2 items-start'>
        <div className='order-1 lg:order-2'>
          <div className='relative w-full overflow-hidden rounded-xl border bg-white'>
            <Image
              src='/pizza-hub.webp'
              alt='Pizza Hub storefront'
              width={1200}
              height={800}
              className='h-auto w-full object-cover'
              priority
            />
          </div>
        </div>

        <div className='order-2 lg:order-1 space-y-6'>
          <header className='space-y-3'>
            <h1 className='text-4xl font-bold tracking-tight text-foreground'>About Pizza Hub</h1>
            <p className='text-muted-foreground'>
              We&apos;re a neighborhood-first pizzeria crafting classic favorites and seasonal specials
              with honest ingredients, slow-fermented dough, and a whole lot of care.
            </p>
          </header>

          <section className='space-y-3'>
            <h2 className='text-2xl font-semibold text-foreground'>Our Story</h2>
            <p className='text-foreground'>
              Pizza Hub started with a simple idea: great pizza brings people together. From our
              first bake to our busiest weekends, we&apos;ve focused on doing the simple things well—
              thoughtfully sourced ingredients, time-tested methods, and warm hospitality.
            </p>
            <p className='text-foreground'>
              Our dough rests for at least 48 hours, developing flavor and texture naturally. Sauces
              are prepared in small batches, and toppings are prepped fresh every morning.
            </p>
          </section>

          <section className='space-y-3'>
            <h2 className='text-2xl font-semibold text-foreground'>What We Serve</h2>
            <ul className='list-disc pl-5 space-y-2 text-foreground'>
              <li>Signature pies like Margherita, Pepperoni, and Truffle Mushroom</li>
              <li>Rotating seasonal specials featuring local produce</li>
              <li>Fresh salads, house-made dips, and shareable sides</li>
              <li>Vegan and gluten-friendly options available</li>
            </ul>
          </section>
        </div>
      </div>

      <section className='space-y-3'>
        <h2 className='text-2xl font-semibold text-foreground'>Values That Guide Us</h2>
        <ul className='list-disc pl-5 space-y-2 text-foreground'>
          <li>
            Quality first: we prioritize ingredients, technique, and consistency over shortcuts.
          </li>
          <li>Community matters: we&apos;re proud to support local producers and events.</li>
          <li>
            Sustainability: we reduce waste and choose responsible packaging wherever possible.
          </li>
        </ul>
      </section>

      <section className='rounded-lg border border-border p-6 bg-card'>
        <h3 className='text-xl font-semibold mb-2 text-foreground'>Come By, Say Hi</h3>
        <p className='text-muted-foreground'>
          Whether it&apos;s a weeknight slice or a weekend feast, we&apos;d love to serve you.
        </p>
      </section>
    </section>
  );
};

export default AboutPage;
