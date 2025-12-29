import { FaArrowCircleRight } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Pizza from '@/public/pizza.png';

const Hero = () => {
  return (
    <section className='mt-4 block md:grid md:grid-cols-[0.4fr_0.6fr]'>
      <div className='py-12'>
        <h1 className='text-4xl font-bold leading-12'>
          <span>Everything</span>
          <br />
          <span>is better with a</span>
          <br />
          <span className='text-primary'>Pizza</span>
        </h1>

        <p className='my-6 text-gray-500 dark:text-gray-400'>
          Pizza is the missing piece that makes every day complete
        </p>

        <div className='flex gap-4'>
          <Button className='uppercase rounded-full' size='lg'>
            Order now <FaArrowCircleRight />
          </Button>

          <Button variant='outline' className='rounded-full' size='lg'>
            Learn more <FaArrowCircleRight />
          </Button>
        </div>
      </div>

      <div className='relative'>
        <Image src={Pizza} alt='Pizza Cover' layout='fill' objectFit='contain' />
      </div>
    </section>
  );
};

export default Hero;
