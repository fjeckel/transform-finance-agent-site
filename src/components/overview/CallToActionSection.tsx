import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { OverviewPageSection, getContentValue } from '@/hooks/useOverviewPageSections';

interface CallToActionSectionProps {
  section: OverviewPageSection;
}

const CallToActionSection: React.FC<CallToActionSectionProps> = ({ section }) => {
  const primaryCtaText = getContentValue(section, 'primary_cta_text');
  const primaryCtaLink = getContentValue(section, 'primary_cta_link');
  const secondaryCtaText = getContentValue(section, 'secondary_cta_text');
  const secondaryCtaLink = getContentValue(section, 'secondary_cta_link');

  return (
    <div 
      className="text-center rounded-2xl p-8"
      style={{ background: section.background_color }}
    >
      <h2 className="text-2xl font-bold text-foreground mb-4 font-cooper">
        {section.title}
      </h2>
      {section.description && (
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          {section.description}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {primaryCtaText && primaryCtaLink && (
          <Button asChild size="lg">
            <Link to={primaryCtaLink}>
              {primaryCtaText}
            </Link>
          </Button>
        )}
        {secondaryCtaText && secondaryCtaLink && (
          <Button asChild variant="outline" size="lg">
            <Link to={secondaryCtaLink}>
              {secondaryCtaText}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CallToActionSection;