export const DEFAULT_USD_RATES: Record<string, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.50,
  JPY: 155.00,
  CAD: 1.36,
  AUD: 1.50,
  SGD: 1.34,
  AED: 3.67,
  CNY: 7.24,
  CHF: 0.89,
  MXN: 18.20,
  BRL: 5.50,
  NZD: 1.63,
  THB: 36.50,
  KRW: 1380.00,
  ZAR: 18.40
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  SGD: 'S$',
  AED: 'د.إ',
  CNY: '¥',
  CHF: 'Fr',
  MXN: '$',
  BRL: 'R$',
  NZD: '$',
  THB: '฿',
  KRW: '₩',
  ZAR: 'R'
};

export const getCurrencySymbol = (code?: string): string => {
  if (!code) return '$';
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
};

export const formatCurrency = (amount: number, code?: string): string => {
  const symbol = getCurrencySymbol(code);
  return `${symbol}${Math.round(amount).toLocaleString()}`;
};

export const getCrossRate = (homeCode: string, localCode: string, usdToLocalRate: number): number => {
  const homeRateToUsd = DEFAULT_USD_RATES[homeCode] || 1.0;
  if (homeCode === localCode) return 1.0;
  return (1 / homeRateToUsd) * usdToLocalRate;
};
