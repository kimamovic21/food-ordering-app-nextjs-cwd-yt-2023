import currency from 'currency.js';
import type { MoneyInput } from '@/types/money';

export type { MoneyInput } from '@/types/money';

const MONEY_OPTIONS = {
  precision: 2,
  symbol: '$',
};

export const toMoney = (value: MoneyInput = 0) => currency(value ?? 0, MONEY_OPTIONS);

export const roundMoney = (value: MoneyInput) => toMoney(value).value;

export const addMoney = (...values: MoneyInput[]) =>
  values.reduce((sum, value) => sum.add(value ?? 0), toMoney(0)).value;

export const subtractMoney = (value: MoneyInput, ...values: MoneyInput[]) =>
  values.reduce((sum, nextValue) => sum.subtract(nextValue ?? 0), toMoney(value)).value;

export const multiplyMoney = (value: MoneyInput, multiplier: number) =>
  toMoney(value).multiply(Number.isFinite(multiplier) ? multiplier : 0).value;

export const divideMoney = (value: MoneyInput, divisor: number) =>
  divisor ? toMoney(value).divide(divisor).value : 0;

export const formatMoney = (value: MoneyInput) => toMoney(value).format();
