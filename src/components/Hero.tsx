
import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Hero = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [videoType, setVideoType] = useState<'youtube' | 'uploaded'>('youtube');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const playerRef = useRef<any>(null);
  const htmlVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadVideoSettings();
  }, []);

  useEffect(() => {
    if (videoType === 'youtube' && youtubeUrl) {
      initializeYouTubePlayer();
    }
  }, [videoType, youtubeUrl]);

  const loadVideoSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_name, setting_value')
        .in('setting_name', ['hero_video_type', 'hero_video_url', 'hero_youtube_url']);

      if (error) throw error;

      const settings = data.reduce((acc, setting) => {
        acc[setting.setting_name] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>);

      setVideoType(settings.hero_video_type as 'youtube' | 'uploaded' || 'youtube');
      setUploadedVideoUrl(settings.hero_video_url || '');
      setYoutubeUrl(settings.hero_youtube_url || 'https://www.youtube.com/embed/nBQKMPWrUgc?autoplay=1&mute=1&loop=1&playlist=nBQKMPWrUgc&controls=0&showinfo=0&modestbranding=1&enablejsapi=1');
    } catch (error) {
      console.error('Error loading video settings:', error);
      // Fallback to YouTube
      setVideoType('youtube');
      setYoutubeUrl('https://www.youtube.com/embed/nBQKMPWrUgc?autoplay=1&mute=1&loop=1&playlist=nBQKMPWrUgc&controls=0&showinfo=0&modestbranding=1&enablejsapi=1');
    }
  };

  const initializeYouTubePlayer = () => {
    const onReady = () => {
      if (playerRef.current) {
        if (isMuted) {
          playerRef.current.mute();
        }
        playerRef.current.playVideo();
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
  };

  const toggleMute = () => {
    if (videoType === 'youtube' && playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
    } else if (videoType === 'uploaded' && htmlVideoRef.current) {
      htmlVideoRef.current.muted = !htmlVideoRef.current.muted;
    }
    setIsMuted((prev) => !prev);
  };

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {videoType === 'youtube' && youtubeUrl ? (
        <iframe
          id="hero-video"
          src={youtubeUrl}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen"
          title="Hintergrund-Video"
        />
      ) : videoType === 'uploaded' && uploadedVideoUrl ? (
        <video
          ref={htmlVideoRef}
          src={uploadedVideoUrl}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          autoPlay
          muted={isMuted}
          loop
          playsInline
        />
      ) : (
        // Fallback: YouTube video
        <iframe
          id="hero-video"
          src="https://www.youtube.com/embed/nBQKMPWrUgc?autoplay=1&mute=1&loop=1&playlist=nBQKMPWrUgc&controls=0&showinfo=0&modestbranding=1&enablejsapi=1"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen"
          title="Hintergrund-Video"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent pointer-events-none z-10" />
      <button
        onClick={toggleMute}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full transition"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      
      <div className="text-center z-20 px-4 max-w-4xl mx-auto">
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight font-cooper">
          Finance Transformers - <span className="text-[#13B87B]">Podcasts, die Finance auf links drehen</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Wir sprechen über Transformation, wie sie wirklich passiert – ehrlich, unterhaltsam und relevant.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#wtf"
            className="bg-[#13B87B] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#0FA66A] transition-colors duration-300 transform hover:scale-105"
          >
            GEHE ZUR AKTUELLEN FOLGE


          </a>
        </div>

        <div className="mt-6 flex items-center justify-center space-x-3">
          <span className="text-white font-medium">Über 1.000 Zuhörer jede Woche!</span>
        </div>
      </div>
      



    </section>
  );
};

export default Hero;
