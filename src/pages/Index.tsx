
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
import { LazyLoad } from '@/components/ui/lazy-load';
import { Skeleton } from '@/components/ui/skeleton';

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
        <LazyLoad fallback={<div className="h-96"><Skeleton className="h-full w-full" /></div>}>
          <WTFSection />
        </LazyLoad>

        {/* Finance Transformers Section */}
        <LazyLoad fallback={<div className="h-96"><Skeleton className="h-full w-full" /></div>}>
          <FinanceTransformersSection />
        </LazyLoad>

        {/* Tim Teuscher Section */}
        <LazyLoad fallback={<div className="h-96"><Skeleton className="h-full w-full" /></div>}>
          <TimTeuscherSection />
        </LazyLoad>

        {/* Fabian Jeckel Section */}
        <LazyLoad fallback={<div className="h-96"><Skeleton className="h-full w-full" /></div>}>
          <FabianJeckelSection />
        </LazyLoad>

        {/* Social Handles Section */}
        <LazyLoad fallback={<div className="h-48"><Skeleton className="h-full w-full" /></div>}>
          <SocialHandlesSection />
        </LazyLoad>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Index;
