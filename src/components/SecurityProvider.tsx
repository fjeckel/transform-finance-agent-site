import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateCSRFToken, getCSPHeader, getSecurityHeaders } from '@/lib/security';

interface SecurityContextType {
  csrfToken: string;
  refreshCSRFToken: () => void;
  isSecureConnection: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState('');
  const [isSecureConnection] = useState(true);

  const refreshCSRFToken = () => {
    // Generate a simple token for now
    const array = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      setCsrfToken(Array.from(array, byte => byte.toString(16).padStart(2, '0')).join(''));
    } else {
      setCsrfToken(Math.random().toString(36).substring(2));
    }
  };

  useEffect(() => {
    refreshCSRFToken();
  }, []);

  const value = {
    csrfToken,
    refreshCSRFToken,
    isSecureConnection,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};