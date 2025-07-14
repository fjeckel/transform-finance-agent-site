
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
      {/* Navigation */}
      <Navigation />

      {/* Add top padding to account for fixed navigation */}
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <Hero />

        {/* Langweilige Formate Section */}

        {/* WTF Section */}
        <SectionErrorBoundary sectionName="WTF Podcast">
          <LazyLoad fallback={
            <div className="py-20 bg-secondary">
              <div className="max-w-6xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-6">
                    <Skeleton className="h-16 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="grid grid-cols-2 gap-3 mt-8">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                </div>
              </div>
            </div>
          }>
            <WTFSection />
          </LazyLoad>
        </SectionErrorBoundary>

        {/* Finance Transformers Section */}
        <SectionErrorBoundary sectionName="Finance Transformers">
          <LazyLoad fallback={<div className="h-96 bg-background"><Skeleton className="h-full w-full" /></div>}>
            <FinanceTransformersSection />
          </LazyLoad>
        </SectionErrorBoundary>

        {/* Tim Teuscher Section */}
        <SectionErrorBoundary sectionName="Tim Teuscher">
          <LazyLoad fallback={<div className="h-96 bg-secondary"><Skeleton className="h-full w-full" /></div>}>
            <TimTeuscherSection />
          </LazyLoad>
        </SectionErrorBoundary>

        {/* Fabian Jeckel Section */}
        <SectionErrorBoundary sectionName="Fabian Jeckel">
          <LazyLoad fallback={<div className="h-96 bg-background"><Skeleton className="h-full w-full" /></div>}>
            <FabianJeckelSection />
          </LazyLoad>
        </SectionErrorBoundary>

        {/* Social Handles Section */}
        <SectionErrorBoundary sectionName="Social Media">
          <LazyLoad fallback={<div className="h-48 bg-secondary"><Skeleton className="h-full w-full" /></div>}>
            <SocialHandlesSection />
          </LazyLoad>
        </SectionErrorBoundary>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Index;
