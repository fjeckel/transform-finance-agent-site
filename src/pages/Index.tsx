
import React, { useState } from 'react';
import Hero from '@/components/Hero';
import SEOHead from '@/components/SEOHead';
import DynamicSection from '@/components/DynamicSection';
import { useMainPageSections } from '@/hooks/useMainPageSections';
import { Skeleton } from '@/components/ui/skeleton';
import TimTeuscherSection from '@/components/TimTeuscherSection';
import FabianJeckelSection from '@/components/FabianJeckelSection';
import { StartHereSection } from '@/components/start-here';

const Index = () => {
  const { data: sections, isLoading } = useMainPageSections();
  
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

        {/* Start Here Section - Personalized Learning Paths */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <div style={{ backgroundColor: 'red', padding: '20px', color: 'white', textAlign: 'center' }}>
              DEBUG: START HERE SECTION SHOULD BE HERE
            </div>
            <StartHereSection />
          </>
        )}

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
      </div>
    </div>
  );
};

export default Index;
