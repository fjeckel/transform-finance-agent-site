
import React from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import BoringFormatsSection from '@/components/BoringFormatsSection';
import WTFSection from '@/components/WTFSection';
import FinanceTransformersSection from '@/components/FinanceTransformersSection';
import TimTeuscherSection from '@/components/TimTeuscherSection';
import FabianJeckelSection from '@/components/FabianJeckelSection';
import SocialHandlesSection from '@/components/SocialHandlesSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Add top padding to account for fixed navigation */}
      <div className="pt-20 lg:pt-24">
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


        {/* Social Handles Section */}
        <SocialHandlesSection />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Index;
