import React from 'react';
import { ExternalLink, Mail, Linkedin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MainPageSection } from '@/hooks/useMainPageSections';

interface DynamicPersonProfileSectionProps {
  section: MainPageSection;
}

const DynamicPersonProfileSection: React.FC<DynamicPersonProfileSectionProps> = ({ section }) => {
  const avatarImage = section.content?.find(c => c.content_key === 'avatar_image')?.content_value;
  const bio = section.content?.find(c => c.content_key === 'bio')?.content_value;
  const role = section.content?.find(c => c.content_key === 'role')?.content_value;
  
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'mail':
        return <Mail className="h-5 w-5" />;
      case 'external-link':
        return <ExternalLink className="h-5 w-5" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  const isTimTeuscher = section.section_key === 'tim_teuscher';

  return (
    <section 
      id={section.section_key} 
      className={`py-20 ${isTimTeuscher ? 'bg-muted/30' : 'bg-background'}`}
    >
      <div className="container mx-auto px-4">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
          isTimTeuscher ? '' : 'lg:grid-flow-col-dense'
        }`}>
          <div className={`space-y-6 ${isTimTeuscher ? 'order-1' : 'order-2 lg:order-1'}`}>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground font-cooper">
              {section.title}
            </h2>
            {section.subtitle && (
              <h3 className="text-xl text-primary font-semibold">
                {section.subtitle}
              </h3>
            )}
            {role && (
              <p className="text-lg font-medium text-muted-foreground">
                {role}
              </p>
            )}
            <p className="text-lg text-muted-foreground leading-relaxed">
              {bio || section.description}
            </p>
            
            <div className="flex flex-wrap gap-4">
              {section.links?.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300 font-medium"
                >
                  {getIcon(link.icon)}
                  <span className="ml-2">{link.display_text || link.platform_name}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div className={`flex justify-center ${isTimTeuscher ? 'order-2' : 'order-1 lg:order-2'}`}>
            <Avatar className="w-80 h-80 shadow-2xl">
              <AvatarImage
                src={avatarImage}
                alt={section.title}
                className="object-cover"
              />
              <AvatarFallback className="text-6xl font-bold">
                {section.title.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DynamicPersonProfileSection;