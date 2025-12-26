import Hero from './Hero';
import HomeMenu from './HomeMenu';
import AboutUs from './AboutUs';
import ContactUs from './ContactUs';

const HomePage = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return (
    <>
      <Hero />
      <HomeMenu />
      <AboutUs />
      <ContactUs />
    </>
  );
};

export default HomePage;