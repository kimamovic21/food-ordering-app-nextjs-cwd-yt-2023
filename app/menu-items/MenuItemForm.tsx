'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface MenuItemFormProps {
  name: string;
  categoryId: string;
  categories: Array<{ _id: string; name: string }>;
  description: string;
  foodType: string;
  priceSmall: string;
  priceMedium: string;
  priceLarge: string;
  editingItem: string | null;
  isSaving: boolean;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onFoodTypeChange: (value: string) => void;
  onPriceSmallChange: (value: string) => void;
  onPriceMediumChange: (value: string) => void;
  onPriceLargeChange: (value: string) => void;
  onCancel: () => void;
}

const MenuItemForm = ({
  name,
  categoryId,
  categories,
  description,
  foodType,
  priceSmall,
  priceMedium,
  priceLarge,
  editingItem,
  isSaving,
  onNameChange,
  onCategoryChange,
  onDescriptionChange,
  onFoodTypeChange,
  onPriceSmallChange,
  onPriceMediumChange,
  onPriceLargeChange,
  onCancel,
}: MenuItemFormProps) => {
  return (
    <Card className='grow'>
      <CardContent className='space-y-4'>
        <div>
          <Label htmlFor='name' className='mb-1 block'>Menu item name</Label>
          <Input
            id='name'
            type='text'
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder='Pizza Margherita'
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor='category' className='mb-1 block'>Category</Label>
          <Select
            value={categoryId}
            onValueChange={onCategoryChange}
            disabled={isSaving}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a category' />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category._id} value={category._id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor='description' className='mb-1 block'>Description</Label>
          <Textarea
            id='description'
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder='Classic tomato and mozzarella'
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor='foodType' className='mb-1 block'>Food Type</Label>
          <Select
            value={foodType}
            onValueChange={onFoodTypeChange}
            disabled={isSaving}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select food type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='food'>Food</SelectItem>
              <SelectItem value='drink'>Drink</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className='mb-2 block'>Prices <span className='text-muted-foreground'>(USD)</span></Label>
          <p className='text-sm text-muted-foreground mb-3'>
            {foodType === 'drink' ? 'Enter price for your drink' : 'Enter one or more prices'}
          </p>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            {foodType === 'drink' ? (
              <>
                <div>
                  <Label htmlFor='priceDrink' className='mb-1 block text-xs'>Price</Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>$</span>
                    <Input
                      id='priceDrink'
                      type='number'
                      step='0.01'
                      min='0'
                      value={priceSmall}
                      onChange={(e) => onPriceSmallChange(e.target.value)}
                      placeholder='2.99'
                      disabled={isSaving}
                      className='pl-7'
                    />
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>Drinks have a single price</p>
                </div>
                <div className='invisible'>
                  <Label className='mb-1 block text-xs'>Placeholder</Label>
                  <Input disabled className='pl-7' />
                  <p className='text-xs mt-1'>.</p>
                </div>
                <div className='invisible'>
                  <Label className='mb-1 block text-xs'>Placeholder</Label>
                  <Input disabled className='pl-7' />
                  <p className='text-xs mt-1'>.</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor='priceSmall' className='mb-1 block text-xs'>Small</Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>$</span>
                    <Input
                      id='priceSmall'
                      type='number'
                      step='0.01'
                      min='0'
                      value={priceSmall}
                      onChange={(e) => onPriceSmallChange(e.target.value)}
                      placeholder='8.99'
                      disabled={isSaving}
                      className='pl-7'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='priceMedium' className='mb-1 block text-xs'>Medium</Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>$</span>
                    <Input
                      id='priceMedium'
                      type='number'
                      step='0.01'
                      min='0'
                      value={priceMedium}
                      onChange={(e) => onPriceMediumChange(e.target.value)}
                      placeholder='11.99'
                      disabled={isSaving}
                      className='pl-7'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='priceLarge' className='mb-1 block text-xs'>Large</Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>$</span>
                    <Input
                      id='priceLarge'
                      type='number'
                      step='0.01'
                      min='0'
                      value={priceLarge}
                      onChange={(e) => onPriceLargeChange(e.target.value)}
                      placeholder='14.99'
                      disabled={isSaving}
                      className='pl-7'
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className='flex gap-2 pt-2'>
          <Button type='submit' className='grow' disabled={isSaving}>
            {isSaving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
          </Button>
          {editingItem && (
            <Button type='button' variant='outline' onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuItemForm;