import React from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const NetworkIndicator = () => {
  const { isOnline, effectiveType } = useNetworkStatus();

  if (isOnline && effectiveType !== 'slow-2g') return null;

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
      isOnline ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
    }`}>
      {isOnline ? (
        <>
          <AlertTriangle size={16} />
          <span className="text-sm font-medium">Langsame Verbindung</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span className="text-sm font-medium">Offline</span>
        </>
      )}
    </div>
  );
};