'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AI_MENU_DESCRIPTION_MAX_CHARS } from '@/libs/menuItemDescription';
import { Loader2, Sparkles } from 'lucide-react';
import type { MenuItemCategory } from '@/types/menu';

interface MenuItemFormProps {
  name: string;
  categoryId: string;
  categories: MenuItemCategory[];
  description: string;
  priceType: string;
  priceSmall: string;
  priceMedium: string;
  priceLarge: string;
  isAvailable: boolean;
  editingItem: string | null;
  isSaving: boolean;
  isDescriptionGenerating?: boolean;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onGenerateDescription?: () => void;
  onPriceTypeChange: (value: string) => void;
  onPriceSmallChange: (value: string) => void;
  onPriceMediumChange: (value: string) => void;
  onPriceLargeChange: (value: string) => void;
  onAvailabilityChange: (value: boolean) => void;
  onCancel: () => void;
}

const MenuItemForm = ({
  name,
  categoryId,
  categories,
  description,
  priceType,
  priceSmall,
  priceMedium,
  priceLarge,
  isAvailable,
  editingItem,
  isSaving,
  isDescriptionGenerating = false,
  onNameChange,
  onCategoryChange,
  onDescriptionChange,
  onGenerateDescription,
  onPriceTypeChange,
  onPriceSmallChange,
  onPriceMediumChange,
  onPriceLargeChange,
  onAvailabilityChange,
  onCancel,
}: MenuItemFormProps) => {
  const canGenerateDescription = Boolean(
    onGenerateDescription && !isSaving && !isDescriptionGenerating && name.trim()
  );

  const handleDescriptionIconKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (!canGenerateDescription) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onGenerateDescription?.();
    }
  };

  return (
    <Card className='grow'>
      <CardContent className='space-y-4'>
        <div>
          <Label htmlFor='name' className='mb-2 block'>
            Menu item name
          </Label>
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
          <Label htmlFor='category' className='mb-2 block'>
            Category
          </Label>
          <Select value={categoryId} onValueChange={onCategoryChange} disabled={isSaving}>
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
          <Label htmlFor='description' className='mb-2 block'>
            Description
          </Label>
          <div className='relative'>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder='Classic tomato and mozzarella'
              disabled={isSaving}
              maxLength={AI_MENU_DESCRIPTION_MAX_CHARS}
              className='min-h-32 max-h-48 resize-y overflow-auto pr-12 pb-10 [field-sizing:fixed]'
            />
            {onGenerateDescription && (
              <Tooltip>
                <TooltipTrigger asChild>
                  {isDescriptionGenerating ? (
                    <Loader2
                      className='absolute bottom-3 right-3 size-5 animate-spin text-primary'
                      aria-label='Generating description'
                    />
                  ) : (
                    <Sparkles
                      className={`absolute bottom-3 right-3 size-5 transition-colors ${
                        canGenerateDescription
                          ? 'cursor-pointer text-primary hover:text-primary/75'
                          : 'cursor-not-allowed text-muted-foreground/50'
                      }`}
                      onClick={() => {
                        if (canGenerateDescription) onGenerateDescription();
                      }}
                      onKeyDown={handleDescriptionIconKeyDown}
                      role='button'
                      tabIndex={canGenerateDescription ? 0 : -1}
                      aria-disabled={!canGenerateDescription}
                      aria-label='Generate description'
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {isDescriptionGenerating
                    ? 'Generating description'
                    : canGenerateDescription
                      ? 'Generate description'
                      : 'Add a menu item name first'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            {description.length}/{AI_MENU_DESCRIPTION_MAX_CHARS}
          </p>
        </div>

        <div>
          <Label htmlFor='priceType' className='mb-2 block'>
            Price Type
          </Label>
          <Select value={priceType} onValueChange={onPriceTypeChange} disabled={isSaving}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select price type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='single'>Single price</SelectItem>
              <SelectItem value='double'>Two prices</SelectItem>
              <SelectItem value='triple'>Three prices</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className='mb-2 block'>
            Prices <span className='text-muted-foreground'>(USD)</span>
          </Label>
          <p className='text-sm text-muted-foreground mb-3'>
            {priceType === 'single'
              ? 'Enter one price'
              : priceType === 'double'
                ? 'Enter two prices'
                : 'Enter up to three prices'}
          </p>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            {priceType === 'single' ? (
              <>
                <div>
                  <Label htmlFor='priceSingle' className='mb-1 block text-xs'>
                    Price
                  </Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                      $
                    </span>
                    <Input
                      id='priceSingle'
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
                  <p className='text-xs text-muted-foreground mt-1'>Use one fixed price</p>
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
            ) : priceType === 'double' ? (
              <>
                <div>
                  <Label htmlFor='priceSmall' className='mb-1 block text-xs'>
                    Small
                  </Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                      $
                    </span>
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
                  <Label htmlFor='priceMedium' className='mb-1 block text-xs'>
                    Large
                  </Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                      $
                    </span>
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

                <div className='invisible'>
                  <Label className='mb-1 block text-xs'>Placeholder</Label>
                  <Input disabled className='pl-7' />
                  <p className='text-xs mt-1'>.</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor='priceSmall' className='mb-1 block text-xs'>
                    Small
                  </Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                      $
                    </span>
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
                  <Label htmlFor='priceMedium' className='mb-1 block text-xs'>
                    Medium
                  </Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                      $
                    </span>
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
                  <Label htmlFor='priceLarge' className='mb-1 block text-xs'>
                    Large
                  </Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                      $
                    </span>
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

        <label className='flex items-start gap-3 rounded-lg border bg-muted/30 p-3'>
          <Checkbox
            checked={isAvailable}
            onCheckedChange={(checked) => onAvailabilityChange(checked === true)}
            disabled={isSaving}
            className='mt-0.5'
          />
          <span className='space-y-1'>
            <span className='block text-sm font-semibold'>Available for ordering</span>
            <span className='block text-xs text-muted-foreground'>
              Turn this off when ingredients run out or the item cannot be prepared right now.
            </span>
          </span>
        </label>

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
