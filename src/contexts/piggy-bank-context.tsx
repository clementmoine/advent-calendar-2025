'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

interface PiggyBankContextType {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
}

const PiggyBankContext = createContext<PiggyBankContextType | undefined>(
  undefined
);

export function PiggyBankProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Load coins from localStorage after hydration
    const savedCoins = localStorage.getItem('piggy-bank-coins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins, 10));
    }
    setIsHydrated(true);
  }, []);

  const addCoins = (amount: number) => {
    setCoins(prev => {
      const newAmount = prev + amount;
      if (typeof window !== 'undefined') {
        localStorage.setItem('piggy-bank-coins', newAmount.toString());
      }
      return newAmount;
    });
  };

  const spendCoins = (amount: number) => {
    if (coins >= amount) {
      setCoins(prev => {
        const newAmount = prev - amount;
        if (typeof window !== 'undefined') {
          localStorage.setItem('piggy-bank-coins', newAmount.toString());
        }
        return newAmount;
      });
      return true;
    }
    return false;
  };

  return (
    <PiggyBankContext.Provider
      value={{
        coins: isHydrated ? coins : 0,
        addCoins,
        spendCoins,
      }}
    >
      {children}
    </PiggyBankContext.Provider>
  );
}

export function usePiggyBank() {
  const context = useContext(PiggyBankContext);
  if (context === undefined) {
    throw new Error('usePiggyBank must be used within a PiggyBankProvider');
  }
  return context;
}
