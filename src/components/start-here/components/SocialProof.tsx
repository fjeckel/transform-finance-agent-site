'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Clock, Activity } from 'lucide-react';

interface Stats {
  transformationSuccess: string;
  timeToValue: string;
  completionRate: string;
}

interface SocialData {
  userCount: number;
  text: string;
  recentActivity: string[];
}

interface SocialProofProps {
  stats: Stats;
  socialData: SocialData;
  onInteraction: (signalType: 'statistic' | 'social_proof', signalId: string, action: 'viewed' | 'clicked' | 'hovered') => void;
  className?: string;
}

export const SocialProof: React.FC<SocialProofProps> = ({
  stats,
  socialData,
  onInteraction,
  className = ''
}) => {
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Cycle through recent activity
    const interval = setInterval(() => {
      setCurrentActivityIndex(prev => 
        (prev + 1) % socialData.recentActivity.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [socialData.recentActivity.length]);

  useEffect(() => {
    // Track initial view
    onInteraction('social_proof', 'section_viewed', 'viewed');
    setIsVisible(true);
  }, [onInteraction]);

  const handleStatClick = (statKey: string) => {
    onInteraction('statistic', statKey, 'clicked');
  };

  const handleActivityClick = () => {
    onInteraction('social_proof', 'recent_activity', 'clicked');
  };

  return (
    <div className={`${className}`}>
      {/* Main Social Proof Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {socialData.text}
          </h3>
          
          {/* Live Activity Feed */}
          <div className="mt-4">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-4 w-4 text-green-500 mr-2" />
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                Live
              </Badge>
            </div>
            <div 
              className="text-sm text-gray-600 min-h-[20px] transition-all duration-500 cursor-pointer hover:text-gray-800"
              onClick={handleActivityClick}
            >
              {socialData.recentActivity[currentActivityIndex]}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          onClick={() => handleStatClick('transformation_success')}
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">94%</div>
            <div className="text-sm text-gray-600">
              {stats.transformationSuccess.replace('94% ', '')}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          onClick={() => handleStatClick('time_to_value')}
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">5 Min</div>
            <div className="text-sm text-gray-600">
              {stats.timeToValue.replace('Durchschnittlich 5 Minuten ', '')}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          onClick={() => handleStatClick('completion_rate')}
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">78%</div>
            <div className="text-sm text-gray-600">
              {stats.completionRate.replace('78% ', '')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};