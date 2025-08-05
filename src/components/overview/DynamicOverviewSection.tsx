import React from 'react';
import { OverviewPageSection } from '@/hooks/useOverviewPageSections';
import { LazyLoad } from '@/components/ui/lazy-load';
import { Skeleton } from '@/components/ui/skeleton';
import OverviewHeroSection from './OverviewHeroSection';
import ServiceCardSection from './ServiceCardSection';
import FeatureOverviewSection from './FeatureOverviewSection';
import CallToActionSection from './CallToActionSection';

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
    console.error(`Error in overview section ${this.props.sectionKey}:`, error, errorInfo);
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

interface DynamicOverviewSectionProps {
  section: OverviewPageSection;
}

const DynamicOverviewSection: React.FC<DynamicOverviewSectionProps> = ({ section }) => {
  const renderSectionContent = () => {
    try {
      switch (section.section_type) {
        case 'overview_hero':
          return <OverviewHeroSection section={section} />;
        case 'service_card':
          return <ServiceCardSection section={section} />;
        case 'feature_overview':
          return <FeatureOverviewSection section={section} />;
        case 'call_to_action':
          return <CallToActionSection section={section} />;
        default:
          console.warn(`Unknown section type: ${section.section_type}`);
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

export default DynamicOverviewSection;