interface MenuItemFormProps {
  name: string;
  description: string;
  basePrice: string;
  editingItem: string | null;
  isSaving: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onBasePriceChange: (value: string) => void;
  onCancel: () => void;
}

const MenuItemForm = ({
  name,
  description,
  basePrice,
  editingItem,
  isSaving,
  onNameChange,
  onDescriptionChange,
  onBasePriceChange,
  onCancel,
}: MenuItemFormProps) => {
  return (
    <div className='grow space-y-4'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Menu item name
        </label>
        <input
          type='text'
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder='Pizza Margherita'
          disabled={isSaving}
          className='w-full rounded-lg border border-gray-300 bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Description
        </label>
        <input
          type='text'
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder='Classic tomato and mozzarella'
          disabled={isSaving}
          className='w-full rounded-lg border border-gray-300 bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Base Price <span className='text-gray-400'>(USD)</span>
        </label>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <span className='text-gray-500'>$</span>
          </div>
          <input
            type='number'
            step='0.01'
            min='0'
            value={basePrice}
            onChange={(e) => onBasePriceChange(e.target.value)}
            placeholder='9.99'
            disabled={isSaving}
            className='pl-7 w-full rounded-lg border border-gray-300 bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition'
          />
        </div>
      </div>

      <div className='flex gap-2 pt-2'>
        <button
          type='submit'
          className='grow bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:bg-gray-100 disabled:cursor-not-allowed'
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
        </button>
        {editingItem && (
          <button
            type='button'
            onClick={onCancel}
            className='px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition disabled:bg-gray-200 disabled:cursor-not-allowed'
            disabled={isSaving}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuItemForm;