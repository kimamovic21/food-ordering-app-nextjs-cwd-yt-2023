import { describe, it, expect } from 'vitest';
import { strongPasswordSchema } from '@/libs/password';

describe('password requirements schema', () => {
  it('accepts a valid strong password', () => {
    const result = strongPasswordSchema.safeParse('Abcdef1!');
    expect(result.success).toBe(true);
  });

  it('rejects too short password with proper message', () => {
    const result = strongPasswordSchema.safeParse('A1!a');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Password must be at least 6 characters.');
    }
  });

  it('rejects missing uppercase with proper message', () => {
    const result = strongPasswordSchema.safeParse('abcdef1!');
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Password must contain at least 1 uppercase letter.');
    }
  });

  it('rejects overly long password', () => {
    const long = 'A'.repeat(65) + 'a1!';
    const result = strongPasswordSchema.safeParse(long);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('Password must be 64 characters or fewer.');
    }
  });
});
