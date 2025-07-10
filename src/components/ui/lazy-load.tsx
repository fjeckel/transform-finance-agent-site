import { useEffect, useState } from 'react';

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}

export const LazyLoad = ({ 
  children, 
  fallback = null, 
  rootMargin = '100px' 
}: LazyComponentProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return (
    <div ref={setRef}>
      {isVisible ? children : fallback}
    </div>
  );
};