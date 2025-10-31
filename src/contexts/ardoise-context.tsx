'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ArdoiseContextType {
  isArdoiseOpen: boolean;
  openArdoise: () => void;
  closeArdoise: () => void;
  toggleArdoise: () => void;
}

const ArdoiseContext = createContext<ArdoiseContextType | undefined>(undefined);

export function ArdoiseProvider({ children }: { children: ReactNode }) {
  const [isArdoiseOpen, setIsArdoiseOpen] = useState(false);

  const openArdoise = () => setIsArdoiseOpen(true);
  const closeArdoise = () => setIsArdoiseOpen(false);
  const toggleArdoise = () => setIsArdoiseOpen(prev => !prev);

  return (
    <ArdoiseContext.Provider
      value={{
        isArdoiseOpen,
        openArdoise,
        closeArdoise,
        toggleArdoise,
      }}
    >
      {children}
    </ArdoiseContext.Provider>
  );
}

export function useArdoise() {
  const context = useContext(ArdoiseContext);
  if (context === undefined) {
    throw new Error('useArdoise must be used within an ArdoiseProvider');
  }
  return context;
}
