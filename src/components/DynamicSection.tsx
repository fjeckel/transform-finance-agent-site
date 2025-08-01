import React from 'react';
import { MainPageSection } from '@/hooks/useMainPageSections';
import { LazyLoad } from '@/components/ui/lazy-load';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicWTFSection from './DynamicWTFSection';
import DynamicFinanceTransformersSection from './DynamicFinanceTransformersSection';
import DynamicPersonProfileSection from './DynamicPersonProfileSection';
import DynamicSocialLinksSection from './DynamicSocialLinksSection';

// Error boundary component for individual sections
class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionKey: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; sectionKey: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in section ${this.props.sectionKey}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-8 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-gray-600">Fehler beim Laden dieser Sektion.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface DynamicSectionProps {
  section: MainPageSection;
}

const DynamicSection: React.FC<DynamicSectionProps> = ({ section }) => {
  const renderSectionContent = () => {
    try {
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
    } catch (error) {
      console.error(`Error rendering section ${section.section_key}:`, error);
      return (
        <div className="py-8 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-gray-600">Fehler beim Laden dieser Sektion.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <SectionErrorBoundary sectionKey={section.section_key}>
      <LazyLoad fallback={<div className="h-96"><Skeleton className="h-full w-full" /></div>}>
        {renderSectionContent()}
      </LazyLoad>
    </SectionErrorBoundary>
  );
};

export default DynamicSection;