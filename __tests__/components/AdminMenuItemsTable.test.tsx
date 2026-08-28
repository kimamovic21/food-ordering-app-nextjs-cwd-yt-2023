/**
 * @vitest-environment jsdom
 */

import type { ImgHTMLAttributes } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MenuItems from '@/app/admin-dashboard/menu-items/MenuItems';

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  src: string;
  alt: string;
};

vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, ...props }: MockImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

const categories = [
  { _id: 'pizzas', name: 'Pizzas' },
  { _id: 'coffee', name: 'Coffee' },
];

const menuItems = [
  {
    _id: 'pizza-1',
    image: 'https://example.com/pizza.jpg',
    name: 'Pizza Napolitana',
    description:
      'Classic pizza with tomatoes, mozzarella, fresh basil, olive oil, oregano, and a crisp crust finished in a hot oven for a balanced bite.',
    category: 'pizzas',
    priceType: 'triple',
    priceSmall: 6.9,
    priceMedium: 11.9,
    priceLarge: 13.9,
    isAvailable: true,
  },
  {
    _id: 'burger-1',
    image: 'https://example.com/burger.jpg',
    name: 'Macchiato Coffee',
    description: 'Bold espresso with a small cloud of steamed milk.',
    category: 'coffee',
    priceType: 'double',
    priceSmall: 8.9,
    priceMedium: 10.9,
    priceLarge: null,
    isAvailable: false,
  },
];

describe('admin MenuItems table', () => {
  it('renders menu items with availability counts and action controls', () => {
    render(
      <MenuItems
        menuItems={menuItems}
        categories={categories}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleAvailability={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Search menu items/i)).toBeInTheDocument();
    expect(screen.getByText('1 available')).toBeInTheDocument();
    expect(screen.getByText('1 unavailable')).toBeInTheDocument();
    expect(screen.getByText('Pizza Napolitana')).toBeInTheDocument();
    expect(screen.getByText('Macchiato Coffee')).toBeInTheDocument();
    expect(screen.getAllByText('Small')).toHaveLength(2);
    expect(screen.getAllByText('Medium')).toHaveLength(1);
    expect(screen.getAllByText('Large')).toHaveLength(2);

    const burgerRow = screen.getByText('Macchiato Coffee').closest('tr');
    expect(burgerRow).not.toBeNull();
    expect(within(burgerRow!).getByText('Large')).toBeInTheDocument();
    expect(within(burgerRow!).queryByText('Medium')).not.toBeInTheDocument();
    expect(within(burgerRow!).getByText('$10.90')).toBeInTheDocument();
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See more about Pizza Napolitana' })).toHaveAttribute(
      'href',
      '/menu/pizza-1'
    );
    expect(screen.getByRole('button', { name: 'Edit Pizza Napolitana' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Macchiato Coffee' })).toBeInTheDocument();
  });

  it('uses tolerant controlled search text to filter table rows', () => {
    render(
      <MenuItems
        menuItems={menuItems}
        categories={categories}
        searchQuery='machi'
        onSearchChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleAvailability={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Search menu items/i)).toHaveValue('machi');
    expect(screen.getByText('Macchiato Coffee')).toBeInTheDocument();
    expect(screen.queryByText('Pizza Napolitana')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 2 rows')).toBeInTheDocument();
  });

  it('calls availability updater from the row checkbox', async () => {
    const user = userEvent.setup();
    const onToggleAvailability = vi.fn();

    render(
      <MenuItems
        menuItems={menuItems}
        categories={categories}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleAvailability={onToggleAvailability}
      />
    );

    const pizzaRow = screen.getByText('Pizza Napolitana').closest('tr');
    expect(pizzaRow).not.toBeNull();

    await user.click(within(pizzaRow!).getByRole('checkbox', { name: /Accept orders/i }));

    expect(onToggleAvailability).toHaveBeenCalledWith('pizza-1', false);
  });
});
