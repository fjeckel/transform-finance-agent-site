import React from 'react';
import { Link } from 'react-router-dom';
import { OverviewPageSection, InfoCardSectionConfig } from '@/types/overview-sections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Users, TrendingUp } from 'lucide-react';

interface DynamicOverviewInfoCardProps {
  section: OverviewPageSection;
}

const DynamicOverviewInfoCard: React.FC<DynamicOverviewInfoCardProps> = ({ section }) => {
  const config = section.layout_config as InfoCardSectionConfig;
  const iconName = config?.icon || 'info';

  // Helper function to get content by key
  const getContent = (key: string) => {
    return section.content?.find(c => c.content_key === key)?.content_value || '';
  };

  // Helper function to get list content
  const getListContent = (key: string) => {
    const content = section.content?.find(c => c.content_key === key);
    if (content?.content_type === 'list') {
      try {
        return JSON.parse(content.content_value);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Get the appropriate icon component
  const getIcon = () => {
    // Default to Info icon if no specific icon mapping found
    switch (iconName) {
      case 'target': return <Target size={24} />;
      case 'users': return <Users size={24} />;
      case 'trending-up': return <TrendingUp size={24} />;
      default: return <Target size={24} />;
    }
  };

  const getHeaderStyle = () => {
    if (section.gradient_from && section.gradient_to) {
      return {
        background: `linear-gradient(to right, ${section.gradient_from}, ${section.gradient_to})`
      };
    }
    return {
      backgroundColor: section.background_color
    };
  };

  const badges = getListContent('badges');

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardHeader className="text-white" style={getHeaderStyle()}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl font-cooper">{section.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {section.subtitle && (
            <p className="text-muted-foreground leading-relaxed">
              <strong>{section.subtitle}</strong> {section.description}
            </p>
          )}
          
          <div className="space-y-3">
            {/* Mission/Format */}
            {getContent('mission_title') && (
              <div className="flex items-start gap-3">
                <Target size={16} className="mt-1 flex-shrink-0" style={{ color: section.gradient_from || '#13B87B' }} />
                <div>
                  <h4 className="font-semibold text-foreground">{getContent('mission_title') || getContent('format_title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {getContent('mission_text') || getContent('format_text')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Audience/Zielgruppe */}
            {getContent('audience_title') && (
              <div className="flex items-start gap-3">
                <Users size={16} className="mt-1 flex-shrink-0" style={{ color: section.gradient_from || '#13B87B' }} />
                <div>
                  <h4 className="font-semibold text-foreground">{getContent('audience_title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {getContent('audience_text')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Topics/Themen/Nutzen */}
            {(getContent('topics_title') || getContent('benefit_title')) && (
              <div className="flex items-start gap-3">
                <TrendingUp size={16} className="mt-1 flex-shrink-0" style={{ color: section.gradient_from || '#13B87B' }} />
                <div>
                  <h4 className="font-semibold text-foreground">
                    {getContent('topics_title') || getContent('benefit_title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {getContent('topics_text') || getContent('benefit_text')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Badges and Button */}
          <div className="pt-4 border-t border-border">
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {badges.map((badge: string, index: number) => (
                  <Badge key={index} variant="secondary">{badge}</Badge>
                ))}
              </div>
            )}
            
            {/* Links/Buttons */}
            {section.links && section.links.length > 0 && (
              <div className="space-y-2">
                {section.links.map((link) => (
                  <Button 
                    key={link.id} 
                    asChild 
                    className="w-full"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicOverviewInfoCard;