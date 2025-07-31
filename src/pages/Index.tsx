
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import DynamicSection from '@/components/DynamicSection';
import { useMainPageSections } from '@/hooks/useMainPageSections';
import { Skeleton } from '@/components/ui/skeleton';
import TimTeuscherSection from '@/components/TimTeuscherSection';
import FabianJeckelSection from '@/components/FabianJeckelSection';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { SearchBox } from '@/components/ui/search-box';

const Index = () => {
  const { data: sections, isLoading } = useMainPageSections();
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Debug: Log sections to console
  React.useEffect(() => {
    if (sections) {
      console.log('Loaded sections:', sections.map(s => ({
        key: s.section_key,
        title: s.title,
        type: s.section_type,
        active: s.is_active
      })));
    }
  }, [sections]);

  return (
    <div className="min-h-screen bg-background">
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
          <>
            {sections?.map((section) => (
              <DynamicSection key={section.id} section={section} />
            ))}
            
            {/* Temporarily add hardcoded sections if they're missing from CRM */}
            {sections && !sections.find(s => s.section_key === 'tim_teuscher') && (
              <TimTeuscherSection />
            )}
            {sections && !sections.find(s => s.section_key === 'fabian_jeckel') && (
              <FabianJeckelSection />
            )}
          </>
        )}

        {/* Footer */}
        <Footer />
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation onSearchOpen={() => setSearchOpen(true)} />
    </div>
  );
};

export default Index;
