import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { setAuthToken } from '../services/api';
import { useAuth0 } from '@auth0/auth0-react';

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
  createdAt: string;
  updatedAt: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { logout: auth0Logout } = useAuth0();

  const logout = () => {
    try {
      localStorage.removeItem('token');
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    try {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    } catch (e) {
      // fallback
      window.location.href = '/';
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
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
