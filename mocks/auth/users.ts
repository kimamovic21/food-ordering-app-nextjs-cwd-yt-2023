export const authMockUsers = {
  registerInput: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'MYsecret123!',
  },
  existingUser: {
    _id: 'existing-user-id',
    name: 'John Existing',
    email: 'john.doe@example.com',
    password: '$2b$10$existing-hash',
    role: 'user',
  },
  createdAdmin: {
    _id: 'created-admin-id',
    name: 'John Doe',
    email: 'john.doe@example.com',
    provider: 'credentials',
    role: 'admin',
  },
  createdUser: {
    _id: 'created-user-id',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    provider: 'credentials',
    role: 'user',
  },
};
