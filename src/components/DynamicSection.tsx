import React from 'react';
import { MainPageSection } from '@/hooks/useMainPageSections';
import { LazyLoad } from '@/components/ui/lazy-load';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicWTFSection from './DynamicWTFSection';
import DynamicFinanceTransformersSection from './DynamicFinanceTransformersSection';
import DynamicPersonProfileSection from './DynamicPersonProfileSection';
import DynamicSocialLinksSection from './DynamicSocialLinksSection';

interface DynamicSectionProps {
  section: MainPageSection;
}

const DynamicSection: React.FC<DynamicSectionProps> = ({ section }) => {
  const renderSectionContent = () => {
    switch (section.section_type) {
      case 'podcast':
        return <DynamicWTFSection section={section} />;
      case 'episode_carousel':
        return <DynamicFinanceTransformersSection section={section} />;
      case 'person_profile':
        return <DynamicPersonProfileSection section={section} />;
      case 'social_links':
        return <DynamicSocialLinksSection section={section} />;
      default:
        return null;
    }
  };

  return (
    <LazyLoad fallback={<div className="h-96"><Skeleton className="h-full w-full" /></div>}>
      {renderSectionContent()}
    </LazyLoad>
  );
};

export default DynamicSection;