import { createContext, useContext, useState, type ReactNode } from 'react';

interface ScanContextType {
  scanCompleted: boolean;
  setScanCompleted: (value: boolean) => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [scanCompleted, setScanCompleted] = useState(false);

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
