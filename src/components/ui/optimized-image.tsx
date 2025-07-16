import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = '/placeholder.svg',
  loading = 'lazy',
  sizes = '100vw',
  priority = false
}: OptimizedImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Generate WebP and fallback sources
  const webpSrc = imgSrc.endsWith('.jpg') || imgSrc.endsWith('.jpeg') || imgSrc.endsWith('.png') 
    ? imgSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp') 
    : imgSrc;

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
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/20 animate-pulse" />
      )}
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={imgSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onError={handleError}
          onLoad={handleLoad}
          loading={priority ? 'eager' : loading}
          sizes={sizes}
          decoding="async"
        />
      </picture>
    </div>
  );
};

export default OptimizedImage;