import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'USD' | 'INR' | 'PKR' | 'AED';

interface CurrencyStore {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
}

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  INR: '₹',
  PKR: '₨',
  AED: 'د.إ'
};

const currencyLocales: Record<Currency, string> = {
  USD: 'en-US',
  INR: 'en-IN',
  PKR: 'ur-PK',
  AED: 'ar-AE'
};

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: 'AED',

      setCurrency: (currency: Currency) => set({ currency }),

      formatCurrency: (amount: number) => {
        const { currency } = get();
        return new Intl.NumberFormat(currencyLocales[currency], {
          style: 'currency',
          currency: currency,
        }).format(amount);
      },

      getCurrencySymbol: () => {
        const { currency } = get();
        return currencySymbols[currency];
      },
    }),
    {
      name: 'currency-storage',
    }
  )
);