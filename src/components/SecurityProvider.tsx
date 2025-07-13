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
  const [csrfToken, setCsrfToken] = useState(() => generateCSRFToken());
  const [isSecureConnection] = useState(() => 
    window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  );

  const refreshCSRFToken = () => {
    setCsrfToken(generateCSRFToken());
  };

  useEffect(() => {
    // Apply security headers via meta tags (limited effectiveness, but better than nothing)
    const addSecurityMeta = () => {
      const headers = getSecurityHeaders();
      
      Object.entries(headers).forEach(([name, content]) => {
        const existing = document.querySelector(`meta[http-equiv="${name}"]`);
        if (!existing) {
          const meta = document.createElement('meta');
          meta.httpEquiv = name;
          meta.content = content;
          document.head.appendChild(meta);
        }
      });

      // Add CSP meta tag
      const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!existingCSP) {
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = getCSPHeader();
        document.head.appendChild(cspMeta);
      }
    };

    addSecurityMeta();

    // Refresh CSRF token periodically
    const interval = setInterval(refreshCSRFToken, 30 * 60 * 1000); // 30 minutes

    // Warn about insecure connections
    if (!isSecureConnection && window.location.hostname !== 'localhost') {
      console.warn('⚠️ Insecure connection detected. HTTPS recommended for production.');
    }

    // Disable right-click in production (optional security measure)
    const handleContextMenu = (e: MouseEvent) => {
      if (process.env.NODE_ENV === 'production') {
        e.preventDefault();
      }
    };

    // Disable certain key combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'production') {
        // Disable F12, Ctrl+Shift+I, Ctrl+U
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u')
        ) {
          e.preventDefault();
        }
      }
    };

    if (process.env.NODE_ENV === 'production') {
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      clearInterval(interval);
      if (process.env.NODE_ENV === 'production') {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isSecureConnection]);

  // Add security event listeners
  useEffect(() => {
    // Detect potential XSS attempts
    const handleBeforeUnload = () => {
      // Clear sensitive data from memory
      sessionStorage.clear();
    };

    // Monitor for suspicious activity
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is hidden, could refresh CSRF token when it becomes visible again
        refreshCSRFToken();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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