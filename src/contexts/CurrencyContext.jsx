import React, { createContext, useContext, useEffect, useState } from 'react';

const CurrencyContext = createContext();

export const CURRENCIES = {
  INR: { sym: '₹', name: 'INR' },
  USD: { sym: '$', name: 'USD' },
  EUR: { sym: '€', name: 'EUR' },
  GBP: { sym: '£', name: 'GBP' },
  JPY: { sym: '¥', name: 'JPY' },
  AED: { sym: 'د.إ', name: 'AED' }
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('wiw_currency');
    return saved || 'INR';
  });

  useEffect(() => {
    localStorage.setItem('wiw_currency', currency);
  }, [currency]);

  const getSymbol = () => CURRENCIES[currency]?.sym || '₹';

  // Specific format for India if INR, standard if not
  const formatAmount = (amount) => {
    const sym = getSymbol();
    if (currency === 'INR') {
      return sym + Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return sym + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatShort = (amount) => {
    const sym = getSymbol();
    const absAmt = Math.abs(amount);
    
    if (currency === 'INR') {
      if (absAmt >= 100000) return sym + (absAmt / 100000).toFixed(1) + 'L';
      if (absAmt >= 1000) return sym + (absAmt / 1000).toFixed(1) + 'k';
    } else {
      if (absAmt >= 1000000) return sym + (absAmt / 1000000).toFixed(1) + 'M';
      if (absAmt >= 1000) return sym + (absAmt / 1000).toFixed(1) + 'k';
    }
    
    return sym + Math.round(absAmt);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, getSymbol, formatAmount, formatShort }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
