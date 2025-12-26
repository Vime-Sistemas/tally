import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import CryptoJS from 'crypto-js';
import type { ReactNode } from 'react';
import { setAuthToken } from '../services/api';
import { useAuth0 } from '@auth0/auth0-react';
import type { CostCenter } from '../types/costCenter';

export interface User {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  picture?: string;
  coverImage?: string;
  phone?: string;
  occupation?: string;
  businessName?: string;
  businessCnpj?: string;
  menuPreference?: 'header' | 'sidebar';
  createdAt: string;
  updatedAt: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  costCenters: CostCenter[];
  setCostCenters: (costCenters: CostCenter[]) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          return JSON.parse(raw) as User;
        } catch (err) {
          // Try decrypting value if it was stored encrypted
          try {
            const secret = import.meta.env.VITE_CRYPTO_SECRET || '';
            if (secret) {
              const decrypted = CryptoJS.AES.decrypt(raw, secret).toString(CryptoJS.enc.Utf8);
              if (decrypted) {
                return JSON.parse(decrypted) as User;
              }
            }
          } catch (e2) {
            // ignore and continue to fallback
          }
          // Invalid value — remove to avoid future errors
          localStorage.removeItem('user');
          return null;
        }
      }

      // Fallback: try legacy encrypted key 'tally_u'
      const legacy = localStorage.getItem('tally_u');
      if (legacy) {
        try {
          const secret = import.meta.env.VITE_CRYPTO_SECRET || '';
          if (secret) {
            const decrypted = CryptoJS.AES.decrypt(legacy, secret).toString(CryptoJS.enc.Utf8);
            if (decrypted) {
              const parsed = JSON.parse(decrypted);
              // Try to map common fields
              const possibleUser = {
                id: parsed.id || parsed.account?.id || '',
                auth0Id: parsed.auth0Id || parsed.account?.auth0Id || '',
                email: parsed.email || parsed.account?.email || parsed.account?.user?.email || '',
                name: parsed.name || parsed.account?.name || parsed.social?.name || '',
                picture: parsed.picture || parsed.account?.picture || parsed.social?.picture || undefined,
                coverImage: parsed.coverImage || undefined,
                phone: parsed.phone || undefined,
                occupation: parsed.occupation || undefined,
                businessName: parsed.businessName || undefined,
                businessCnpj: parsed.businessCnpj || undefined,
                menuPreference: parsed.menuPreference || undefined,
                createdAt: parsed.createdAt || new Date().toISOString(),
                updatedAt: parsed.updatedAt || new Date().toISOString(),
              } as User;
              return possibleUser;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  });
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    try {
      if (u) {
        localStorage.setItem('user', JSON.stringify(u));
      } else {
        localStorage.removeItem('user');
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);
  const { logout: auth0Logout } = useAuth0();

  const logout = () => {
    try {
      localStorage.removeItem('token');
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    setCostCenters([]);
    try {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    } catch (e) {
      // fallback
      window.location.href = '/';
    }
  };

  const value = useMemo(() => ({ user, setUser, costCenters, setCostCenters, logout }), [user, setUser, costCenters, setCostCenters, logout]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
