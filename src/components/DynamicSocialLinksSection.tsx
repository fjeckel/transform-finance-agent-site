import React from 'react';
import { Linkedin, Youtube } from 'lucide-react';
import { MainPageSection } from '@/hooks/useMainPageSections';

interface DynamicSocialLinksSectionProps {
  section: MainPageSection;
}

const DynamicSocialLinksSection: React.FC<DynamicSocialLinksSectionProps> = ({ section }) => {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'linkedin':
        return <Linkedin className="h-8 w-8" />;
      case 'youtube':
        return <Youtube className="h-8 w-8" />;
      default:
        return null;
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground font-cooper">
              {section.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {section.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {section.links?.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-8 rounded-2xl border border-border bg-card hover:bg-accent transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    className="p-4 rounded-full transition-all duration-300 group-hover:scale-110 shadow-lg"
                    style={{ backgroundColor: link.color }}
                  >
                    <div className="text-white">
                      {getIcon(link.icon)}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {link.platform_name}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {link.display_text}
                  </p>
                </div>
              </a>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default DynamicSocialLinksSection;
