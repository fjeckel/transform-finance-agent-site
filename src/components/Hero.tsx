
import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const Hero = () => {
  const [isMuted, setIsMuted] = useState(true);
  const playerRef = useRef<any>(null);

  useEffect(() => {
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
  }, []);

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
      <iframe
        id="hero-video"
        src="https://www.youtube.com/embed/nBQKMPWrUgc?autoplay=1&mute=1&loop=1&playlist=nBQKMPWrUgc&controls=0&showinfo=0&modestbranding=1&enablejsapi=1"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen"
        title="Hintergrund-Video"
      />
      <button
        onClick={toggleMute}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/70 hover:bg-white text-gray-800 p-2 rounded-full transition"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
      
      <div className="text-center z-10 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#13B87B] flex items-center justify-center">
            <span className="text-white text-2xl font-bold">FT</span>
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
          FINANCE<br />
          <span className="text-[#13B87B]">TRANSFORMERS</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Provokante Thought Leadership für Finanzprofis, die bereit sind, die Zukunft zu gestalten
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="#wtf" 
            className="bg-[#13B87B] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#0FA66A] transition-colors duration-300 transform hover:scale-105"
          >
            TRANSFORMATION STARTEN
          </a>
          <a 
            href="#cfo-memo" 
            className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
          >
            DAS CFO MEMO ERHALTEN
          </a>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
