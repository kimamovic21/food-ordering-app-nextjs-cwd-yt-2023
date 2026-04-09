import { UtensilsCrossed, Rocket, Smartphone } from 'lucide-react';

const features = [
  {
    icon: <UtensilsCrossed className='w-8 h-8 text-primary' />,
    title: 'Delicious Local Food',
    description: 'Meals prepared with fresh and high-quality ingredients.',
  },
  {
    icon: <Smartphone className='w-8 h-8 text-primary' />,
    title: 'Easy Ordering',
    description: 'Order your favorite meals easily and quickly through our website.',
  },
  {
    icon: <Rocket className='w-8 h-8 text-primary' />,
    title: 'Express Delivery',
    description: 'Your order arrives quickly and safely, wherever you are in the city.',
  },
];

const FeaturesSection = () => {
  return (
    <section className='py-12 bg-muted rounded-lg mt-14 mb-10'>
      <div className='container mx-auto px-4'>
        <h2 className='text-2xl font-bold text-center mb-8 text-primary'>Why Choose Us</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 text-center'>
          {features.map((feature, idx) => (
            <div
              key={idx}
              className='flex flex-col items-center bg-background rounded-lg shadow-lg p-6'
            >
              {feature.icon}
              <h3 className='mt-4 text-lg font-semibold'>{feature.title}</h3>
              <p className='mt-2 text-muted-foreground'>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
