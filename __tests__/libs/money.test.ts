import { describe, expect, it } from 'vitest';
import {
  addMoney,
  divideMoney,
  formatMoney,
  multiplyMoney,
  roundMoney,
  subtractMoney,
} from '@/libs/money';

describe('money helpers', () => {
  it('avoids floating point drift for app money calculations', () => {
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(multiplyMoney(8.99, 3)).toBe(26.97);
    expect(subtractMoney(10, 1.335)).toBe(8.66);
    expect(divideMoney(10, 3)).toBe(3.33);
  });

  it('formats money with the app currency style', () => {
    expect(roundMoney(12.345)).toBe(12.35);
    expect(formatMoney(12.3)).toBe('$12.30');
  });
});
