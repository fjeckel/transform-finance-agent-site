
import React, { useState } from 'react';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import DynamicSection from '@/components/DynamicSection';
import { useMainPageSections } from '@/hooks/useMainPageSections';
import { Skeleton } from '@/components/ui/skeleton';
import TimTeuscherSection from '@/components/TimTeuscherSection';
import FabianJeckelSection from '@/components/FabianJeckelSection';
import { MobileSearch } from '@/components/ui/mobile-search';

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

      <div>
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
      
      {/* Mobile Search */}
      <MobileSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default Index;
