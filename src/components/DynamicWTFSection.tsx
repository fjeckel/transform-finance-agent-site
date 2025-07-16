import React from 'react';
import { ExternalLink } from 'lucide-react';
import { MainPageSection } from '@/hooks/useMainPageSections';

interface DynamicWTFSectionProps {
  section: MainPageSection;
}

const DynamicWTFSection: React.FC<DynamicWTFSectionProps> = ({ section }) => {
  const coverImage = section.content?.find(c => c.content_key === 'cover_image')?.content_value;
  const podcastLinks = section.links?.filter(link => link.link_type === 'podcast') || [];

  return (
    <section id={section.section_key} className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
              {section.title}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {section.description}
            </p>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Jetzt anhören auf:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {podcastLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg text-white"
                    style={{ backgroundColor: link.color }}
                  >
                    <span className="text-sm">{link.platform_name}</span>
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl transform rotate-3"></div>
              <img
                src={coverImage || '/img/wtf-cover.png'}
                alt={section.title}
                className="relative w-80 h-80 object-cover rounded-2xl shadow-2xl transform hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DynamicWTFSection;