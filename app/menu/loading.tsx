'use client';

import MenuPageSkeleton from './MenuPageSkeleton';

const MenuPageLoading = () => {
  return (
    <main className='max-w-7xl mx-auto px-4 py-12'>
      <MenuPageSkeleton sectionCount={1} cardsPerSection={3} />
    </main>
  );
};

export default MenuPageLoading;
