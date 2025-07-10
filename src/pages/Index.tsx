
import React from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import WTFSection from '@/components/WTFSection';
import FinanceTransformersSection from '@/components/FinanceTransformersSection';
import TimTeuscherSection from '@/components/TimTeuscherSection';
import FabianJeckelSection from '@/components/FabianJeckelSection';
import SocialHandlesSection from '@/components/DynamicSocialHandlesSection';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead />
      {/* Navigation */}
      <Navigation />

      {/* Add top padding to account for fixed navigation */}
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <Hero />

        {/* Langweilige Formate Section */}

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
