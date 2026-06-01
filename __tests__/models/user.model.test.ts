import { describe, it, expect } from 'vitest';
import { User } from '@/models/user';

describe('User model validation', () => {
  it('requires name and email', async () => {
    const u: any = new User({});
    await expect(u.validate()).rejects.toBeTruthy();
  });

  it('accepts minimal valid user', async () => {
    const data: any = { name: 'Test', email: 'test@example.com' };
    const u: any = new User(data);
    await expect(u.validate()).resolves.toBeUndefined();
  });

  it('enforces role enum', async () => {
    const data: any = { name: 'Test', email: 't@example.com', role: 'owner' };
    const u: any = new User(data);
    await expect(u.validate()).rejects.toBeTruthy();
  });

  it('email field has unique index in schema', () => {
    const path = (User as any).schema.path('email');
    expect(path.options.unique).toBe(true);
  });
});
