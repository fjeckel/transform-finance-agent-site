import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { useOverviewPageSections } from '@/hooks/useOverviewPageSections';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicOverviewSection from '@/components/overview/DynamicOverviewSection';

const Overview = () => {
  const { data: sections, isLoading } = useOverviewPageSections();

  // Debug: Log sections to console
  React.useEffect(() => {
    if (sections) {
      console.log('Loaded overview sections:', sections.map(s => ({
        key: s.section_key,
        title: s.title,
        type: s.section_type,
        order: s.sort_order
      })));
    }
  }, [sections]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Überblick - Finance Transformers"
        description="Entdecke die Welt der Finance Transformers: WTF?!, CFO Memos und Tool Time. Dein umfassender Leitfaden zur Finanztransformation."
      />
      
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-[#13B87B] transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Zurück zur Startseite
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-8">
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
            {sections?.map((section, index) => {
              // Handle service cards in a grid
              if (section.section_type === 'service_card') {
                // Check if this is the first service card
                const isFirstServiceCard = sections.findIndex(s => s.section_type === 'service_card') === index;
                if (isFirstServiceCard) {
                  // Render both service cards in a grid
                  const serviceCards = sections.filter(s => s.section_type === 'service_card');
                  return (
                    <div key="service-cards" className="grid lg:grid-cols-2 gap-8 mb-12">
                      {serviceCards.map((serviceSection) => (
                        <DynamicOverviewSection key={serviceSection.id} section={serviceSection} />
                      ))}
                    </div>
                  );
                }
                // Skip rendering individual service cards as they're handled above
                return null;
              }
              
              // Render other sections normally
              return <DynamicOverviewSection key={section.id} section={section} />;
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Overview;