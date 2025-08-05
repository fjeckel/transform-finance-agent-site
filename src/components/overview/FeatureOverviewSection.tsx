import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Target, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OverviewPageSection, getContentValue } from '@/hooks/useOverviewPageSections';

interface FeatureOverviewSectionProps {
  section: OverviewPageSection;
}

const FeatureOverviewSection: React.FC<FeatureOverviewSectionProps> = ({ section }) => {
  // Get topic items
  const getTopics = () => {
    const topics = [];
    for (let i = 1; i <= 5; i++) {
      const topic = getContentValue(section, `topic_${i}`);
      if (topic) topics.push(topic);
    }
    return topics;
  };

  const topics = getTopics();
  
  // Get badges
  const badges = [
    getContentValue(section, 'badge_1'),
    getContentValue(section, 'badge_2'),
    getContentValue(section, 'badge_3'),
    getContentValue(section, 'badge_4')
  ].filter(Boolean);

  const ctaText = getContentValue(section, 'cta_text');
  const ctaLink = getContentValue(section, 'cta_link');
  
  const focusTitle = getContentValue(section, 'focus_title');
  const focusDesc = getContentValue(section, 'focus_description');
  const audienceTitle = getContentValue(section, 'audience_title');
  const audienceDesc = getContentValue(section, 'audience_description');
  const topicsTitle = getContentValue(section, 'topics_title');

  return (
    <Card className="mb-12 overflow-hidden">
      <CardHeader 
        className="text-white"
        style={{ background: section.background_color }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Wrench size={24} />
          </div>
          <div>
            <CardTitle className="text-2xl font-cooper">{section.title}</CardTitle>
            {section.subtitle && (
              <p className="text-purple-100 mt-2">
                {section.subtitle}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {section.description && (
              <p className="text-muted-foreground leading-relaxed">
                <strong>Tool Time</strong> {section.description}
              </p>
            )}
            
            <div className="space-y-3">
              {focusTitle && focusDesc && (
                <div className="flex items-start gap-3">
                  <Target size={16} className="text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{focusTitle}</h4>
                    <p className="text-sm text-muted-foreground">
                      {focusDesc}
                    </p>
                  </div>
                </div>
              )}
              
              {audienceTitle && audienceDesc && (
                <div className="flex items-start gap-3">
                  <Users size={16} className="text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{audienceTitle}</h4>
                    <p className="text-sm text-muted-foreground">
                      {audienceDesc}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {topicsTitle && (
              <h4 className="font-semibold text-foreground">{topicsTitle}</h4>
            )}
            {topics.length > 0 && (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {topics.map((topic, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                    {topic}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {badges.map((badge, index) => (
                <Badge key={index} variant="secondary">{badge}</Badge>
              ))}
            </div>
          )}
          {ctaText && ctaLink && (
            <Button asChild className="w-full" variant="outline">
              <Link to={ctaLink}>
                {ctaText}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureOverviewSection;