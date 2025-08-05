import React from 'react';
import { Link } from 'react-router-dom';
import { OverviewPageSection, ToolTimeCardSectionConfig } from '@/types/overview-sections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Target, Users } from 'lucide-react';

interface DynamicOverviewToolTimeCardProps {
  section: OverviewPageSection;
}

const DynamicOverviewToolTimeCard: React.FC<DynamicOverviewToolTimeCardProps> = ({ section }) => {
  const config = section.layout_config as ToolTimeCardSectionConfig;
  const layout = config?.layout || 'two_column';

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

  const topicList = getListContent('topic_list');
  const badges = getListContent('badges');

  return (
    <Card className="mb-12 overflow-hidden">
      <CardHeader className="text-white" style={getHeaderStyle()}>
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
        <div className={layout === 'two_column' ? 'grid md:grid-cols-2 gap-6' : 'space-y-6'}>
          <div className="space-y-4">
            {section.description && (
              <p className="text-muted-foreground leading-relaxed">
                <strong>Tool Time</strong> {section.description}
              </p>
            )}
            
            <div className="space-y-3">
              {/* Focus */}
              {getContent('focus_title') && (
                <div className="flex items-start gap-3">
                  <Target size={16} className="text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{getContent('focus_title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getContent('focus_text')}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Audience */}
              {getContent('audience_title') && (
                <div className="flex items-start gap-3">
                  <Users size={16} className="text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">{getContent('audience_title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getContent('audience_text')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Topics List */}
          {layout === 'two_column' && topicList.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">{getContent('topics_title')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {topicList.map((topic: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Single column topics list */}
        {layout !== 'two_column' && topicList.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-foreground">{getContent('topics_title')}</h4>
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {topicList.map((topic: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Badges and Button */}
        <div className="pt-6 border-t border-border">
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
      </CardContent>
    </Card>
  );
};

export default DynamicOverviewToolTimeCard;