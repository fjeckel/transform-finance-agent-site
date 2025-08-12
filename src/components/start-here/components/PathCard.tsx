'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Target, Star, TrendingUp } from 'lucide-react';
import { LearningPath } from '../types/paths';
import { useStartHereAnalytics } from '../hooks/useStartHereAnalytics';

interface PathCardProps {
  path: LearningPath;
  onSelect: () => void;
  onHover?: (duration: number) => void;
  delay?: number;
  featured?: boolean;
  className?: string;
}

export const PathCard: React.FC<PathCardProps> = ({
  path,
  onSelect,
  onHover,
  delay = 0,
  featured = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverStartTime = useRef<number | null>(null);
  const { trackPathCardHovered } = useStartHereAnalytics();

  const handleMouseEnter = () => {
    setIsHovered(true);
    hoverStartTime.current = Date.now();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverStartTime.current && onHover) {
      const duration = Date.now() - hoverStartTime.current;
      onHover(duration);
      trackPathCardHovered(path.id, duration);
      hoverStartTime.current = null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Einsteiger';
      case 'intermediate': return 'Fortgeschritten';
      case 'advanced': return 'Experte';
      default: return difficulty;
    }
  };

  return (
    <Card
      className={`
        relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
        cursor-pointer group border-0 bg-white
        ${featured ? 'ring-2 ring-yellow-400 shadow-lg' : 'shadow-md hover:shadow-2xl'}
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        background: `linear-gradient(145deg, white 0%, ${path.color}08 100%)`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-yellow-400 text-yellow-900 font-medium">
            <Star className="h-3 w-3 mr-1" />
            Beliebt
          </Badge>
        </div>
      )}

      {/* Popularity Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
          <TrendingUp className="h-3 w-3 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">{path.popularity}%</span>
        </div>
      </div>

      <CardHeader className="pb-4 pt-16">
        <div className="flex items-center mb-4">
          <div 
            className="p-3 rounded-full mr-4"
            style={{ 
              background: path.gradient,
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <path.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <Badge className={getDifficultyColor(path.difficulty)}>
              {getDifficultyText(path.difficulty)}
            </Badge>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
          {path.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {path.description}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Duration and Target Audience */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {path.estimatedTime}
          </div>
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-1" />
            {path.targetAudience.length} Rollen
          </div>
        </div>

        {/* Topics Preview */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 text-sm mb-2">Kernthemen:</h4>
          <div className="flex flex-wrap gap-1">
            {path.topics.slice(0, 3).map((topic, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {path.topics.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-500">
                +{path.topics.length - 3} weitere
              </Badge>
            )}
          </div>
        </div>

        {/* Outcomes Preview */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 text-sm mb-2">Du wirst lernen:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {path.outcomes.slice(0, 2).map((outcome, index) => (
              <li key={index} className="flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                {outcome}
              </li>
            ))}
            {path.outcomes.length > 2 && (
              <li className="text-xs text-gray-500 italic ml-3.5">
                +{path.outcomes.length - 2} weitere Lernergebnisse
              </li>
            )}
          </ul>
        </div>

        {/* CTA Button */}
        <Button
          className="w-full font-semibold transition-all duration-200 group-hover:shadow-md"
          style={{
            background: path.gradient,
            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Pfad starten
          <ArrowRight className={`ml-2 h-4 w-4 transition-transform duration-200 ${
            isHovered ? 'translate-x-1' : ''
          }`} />
        </Button>

        {/* Content Count */}
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500">
            {path.recommendedContent.length} empfohlene Inhalte • {path.contentTypes.join(', ')}
          </span>
        </div>
      </CardContent>

      {/* Hover Overlay Effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
        style={{ background: path.gradient }}
      />
    </Card>
  );
};