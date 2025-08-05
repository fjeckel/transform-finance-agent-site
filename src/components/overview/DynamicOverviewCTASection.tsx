import React from 'react';
import { Link } from 'react-router-dom';
import { OverviewPageSection, CTASectionConfig } from '@/types/overview-sections';
import { Button } from '@/components/ui/button';

interface DynamicOverviewCTASectionProps {
  section: OverviewPageSection;
}

const DynamicOverviewCTASection: React.FC<DynamicOverviewCTASectionProps> = ({ section }) => {
  const config = section.layout_config as CTASectionConfig;
  const textAlign = config?.text_align || 'center';
  const padding = config?.padding || 'large';
  const buttonLayout = config?.button_layout || 'responsive';

  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center':
      default: return 'text-center';
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case 'small': return 'p-6';
      case 'default': return 'p-8';
      case 'large':
      default: return 'p-8';
    }
  };

  const getButtonLayoutClass = () => {
    switch (buttonLayout) {
      case 'vertical': return 'flex flex-col gap-4 justify-center';
      case 'horizontal': return 'flex flex-row gap-4 justify-center';
      case 'responsive':
      default: return 'flex flex-col sm:flex-row gap-4 justify-center';
    }
  };

  const getBackgroundStyle = () => {
    if (section.gradient_from && section.gradient_to) {
      return {
        background: `linear-gradient(to right, ${section.gradient_from}10, ${section.gradient_to}10)`
      };
    }
    return {
      backgroundColor: section.background_color
    };
  };

  return (
    <div 
      className={`${getTextAlignClass()} rounded-2xl ${getPaddingClass()}`}
      style={getBackgroundStyle()}
    >
      <h2 
        className="text-2xl font-bold mb-4 font-cooper"
        style={{ color: section.text_color }}
      >
        {section.title}
      </h2>
      
      {section.subtitle && (
        <h3 
          className="text-lg font-medium mb-4"
          style={{ color: section.text_color }}
        >
          {section.subtitle}
        </h3>
      )}
      
      {section.description && (
        <p 
          className="mb-6 max-w-2xl mx-auto"
          style={{ color: section.text_color || '#6b7280' }}
        >
          {section.description}
        </p>
      )}
      
      {/* CTA Buttons */}
      {section.links && section.links.length > 0 && (
        <div className={getButtonLayoutClass()}>
          {section.links.map((link) => (
            <Button 
              key={link.id} 
              asChild 
              variant={link.button_variant}
              size={link.button_size}
            >
              <Link to={link.url}>
                {link.link_text}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DynamicOverviewCTASection;