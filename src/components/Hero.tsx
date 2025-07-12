import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsLoading(false);
      return;
    }

    const onReady = () => {
      if (playerRef.current) {
        if (isMuted) {
          playerRef.current.mute();
        }
        playerRef.current.playVideo();
        setIsLoading(false);
      }
    };

    const onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('hero-video', {
        events: { onReady }
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    } else {
      onYouTubeIframeAPIReady();
    }
  }, [isMobile, isMuted]);

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
    }
    setIsMuted((prev) => !prev);
  };

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Video Background for Desktop */}
      {!isMobile && (
        <>
          <iframe
            id="hero-video"
            src="https://www.youtube.com/embed/nBQKMPWrUgc?autoplay=1&mute=1&loop=1&playlist=nBQKMPWrUgc&controls=0&showinfo=0&modestbranding=1&enablejsapi=1"
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen"
            title="Hintergrund-Video"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary to-brand-secondary animate-pulse" />
          )}
        </>
      )}
      
      {/* Static Background for Mobile */}
      {isMobile && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-primary to-brand-secondary" />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent pointer-events-none z-10" />
      
      {/* Audio Control (Desktop only) */}
      {!isMobile && !isLoading && (
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleMute}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/90 hover:bg-white backdrop-blur-sm"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span className="ml-2 text-sm">{isMuted ? 'Audio an' : 'Audio aus'}</span>
        </Button>
      )}
      
      {/* Content */}
      <div className="text-center z-20 px-4 max-w-5xl mx-auto animate-fade-in-up">
        <h1 className="text-hero font-bold text-white mb-6 tracking-tight font-cooper">
          Finance Transformers - 
          <span className="block mt-2 text-primary-foreground">
            Podcasts, die Finance auf links drehen
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
          Wir sprechen über Transformation, wie sie wirklich passiert – ehrlich, unterhaltsam und relevant.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="btn-primary px-8 py-4 text-lg font-bold font-cooper uppercase tracking-wide"
          >
            <a href="#wtf">
              <Play size={20} className="mr-3" />
              Gehe zur aktuellen Folge
            </a>
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center space-x-2 text-white/90 font-medium">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Über 1.000 Zuhörer jede Woche!</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;