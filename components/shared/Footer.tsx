const Footer = () => {
  return (
    <footer>
      <div className='bg-primary text-white text-center py-4'>
        <span>&copy; </span>
        <span>{new Date().getFullYear()} </span>
        <span>Pizza Hub. All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer;