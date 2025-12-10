import Image from 'next/image';

interface MenuItem {
  _id: string;
  image?: string;
  name: string;
  description: string;
  basePrice: number;
}

interface MenuItemsProps {
  menuItems: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

const MenuItems = ({ menuItems, onEdit, onDelete }: MenuItemsProps) => {
  return (
    <div className='mt-12 max-w-2xl mx-auto'>
      <h2 className='text-2xl font-semibold mb-4'>Menu Items</h2>

      {menuItems.length === 0 ? (
        <p className='text-gray-500 text-center py-8'>
          No menu items yet. Create your first one!
        </p>
      ) : (
        <div className='grid gap-4'>
          {menuItems.map((item) => (
            <div
              key={item._id}
              className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition'
            >
              <div className='relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 shrink-0'>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-gray-400 text-xs'>
                    No image
                  </div>
                )}
              </div>

              <div className='grow'>
                <h3 className='font-semibold text-lg'>{item.name}</h3>
                {item.description && (
                  <p className='text-gray-600 text-sm'>{item.description}</p>
                )}
                <p className='text-primary font-semibold mt-1'>
                  ${item.basePrice.toFixed(2)}
                </p>
              </div>

              <div className='flex gap-2 shrink-0'>
                <button
                  onClick={() => onEdit(item)}
                  className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition'
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item._id)}
                  className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition'
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuItems;