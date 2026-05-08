export const checkoutMockItems = {
  validCartItem: {
    _id: '507f1f77bcf86cd799439011',
    name: 'Margherita Pizza',
    size: 'Large',
    price: 15.99,
    quantity: 2,
    restaurantId: '507f1f77bcf86cd799439099',
  },
  validCartItems: [
    {
      _id: '507f1f77bcf86cd799439011',
      name: 'Margherita Pizza',
      size: 'Large',
      price: 15.99,
      quantity: 2,
      restaurantId: '507f1f77bcf86cd799439099',
    },
    {
      _id: '507f1f77bcf86cd799439012',
      name: 'Caesar Salad',
      size: 'Regular',
      price: 8.99,
      quantity: 1,
      restaurantId: '507f1f77bcf86cd799439099',
    },
  ],
  invalidCartItem: {
    _id: 'invalid-id',
    name: 'Pizza',
    size: 'Large',
    price: 15.99,
    quantity: 1,
    restaurantId: '507f1f77bcf86cd799439099',
  },
  cartItemMultipleRestaurants: [
    {
      _id: '507f1f77bcf86cd799439011',
      name: 'Pizza',
      size: 'Large',
      price: 15.99,
      quantity: 1,
      restaurantId: '507f1f77bcf86cd799439099',
    },
    {
      _id: '507f1f77bcf86cd799439012',
      name: 'Burger',
      size: 'Regular',
      price: 12.99,
      quantity: 1,
      restaurantId: '507f1f77bcf86cd799439088', // Different restaurant
    },
  ],
};

export const checkoutMockDeliveryInfo = {
  valid: {
    phone: '+1234567890',
    streetAddress: '123 Main St',
    postalCode: '12345',
    city: 'New York',
    country: 'USA',
  },
  missingPhone: {
    streetAddress: '123 Main St',
    postalCode: '12345',
    city: 'New York',
    country: 'USA',
  },
  missingAddress: {
    phone: '+1234567890',
    postalCode: '12345',
    city: 'New York',
    country: 'USA',
  },
};
