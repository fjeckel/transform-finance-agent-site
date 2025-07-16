
import React from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import DynamicSection from '@/components/DynamicSection';
import { useMainPageSections } from '@/hooks/useMainPageSections';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { data: sections, isLoading } = useMainPageSections();

  return (
    <div className="min-h-screen bg-white">
      <SEOHead />
      {/* Navigation */}
      <Navigation />

      {/* Add top padding to account for fixed navigation */}
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <Hero />

        {/* Dynamic Sections */}
        {isLoading ? (
          <div className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-96">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          sections?.map((section) => (
            <DynamicSection key={section.id} section={section} />
          ))
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Index;
