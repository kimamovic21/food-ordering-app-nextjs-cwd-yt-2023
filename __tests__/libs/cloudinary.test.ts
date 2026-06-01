import { describe, it, expect, vi } from 'vitest';

const mockConfig = vi.fn();
const mockV2 = { config: mockConfig } as any;
vi.mock('cloudinary', () => ({ v2: mockV2 }));

describe('cloudinary module', () => {
  it('calls cloudinary.config with env values and exports v2', async () => {
    // set env vars
    process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';

    const cloudinary = await import('@/libs/cloudinary');

    // module should export the mocked v2
    expect(cloudinary.default).toBe(mockV2);

    // config should have been called with expected keys
    expect(mockConfig).toHaveBeenCalledWith({
      cloud_name: 'cloud',
      api_key: 'key',
      api_secret: 'secret',
      secure: true,
    });
  });
});
