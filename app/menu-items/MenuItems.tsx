import Image from 'next/image';

interface MenuItem {
  _id: string;
  image?: string;
  name: string;
  description: string;
  category?: { _id: string; name: string } | string;
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
}

interface MenuItemsProps {
  menuItems: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

type CategoryConfig = {
  label: string;
  matchers: string[];
};

const categories: CategoryConfig[] = [
  { label: 'Pizza', matchers: ['pizza'] },
  { label: 'Pasta', matchers: ['pasta'] },
  { label: 'Desserts', matchers: ['desserts', 'deserts'] },
  { label: 'Soup', matchers: ['soup', 'soups'] },
  { label: 'Coffee', matchers: ['coffee', 'coffee'] },
];

const getCategoryName = (item: MenuItem) => {
  if (typeof item.category === 'string') return item.category.toLowerCase();
  return item.category?.name?.toLowerCase() || '';
};

const AdminItemCard = ({ item, onEdit, onDelete }: { item: MenuItem; onEdit: (i: MenuItem) => void; onDelete: (id: string) => void }) => (
  <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition'>
    <div className='relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 shrink-0'>
      {item.image ? (
        <Image src={item.image} alt={item.name} fill className='object-cover' />
      ) : (
        <div className='w-full h-full flex items-center justify-center text-gray-400 text-xs'>No image</div>
      )}
    </div>

    <div className='grow'>
      <h3 className='font-semibold text-lg'>{item.name}</h3>
      {item.category && (
        <p className='text-xs text-gray-500'>
          Category: {typeof item.category === 'string' ? item.category : item.category?.name}
        </p>
      )}
      {item.description && <p className='text-gray-600 text-sm'>{item.description}</p>}

      {item.priceSmall !== undefined && item.priceMedium !== undefined && item.priceLarge !== undefined ? (
        <div className='flex gap-3 mt-2'>
          <span className='text-sm'>
            <span className='text-gray-600'>S:</span>{' '}
            <span className='font-semibold text-primary'>${item.priceSmall.toFixed(2)}</span>
          </span>
          <span className='text-sm'>
            <span className='text-gray-600'>M:</span>{' '}
            <span className='font-semibold text-primary'>${item.priceMedium.toFixed(2)}</span>
          </span>
          <span className='text-sm'>
            <span className='text-gray-600'>L:</span>{' '}
            <span className='font-semibold text-primary'>${item.priceLarge.toFixed(2)}</span>
          </span>
        </div>
      ) : (
        <p className='text-red-500 text-sm mt-1'>Prices missing - please edit this item</p>
      )}
    </div>

    <div className='block md:flex gap-2 shrink-0'>
      <button onClick={() => onEdit(item)} className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition'>
        Edit
      </button>
      <button onClick={() => onDelete(item._id)} className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition'>
        Delete
      </button>
    </div>
  </div>
);

const MenuItems = ({ menuItems, onEdit, onDelete }: MenuItemsProps) => {
  if (menuItems.length === 0) {
    return (
      <div className='mt-12'>
        <h2 className='text-2xl font-semibold mb-4'>Menu Items</h2>
        <p className='text-gray-500 text-center py-8'>No menu items yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className='mt-12'>
      <h2 className='text-2xl font-semibold mb-6'>Menu Items</h2>

      <div className='space-y-10'>
        {categories.map((cat) => {
          const items = menuItems.filter((mi) => cat.matchers.some((m) => getCategoryName(mi) === m));
          return (
            <section key={cat.label}>
              <h3 className='text-xl font-semibold mb-4'>{cat.label}</h3>
              {items.length > 0 ? (
                <div className='grid grid-cols-1 gap-4'>
                  {items.map((item) => (
                    <AdminItemCard key={item._id} item={item} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              ) : (
                <p className='text-gray-500'>No menu items found at the moment.</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default MenuItems;