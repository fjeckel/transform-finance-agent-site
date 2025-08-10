import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Youtube, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncResult {
  success: boolean;
  videosProcessed?: number;
  error?: string;
  timestamp: string;
}

export const YouTubeSyncButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      setIsLoading(true);
      
      // Call the YouTube sync function
      const { data, error } = await supabase.functions.invoke('youtube-video-sync', {
        method: 'POST'
      });

      if (error) {
        throw new Error(error.message || 'Sync failed');
      }

      const result: SyncResult = {
        success: true,
        videosProcessed: data?.videosProcessed || 0,
        timestamp: new Date().toISOString()
      };

      setLastSync(result);
      
      toast({
        title: "YouTube Sync erfolgreich",
        description: `${result.videosProcessed} Videos wurden verarbeitet.`,
      });

    } catch (error) {
      const result: SyncResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date().toISOString()
      };

      setLastSync(result);

      toast({
        title: "YouTube Sync fehlgeschlagen",
        description: result.error,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          YouTube Video Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Synchronisiert die neuesten Videos vom WTF Finance Transformers YouTube-Kanal.
        </div>

        {lastSync && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {lastSync.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={lastSync.success ? "default" : "destructive"}>
                {lastSync.success ? 'Erfolgreich' : 'Fehlgeschlagen'}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTimestamp(lastSync.timestamp)}
              </div>
            </div>
            
            {lastSync.success && lastSync.videosProcessed !== undefined && (
              <div className="text-sm text-muted-foreground">
                {lastSync.videosProcessed} Videos verarbeitet
              </div>
            )}
            
            {lastSync.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {lastSync.error}
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleSync} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Synchronisiere...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Videos jetzt synchronisieren
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <strong>Automatische Synchronisation:</strong> Videos werden alle 6 Stunden automatisch synchronisiert.
          Verwenden Sie diesen Button nur für manuelle Updates.
        </div>
      </CardContent>
    </Card>
  );
};