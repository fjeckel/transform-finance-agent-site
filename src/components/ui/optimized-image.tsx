
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
    console.log('Image failed to load:', imgSrc);
    if (imgSrc !== fallbackSrc) {
      console.log('Trying fallback:', fallbackSrc);
      setImgSrc(fallbackSrc);
    } else {
      console.log('Fallback also failed, showing error icon');
      setHasError(true);
    }
  };

  const handleLoad = () => {
    console.log('Image loaded successfully:', imgSrc);
    setIsLoaded(true);
  };

  // Check if the image is an SVG file
  const isSvg = imgSrc.toLowerCase().includes('.svg') || imgSrc.toLowerCase().includes('svg');

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

  // For SVG files, display directly without complex loading states
  if (isSvg) {
    console.log('Rendering SVG image:', imgSrc);
    
    // Add additional debugging
    const handleSvgLoad = () => {
      console.log('✅ SVG loaded successfully:', imgSrc);
      setIsLoaded(true);
    };
    
    const handleSvgError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      console.error('❌ SVG failed to load:', imgSrc, event);
      handleError();
    };
    
    return (
      <img
        src={imgSrc}
        alt={alt}
        className={className || "block w-full h-full object-cover"}
        onError={handleSvgError}
        onLoad={handleSvgLoad}
        loading={priority ? 'eager' : loading}
        sizes={sizes}
      />
    );
  }

  // For non-SVG images, try to generate WebP version
  const webpSrc = imgSrc.endsWith('.jpg') || imgSrc.endsWith('.jpeg') || imgSrc.endsWith('.png') 
    ? imgSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp') 
    : imgSrc;

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
