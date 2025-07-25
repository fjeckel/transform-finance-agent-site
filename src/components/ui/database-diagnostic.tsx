import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const DatabaseDiagnostic = () => {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const { user } = useAuth();

  // Show in all environments for debugging
  // if (import.meta.env.PROD) {
  //   return null;
  // }

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);
    const testResults: any[] = [];

    // Test 1: Network connectivity
    try {
      testResults.push({ test: 'Network Connectivity', status: 'testing', message: 'Testing...' });
      setResults([...testResults]);

      const response = await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      testResults[testResults.length - 1] = { 
        test: 'Network Connectivity', 
        status: 'pass', 
        message: 'Internet connection working' 
      };
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Network Connectivity', 
        status: 'fail', 
        message: `No internet connection: ${error}` 
      };
    }

    // Test 2: Basic Supabase connection
    try {
      testResults.push({ test: 'Supabase Connection', status: 'testing', message: 'Testing...' });
      setResults([...testResults]);

      const { data, error } = await supabase.from('downloadable_pdfs').select('count').limit(1);
      
      if (error) {
        testResults[testResults.length - 1] = { 
          test: 'Supabase Connection', 
          status: 'fail', 
          message: `Failed: ${error.message}`,
          details: error
        };
      } else {
        testResults[testResults.length - 1] = { 
          test: 'Supabase Connection', 
          status: 'pass', 
          message: 'Connected successfully' 
        };
      }
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Supabase Connection', 
        status: 'fail', 
        message: `Exception: ${error}`,
        details: error
      };
    }

    // Test 3: Check if purchases table exists
    try {
      testResults.push({ test: 'Purchases Table', status: 'testing', message: 'Testing...' });
      setResults([...testResults]);

      const { data, error } = await supabase.from('purchases').select('count').limit(0);
      
      if (error) {
        testResults[testResults.length - 1] = { 
          test: 'Purchases Table', 
          status: 'fail', 
          message: `Table missing or no access: ${error.message}`,
          details: error
        };
      } else {
        testResults[testResults.length - 1] = { 
          test: 'Purchases Table', 
          status: 'pass', 
          message: 'Table exists and accessible' 
        };
      }
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Purchases Table', 
        status: 'fail', 
        message: `Exception: ${error}` 
      };
    }

    // Test 4: Check stripe_customers table
    try {
      testResults.push({ test: 'Stripe Customers Table', status: 'testing', message: 'Testing...' });
      setResults([...testResults]);

      const { data, error } = await supabase.from('stripe_customers').select('count').limit(0);
      
      if (error) {
        testResults[testResults.length - 1] = { 
          test: 'Stripe Customers Table', 
          status: 'fail', 
          message: `Table missing or no access: ${error.message}` 
        };
      } else {
        testResults[testResults.length - 1] = { 
          test: 'Stripe Customers Table', 
          status: 'pass', 
          message: 'Table exists and accessible' 
        };
      }
    } catch (error) {
      testResults[testResults.length - 1] = { 
        test: 'Stripe Customers Table', 
        status: 'fail', 
        message: `Exception: ${error}` 
      };
    }

    // Test 5: User authentication
    testResults.push({ 
      test: 'User Authentication', 
      status: user ? 'pass' : 'fail', 
      message: user ? `Logged in as: ${user.email}` : 'Not logged in' 
    });

    // Test 6: Environment variables
    const envVars = {
      'VITE_SUPABASE_URL': !!import.meta.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      'VITE_STRIPE_PUBLISHABLE_KEY': !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    };
    
    const allEnvSet = Object.values(envVars).every(Boolean);
    testResults.push({ 
      test: 'Environment Variables', 
      status: allEnvSet ? 'pass' : 'fail', 
      message: allEnvSet ? 'All required env vars set' : 'Missing env vars',
      details: envVars
    });

    setResults(testResults);
    setTesting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-500';
      case 'fail': return 'bg-red-500';
      case 'testing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const isProd = import.meta.env.PROD;

  return (
    <Card className={`mt-4 border-blue-200 ${isProd ? 'bg-red-50 border-red-200' : 'bg-blue-50'}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm ${isProd ? 'text-red-800' : 'text-blue-800'} flex items-center justify-between`}>
          {isProd ? '🚨 PRODUCTION DB DIAGNOSTICS' : 'Database Diagnostics'}
          <Button 
            onClick={runDiagnostics} 
            disabled={testing}
            size="sm"
            variant="outline"
          >
            {testing ? 'Testing...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {results.length === 0 && (
          <div className="text-gray-600">Click "Run Tests" to diagnose database issues</div>
        )}
        
        {results.map((result, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded">
            <span className="font-medium">{result.test}</span>
            <div className="flex items-center space-x-2">
              <Badge className={`text-white ${getStatusColor(result.status)}`}>
                {result.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-xs text-gray-600 max-w-xs truncate">
              {result.message}
            </div>
          </div>
        ))}

        {results.some(r => r.details) && (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer text-blue-600">Show Details</summary>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(results.filter(r => r.details), null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};