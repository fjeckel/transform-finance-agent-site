import React from 'react';
import { useMainPageSectionByKey } from '@/hooks/useMainPageSections';
import DynamicSocialLinksSection from '@/components/DynamicSocialLinksSection';

const DynamicSocialHandlesSection = () => {
  const { data: sectionData } = useMainPageSectionByKey('social-handles');

  // If no CMS data found, don't render anything
  if (!sectionData) {
    return null;
  }

  return <DynamicSocialLinksSection section={sectionData} />;
};
export default DynamicSocialHandlesSection;