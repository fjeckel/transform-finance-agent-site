import React from 'react';
import Hero from '@/components/HeroSection';
import BoringFormatsSection from '@/components/BoringFormatsSection';
import WTFSection from '@/components/WTFSection';
import FinanceTransformersSection from '@/components/FinanceTransformersSection';
import TimTeuscherSection from '@/components/TimTeuscherSection';
import FabianJeckelSection from '@/components/FabianJeckelSection';
import CFOMemoSection from '@/components/CFOMemoSection';
import SocialHandlesSection from '@/components/SocialHandlesSection';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { LogIn, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-gray-900">
              Finance Transformers
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm">
                        <Settings size={16} className="mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" onClick={signOut}>
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    <LogIn size={16} className="mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Langweilige Formate Section */}
      <BoringFormatsSection />

      {/* WTF Section */}
      <WTFSection />

      {/* Finance Transformers Section */}
      <FinanceTransformersSection />

      {/* Tim Teuscher Section */}
      <TimTeuscherSection />

      {/* Fabian Jeckel Section */}
      <FabianJeckelSection />

      {/* CFO Memo Section */}
      <CFOMemoSection />

      {/* Social Handles Section */}
      <SocialHandlesSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
