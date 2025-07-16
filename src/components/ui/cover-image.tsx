import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface CoverImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const CoverImage: React.FC<CoverImageProps> = ({ 
  src, 
  alt, 
  className,
  fallbackSrc = '/placeholder.svg'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    console.log('CoverImage loaded successfully:', currentSrc);
    setIsLoading(false);
  };

  const handleError = () => {
    console.log('CoverImage failed to load:', currentSrc);
    if (currentSrc !== fallbackSrc) {
      console.log('Trying fallback image:', fallbackSrc);
      setCurrentSrc(fallbackSrc);
    } else {
      console.log('Fallback image also failed, showing error state');
      setIsLoading(false);
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted/20 text-muted-foreground",
        className
      )}>
        <ImageOff className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <Skeleton className={cn("absolute inset-0", className)} />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};