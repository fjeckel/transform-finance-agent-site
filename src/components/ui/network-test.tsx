import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export const NetworkTest = () => {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  // Show in all environments for debugging
  // if (import.meta.env.PROD) {
  //   return null;
  // }

  const runNetworkTest = async () => {
    setTesting(true);
    setResults([]);
    const logs: string[] = [];

    // Test 1: Basic network connectivity
    try {
      logs.push('🌐 Testing basic network connectivity...');
      setResults([...logs]);
      
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        logs.push('✅ Basic network connectivity: OK');
      } else {
        logs.push(`❌ Network test failed: ${response.status}`);
      }
    } catch (error) {
      logs.push(`❌ Network connectivity failed: ${error}`);
    }

    // Test 2: Supabase URL reachability
    try {
      logs.push('🔗 Testing Supabase URL reachability...');
      setResults([...logs]);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      logs.push(`📊 Supabase URL response: ${response.status} ${response.statusText}`);
    } catch (error) {
      logs.push(`❌ Supabase URL unreachable: ${error}`);
    }

    // Test 3: Direct purchases table query
    try {
      logs.push('📋 Testing direct purchases table query...');
      setResults([...logs]);
      
      const { data, error, status, statusText } = await supabase
        .from('purchases')
        .select('count')
        .limit(0);
      
      if (error) {
        logs.push(`❌ Purchases query failed: ${error.message}`);
        logs.push(`📊 Status: ${status} ${statusText}`);
        logs.push(`🔍 Error code: ${error.code}`);
        logs.push(`💡 Error details: ${JSON.stringify(error.details)}`);
      } else {
        logs.push('✅ Purchases table accessible');
      }
    } catch (error) {
      logs.push(`❌ Purchases query exception: ${error}`);
    }

    // Test 4: Service Worker status
    try {
      logs.push('⚙️ Checking Service Worker status...');
      setResults([...logs]);
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          logs.push(`✅ Service Worker registered: ${registration.scope}`);
          logs.push(`📋 SW State: ${registration.active?.state || 'unknown'}`);
        } else {
          logs.push('ℹ️ No Service Worker registered');
        }
      } else {
        logs.push('ℹ️ Service Worker not supported');
      }
    } catch (error) {
      logs.push(`⚠️ Service Worker check failed: ${error}`);
    }

    // Test 5: CORS and headers
    try {
      logs.push('🔒 Testing CORS and headers...');
      setResults([...logs]);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      logs.push(`🔑 Supabase URL: ${supabaseUrl}`);
      logs.push(`🗝️ Anon Key present: ${!!anonKey}`);
      logs.push(`📏 Anon Key length: ${anonKey?.length || 0}`);
      
    } catch (error) {
      logs.push(`❌ Header test failed: ${error}`);
    }

    setResults(logs);
    setTesting(false);
  };

  const isProd = import.meta.env.PROD;

  return (
    <Card className={`mt-4 border-purple-200 ${isProd ? 'bg-red-50 border-red-200' : 'bg-purple-50'}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm ${isProd ? 'text-red-800' : 'text-purple-800'} flex items-center justify-between`}>
          {isProd ? '🚨 PRODUCTION NETWORK DIAGNOSTICS' : 'Network Diagnostics'}
          <Button 
            onClick={runNetworkTest} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            {testing ? 'Testing...' : 'Run Network Test'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-xs">
        {results.length === 0 && (
          <div className="text-gray-600">Click "Run Network Test" to diagnose connection issues</div>
        )}
        
        {results.map((result, index) => (
          <div key={index} className="font-mono text-xs p-1 bg-white rounded border">
            {result}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};