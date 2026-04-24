export const profileMockUsers = {
  sessionEmail: 'john@example.com',
  updatedProfile: {
    name: 'John Updated',
    email: 'john@example.com',
    phone: '123',
    city: 'Sarajevo',
    role: 'user',
  },
  profileDeleteUserWithImage: {
    email: 'john@example.com',
    image: 'https://res.cloudinary.com/demo/image/upload/v1/users/profile-image-1.jpg',
  },
  uploadExistingImageUser: {
    email: 'john@example.com',
    image: 'https://res.cloudinary.com/demo/image/upload/v1/users/old-profile.jpg',
  },
  uploadUpdatedImageUser: {
    email: 'john@example.com',
    image: 'https://res.cloudinary.com/demo/image/upload/v1/users/new-profile.jpg',
  },
  removeImageUser: {
    email: 'john@example.com',
    image: '',
  },
};
