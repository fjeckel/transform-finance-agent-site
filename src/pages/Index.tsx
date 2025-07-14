
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
import { SectionErrorBoundary } from '@/components/ui/enhanced-error-boundary';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead />
      <Navigation />
      <div className="pt-20 lg:pt-24">
        <h1 className="text-4xl font-bold text-center py-20">Test Page</h1>
        <p className="text-center">If you can see this, the basic page with Navigation and SEOHead is working.</p>
      </div>
    </div>
  );
};

export default Index;
