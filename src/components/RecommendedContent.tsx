import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface RecommendedContentProps {
  currentContentId?: string;
  userId?: string;
  maxItems?: number;
  showTabs?: boolean;
  variant?: 'compact' | 'detailed';
}

export const RecommendedContent: React.FC<RecommendedContentProps> = ({
  currentContentId,
  userId,
  maxItems = 6,
  showTabs = true,
  variant = 'detailed'
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Empfohlene Inhalte</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center text-muted-foreground">
        <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>Recommendations coming soon</p>
      </CardContent>
    </Card>
  );
};

export default RecommendedContent;