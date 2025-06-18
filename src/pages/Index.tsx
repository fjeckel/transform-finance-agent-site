
import React from 'react';
import Hero from '../components/Hero';
import Navigation from '../components/Navigation';
import WTFSection from '../components/WTFSection';
import FinanceTransformersSection from '../components/FinanceTransformersSection';
import CFOMemoSection from '../components/CFOMemoSection';
import TimTeuscherSection from '../components/TimTeuscherSection';
import FabianJeckelSection from '../components/FabianJeckelSection';
import SocialHandlesSection from '../components/SocialHandlesSection';
import Footer from '../components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-[#FBF4EB]">
      <Navigation />
      <Hero />
      <WTFSection />
      <FinanceTransformersSection />
      <CFOMemoSection />
      <TimTeuscherSection />
      <FabianJeckelSection />
      <SocialHandlesSection />
      <Footer />
    </div>
  );
};

export default Index;
