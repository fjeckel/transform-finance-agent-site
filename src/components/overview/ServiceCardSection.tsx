import React from 'react';
import { Link } from 'react-router-dom';
import { Info, FileText, Target, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OverviewPageSection, getContentValue } from '@/hooks/useOverviewPageSections';

interface ServiceCardSectionProps {
  section: OverviewPageSection;
}

const ServiceCardSection: React.FC<ServiceCardSectionProps> = ({ section }) => {
  // Get icon based on section key
  const getIcon = () => {
    switch (section.section_key) {
      case 'wtf_explanation':
        return Info;
      case 'cfo_memo_explanation':
        return FileText;
      default:
        return Info;
    }
  };

  // Get icon color based on section background
  const getIconColor = () => {
    if (section.background_color.includes('#13B87B')) return '#13B87B';
    if (section.background_color.includes('#003FA5')) return '#003FA5';
    return '#13B87B';
  };

  const IconComponent = getIcon();
  const iconColor = getIconColor();

  // Helper function to get content points (mission, audience, topics, etc.)
  const getContentPoints = () => {
    const points = [];
    
    // Check for mission/format/focus
    const firstTitle = getContentValue(section, 'mission_title') || 
                      getContentValue(section, 'format_title') || 
                      getContentValue(section, 'focus_title');
    const firstDesc = getContentValue(section, 'mission_description') || 
                     getContentValue(section, 'format_description') || 
                     getContentValue(section, 'focus_description');
    
    if (firstTitle && firstDesc) {
      points.push({ title: firstTitle, description: firstDesc, icon: Target });
    }

    // Check for audience
    const audienceTitle = getContentValue(section, 'audience_title');
    const audienceDesc = getContentValue(section, 'audience_description');
    if (audienceTitle && audienceDesc) {
      points.push({ title: audienceTitle, description: audienceDesc, icon: Users });
    }

    // Check for topics/benefit
    const topicsTitle = getContentValue(section, 'topics_title') || getContentValue(section, 'benefit_title');
    const topicsDesc = getContentValue(section, 'topics_description') || getContentValue(section, 'benefit_description');
    if (topicsTitle && topicsDesc) {
      points.push({ title: topicsTitle, description: topicsDesc, icon: TrendingUp });
    }

    return points;
  };

  const contentPoints = getContentPoints();
  
  // Get badges
  const badges = [
    getContentValue(section, 'badge_1'),
    getContentValue(section, 'badge_2'),
    getContentValue(section, 'badge_3')
  ].filter(Boolean);

  const ctaText = getContentValue(section, 'cta_text');
  const ctaLink = getContentValue(section, 'cta_link');
  const isOutlineButton = section.section_key === 'cfo_memo_explanation';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardHeader 
        className="text-white"
        style={{ background: section.background_color }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <IconComponent size={24} />
          </div>
          <div>
            <CardTitle className="text-2xl font-cooper">{section.title}</CardTitle>
            {section.subtitle && (
              <p className="text-white/90 mt-1">{section.subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {section.description && (
            <p className="text-muted-foreground leading-relaxed">
              <strong>{section.title}</strong> {section.description}
            </p>
          )}
          
          {contentPoints.length > 0 && (
            <div className="space-y-3">
              {contentPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <point.icon 
                    size={16} 
                    className="mt-1 flex-shrink-0" 
                    style={{ color: iconColor }}
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">{point.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-border">
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {badges.map((badge, index) => (
                  <Badge key={index} variant="secondary">{badge}</Badge>
                ))}
              </div>
            )}
            {ctaText && ctaLink && (
              <Button asChild className="w-full" variant={isOutlineButton ? "outline" : "default"}>
                <Link to={ctaLink}>
                  {ctaText}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCardSection;