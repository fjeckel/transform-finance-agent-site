import React from 'react';
import { OverviewPageSection, HeroSectionConfig } from '@/types/overview-sections';

interface DynamicOverviewHeroSectionProps {
  section: OverviewPageSection;
}

const DynamicOverviewHeroSection: React.FC<DynamicOverviewHeroSectionProps> = ({ section }) => {
  const config = section.layout_config as HeroSectionConfig;
  const textAlign = config?.text_align || 'center';
  const maxWidth = config?.max_width || '3xl';

  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center':
      default: return 'text-center';
    }
  };

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-3xl';
    }
  };

  const getBackgroundStyle = () => {
    if (section.gradient_from && section.gradient_to) {
      return {
        background: `linear-gradient(to right, ${section.gradient_from}, ${section.gradient_to})`
      };
    }
    return {
      backgroundColor: section.background_color
    };
  };

  return (
    <div className={`${getTextAlignClass()} mb-12`} style={getBackgroundStyle()}>
      <div className="py-8">
        <h1 
          className={`text-4xl lg:text-5xl font-bold mb-6 font-cooper ${getMaxWidthClass()} mx-auto`}
          style={{ color: section.text_color }}
        >
          {section.title}
        </h1>
        {section.subtitle && (
          <h2 
            className={`text-xl font-medium mb-4 ${getMaxWidthClass()} mx-auto`}
            style={{ color: section.text_color }}
          >
            {section.subtitle}
          </h2>
        )}
        {section.description && (
          <p 
            className={`text-xl leading-relaxed ${getMaxWidthClass()} mx-auto`}
            style={{ color: section.text_color || '#6b7280' }}
          >
            {section.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default DynamicOverviewHeroSection;