const ContactUs = () => {
  return (
    <section className='text-center my-16'>
      <h3 className='uppercase text-gray-500 dark:text-gray-400 font-semibold leading-3 mb-2'>
        Contact us
      </h3>

      <h2 className='text-primary font-bold text-3xl italic mb-4'>We're here to help!</h2>

      <div className='text-gray-600 dark:text-gray-300 mb-2'>
        <span>Call us at: </span>
        <span className='font-mono font-semibold'>(415) 555-0198</span>
      </div>

      <div className='text-gray-600 dark:text-gray-300'>
        <span>Or email: </span>
        <a href='mailto:info@pizzahub.com' className='underline text-primary'>
          info@pizzahub.com
        </a>
      </div>
    </section>
  );
};

export default ContactUs;
