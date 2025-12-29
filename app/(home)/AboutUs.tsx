const AboutUs = () => {
  return (
    <section className='text-center my-16'>
      <h3 className='uppercase text-gray-500 dark:text-gray-400 font-semibold leading-3'>
        Our story
      </h3>

      <h2 className='text-primary font-bold text-4xl italic'>About us</h2>

      <div className='text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-8 flex flex-col gap-4'>
        <p>
          Welcome to Pizza Hub, where passion meets dough! Since opening our doors, we've been
          dedicated to serving the freshest, most delicious pizzas in town. Our secret lies in our
          handmade crust, rich tomato sauce, and locally sourced ingredients. Whether you're craving
          a classic Margherita or feeling adventurous, our menu has something for everyone. Every
          day at Pizza Hub is a celebration of flavor and community—come share a slice with us!
        </p>
        <p>
          Our team believes in bringing people together through great food and friendly service.
          Every pizza is crafted with love, ensuring a memorable experience for every guest.
        </p>
      </div>
    </section>
  );
};

export default AboutUs;
