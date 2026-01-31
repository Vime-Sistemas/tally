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
  plan?: 'FREE' | 'PRO_MONTHLY' | 'PRO_ANNUAL';
  subscriptionStatus?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  picture?: string;
  coverImage?: string;
  phone?: string;
  occupation?: string;
  businessName?: string;
  businessCnpj?: string;
  businessWebsite?: string;
  location?: string;
  cep?: string;
  hasBusiness?: boolean;
  type?: 'PERSONAL' | 'PLANNER';
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
  getRoles: () => string[];
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
                plan: parsed.plan || undefined,
                subscriptionStatus: parsed.subscriptionStatus || undefined,
                stripeSubscriptionId: parsed.stripeSubscriptionId || undefined,
                stripeCustomerId: parsed.stripeCustomerId || undefined,
                subscriptionCurrentPeriodEnd: parsed.subscriptionCurrentPeriodEnd || undefined,
                picture: parsed.picture || parsed.account?.picture || parsed.social?.picture || undefined,
                coverImage: parsed.coverImage || undefined,
                phone: parsed.phone || undefined,
                occupation: parsed.occupation || undefined,
                businessName: parsed.businessName || undefined,
                businessCnpj: parsed.businessCnpj || undefined,
                type: parsed.type || 'PERSONAL',
                menuPreference: parsed.menuPreference || undefined,
                createdAt: parsed.createdAt || new Date().toISOString(),
                updatedAt: parsed.updatedAt || new Date().toISOString(),
              } as User;
              try {
                // persist migrated user to new key (sanitized) and remove legacy entry
                const sanitized = {
                  id: possibleUser.id,
                  auth0Id: possibleUser.auth0Id,
                  email: possibleUser.email,
                  name: possibleUser.name,
                  plan: possibleUser.plan,
                  subscriptionStatus: possibleUser.subscriptionStatus,
                  stripeSubscriptionId: possibleUser.stripeSubscriptionId,
                  stripeCustomerId: possibleUser.stripeCustomerId,
                  subscriptionCurrentPeriodEnd: possibleUser.subscriptionCurrentPeriodEnd,
                  picture: possibleUser.picture,
                  coverImage: possibleUser.coverImage,
                  type: possibleUser.type,
                  menuPreference: possibleUser.menuPreference,
                  createdAt: possibleUser.createdAt,
                  updatedAt: possibleUser.updatedAt,
                };
                localStorage.setItem('user', JSON.stringify(sanitized));
                localStorage.removeItem('tally_u');
              } catch (e) {
                // ignore
              }
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
        // sanitize before persisting to localStorage: avoid storing sensitive fields
        const sanitized = {
          id: u.id,
          auth0Id: u.auth0Id,
          email: u.email,
          name: u.name,
          plan: u.plan,
          subscriptionStatus: u.subscriptionStatus,
          stripeSubscriptionId: u.stripeSubscriptionId,
          stripeCustomerId: u.stripeCustomerId,
          subscriptionCurrentPeriodEnd: u.subscriptionCurrentPeriodEnd,
          picture: u.picture,
          coverImage: u.coverImage,
          type: u.type,
          menuPreference: u.menuPreference,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
        localStorage.setItem('user', JSON.stringify(sanitized));
        // ensure legacy key is removed after we write the canonical user
        try { localStorage.removeItem('tally_u'); } catch (e) { /* ignore */ }
      } else {
        localStorage.removeItem('user');
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);
  const { user: auth0User, logout: auth0Logout } = useAuth0();

  const getRoles = useCallback(() => {
    const domain = import.meta.env.VITE_AUTH0_DOMAIN;
    return auth0User ? (auth0User[`https://${domain}/roles`] as string[] || []) : [];
  }, [auth0User]);

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

  const value = useMemo(() => ({ user, setUser, costCenters, setCostCenters, logout, getRoles }), [user, setUser, costCenters, setCostCenters, logout, getRoles]);

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
