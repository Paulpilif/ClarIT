import React, { createContext, useState } from 'react';
import type { ReactNode } from 'react';

export type UserTier = 'scout' | 'navigator' | 'admiral';

interface UserContextType {
  tier: UserTier;
  setTier: (tier: UserTier) => void;
  hasAccess: (feature: string, scanCompleted?: boolean) => boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  // Mock: Change this to test different tiers
  const [tier, setTier] = useState<UserTier>('admiral');

  const hasAccess = (feature: string, scanCompleted: boolean = false): boolean => {
    // Dashboard accessible à tous après un scan
    if (feature === 'dashboard' && scanCompleted) {
      return true;
    }

    const features: Record<UserTier, string[]> = {
      scout: [
        'map', // Cartographie
      ],
      navigator: [
        'map', // Cartographie
        'inventory', // Inventaire
      ],
      admiral: [
        'map', // Cartographie
        'inventory', // Inventaire
        'dashboard', // Dashboard
      ],
    };

    return features[tier]?.includes(feature) ?? false;
  };

  return (
    <UserContext.Provider value={{ tier, setTier, hasAccess }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
