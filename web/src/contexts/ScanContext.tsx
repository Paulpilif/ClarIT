import { createContext, useContext, useState, type ReactNode } from 'react';
import { useUser } from './UserContext';

interface ScanContextType {
  scanCompleted: boolean;
  setScanCompleted: (value: boolean) => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  const { tier } = useUser();
  
  // Pour Scout: non persistant, toujours false au démarrage
  // Pour Navigator: persistant depuis localStorage
  const [scanCompleted, setScanCompletedState] = useState(() => {
    if (tier === 'scout') {
      return false; // Scout: jamais persistant
    }
    // Navigator: charger depuis localStorage
    const saved = localStorage.getItem('scanCompleted');
    return saved === 'true';
  });

  const setScanCompleted = (value: boolean) => {
    setScanCompletedState(value);
    
    // Sauvegarder uniquement pour Navigator
    if (tier === 'navigator') {
      localStorage.setItem('scanCompleted', value.toString());
    } else {
      // Pour Scout, nettoyer le localStorage
      localStorage.removeItem('scanCompleted');
    }
  };

  return (
    <ScanContext.Provider value={{ scanCompleted, setScanCompleted }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
}
