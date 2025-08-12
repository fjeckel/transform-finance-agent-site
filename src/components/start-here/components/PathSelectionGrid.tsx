'use client';

import React from 'react';
import { LearningPath } from '../types/paths';
import { PathCard } from './PathCard';

interface PathSelectionGridProps {
  paths: LearningPath[];
  onPathSelect: (pathId: string) => void;
  onPathHover?: (pathId: string, duration: number) => void;
  className?: string;
}

export const PathSelectionGrid: React.FC<PathSelectionGridProps> = ({
  paths,
  onPathSelect,
  onPathHover,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto ${className}`}>
      {paths.map((path, index) => (
        <PathCard
          key={path.id}
          path={path}
          onSelect={() => onPathSelect(path.id)}
          onHover={onPathHover ? (duration) => onPathHover(path.id, duration) : undefined}
          delay={index * 100} // Staggered animation
          featured={path.popularity > 90}
        />
      ))}
    </div>
  );
};