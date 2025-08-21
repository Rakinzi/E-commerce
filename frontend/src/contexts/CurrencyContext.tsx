import { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'ZWG';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number) => string;
  convertPrice: (price: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const EXCHANGE_RATE = 32; // 1 USD = 32 ZWG

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');

  const convertPrice = (price: number): number => {
    if (currency === 'ZWG') {
      return price * EXCHANGE_RATE;
    }
    return price;
  };

  const formatPrice = (price: number): string => {
    const convertedPrice = convertPrice(price);
    if (currency === 'USD') {
      return `$${convertedPrice.toFixed(2)}`;
    } else {
      return `ZWG ${convertedPrice.toFixed(0)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}