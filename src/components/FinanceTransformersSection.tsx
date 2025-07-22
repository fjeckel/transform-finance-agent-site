import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEpisodesBySeriesPublished } from '@/hooks/useEpisodeBySlug';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

const FinanceTransformersSection = () => {
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const { data: episodes, isLoading } = useEpisodesBySeriesPublished('finance_transformers', 3);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!episodes || episodes.length === 0) {
    return (
      <section id="finance-transformers" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 uppercase tracking-tight font-cooper">
              Finance <span className="text-[#003FA5]">Transformers</span>
            </h2>
            <p className="text-xl text-gray-600">Episoden werden bald verfügbar sein!</p>
          </div>
        </div>
      </section>
    );
  }
  const nextEpisode = () => {
    setCurrentEpisode(prev => (prev + 1) % episodes.length);
  };
  const prevEpisode = () => {
    setCurrentEpisode(prev => (prev - 1 + episodes.length) % episodes.length);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const currentEp = episodes[currentEpisode];
  const platformLinks = currentEp?.episode_platforms || [];
  const spotifyLink = platformLinks.find(p => p.platform_name.toLowerCase().includes('spotify'))?.platform_url;
  const appleLink = platformLinks.find(p => p.platform_name.toLowerCase().includes('apple'))?.platform_url;
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }
    const diff = event.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50; // swipe distance in px to trigger navigation
    if (Math.abs(diff) > threshold) {
      if (diff < 0) {
        nextEpisode();
      } else {
        prevEpisode();
      }
    }
    touchStartX.current = null;
  };
  return <section id="finance-transformers" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 uppercase tracking-tight font-cooper">
            Finance <span className="text-[#003FA5]">Transformers</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Finance Transformers ist das Schwester­format von WTF?! – Why Transform Finance. Statt Tim &amp; Fabians lockerem After-Work-Talk rückten hier Tim und Fabian mit wechselnden Gästen ins Studio. Im Fokus stehen echte Praxis­geschichten rund um Finance- &amp; Digital-Transformation – vom globalen Konzern bis zum Scale-up.</p>
        </div>

        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-xl" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="mb-4">
                <span className="inline-block bg-[#003FA5] text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                  Episode {currentEpisode + 1}
                </span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {currentEp?.title}
              </h3>
              
              <p className="text-lg text-gray-700 mb-6">
                {currentEp?.description || 'Episode Beschreibung wird bald verfügbar sein.'}
              </p>
              
              <div className="flex items-center space-x-6 mb-8">
                {currentEp?.duration && (
                  <span className="text-gray-600 font-medium">{currentEp.duration}</span>
                )}
                <span className="text-gray-600">{formatDate(currentEp?.publish_date)}</span>
              </div>
              
              <div className="flex space-x-4">
                <Link to={`/episode/${currentEp?.slug}`} className="flex items-center space-x-2 bg-[#13B87B] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#0F9A6A] transition-colors">
                  <span>Zur Episode</span>
                  <ExternalLink size={16} />
                </Link>
                {spotifyLink && (
                  <a href={spotifyLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-[#1DB954] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1AA34A] transition-colors">
                    <span>Spotify</span>
                    <ExternalLink size={16} />
                  </a>
                )}
                {appleLink && (
                  <a href={appleLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-[#A855F7] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#9333EA] transition-colors">
                    <span>Apple</span>
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={currentEp?.image_url || '/img/wtf-cover.png'} 
                alt={currentEp?.title || 'Episode'} 
                className="aspect-square object-cover w-full h-full rounded-xl shadow-lg" 
              />
            </div>
          </div>
          
          {/* Episode Navigation */}
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button onClick={prevEpisode} className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            
            <div className="flex space-x-2">
              {episodes.map((episode, index) => (
                <button 
                  key={episode.id} 
                  onClick={() => setCurrentEpisode(index)} 
                  className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                    index === currentEpisode ? 'border-[#003FA5] scale-105' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img 
                    src={episode.image_url || '/img/wtf-cover.png'} 
                    alt={episode.title} 
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>
            
            <button onClick={nextEpisode} className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <ChevronRight size={24} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </section>;
};

export default FinanceTransformersSection;
