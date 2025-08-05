import React from 'react';
import { OverviewPageSection } from '@/hooks/useOverviewPageSections';

interface OverviewHeroSectionProps {
  section: OverviewPageSection;
}

const OverviewHeroSection: React.FC<OverviewHeroSectionProps> = ({ section }) => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 font-cooper">
        {section.title}
      </h1>
      {section.description && (
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {section.description}
        </p>
      )}
    </div>
  );
};

export default OverviewHeroSection;