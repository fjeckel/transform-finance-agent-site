import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
const FinanceTransformersSection = () => {
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const episodes = [
    {
      title: "Dr. Veronika von Heise-Rotenburg",
      description:
        "Dr. Veronika von Heise-Rotenburg erläutert, wie zukunftsfähige Finanzorganisationen aufgebaut werden und welche Rolle Technologie dabei spielt.",
      image: "/img/veronika.jpg",
      alt: "Foto von Dr. Veronika von Heise-Rotenburg",
      duration: "",
      date: "",
      comingSoon: false
    },
    {
      title: "Lisa Emme",
      description:
        "Gemeinsam mit Lisa Emme sprechen wir über erfolgreiche Automatisierungsprojekte und die Bedeutung von Change Management im Finance-Bereich.",
      image: "/img/lisa.jpg",
      alt: "Foto von Lisa Emme",
      duration: "",
      date: "",
      comingSoon: true
    },
    {
      title: "Katharina Herzog",
      description:
        "Katharina Herzog teilt Einblicke in die digitale Transformation eines globalen Konzerns und wie Finanzteams dabei neu zusammenarbeiten.",
      image: "/img/katharina.jpg",
      alt: "Foto von Katharina Herzog",
      duration: "",
      date: "",
      comingSoon: true
    }
  ];
  const nextEpisode = () => {
    setCurrentEpisode(prev => (prev + 1) % episodes.length);
  };
  const prevEpisode = () => {
    setCurrentEpisode(prev => (prev - 1 + episodes.length) % episodes.length);
  };

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
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Finance Transformers ist das „halb-seriöse“ Schwester­format von WTF?! – Why Transform Finance. Statt Tim &amp; Fabians lockerem After-Work-Talk rückten hier Tim und Fabian mit wechselnden Gästen ins Studio. Im Fokus stehen echte Praxis­geschichten rund um Finance- &amp; Digital-Transformation – vom globalen Konzern bis zum Scale-up.</p>
        </div>

        <div
          className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="mb-4">
                <span className="inline-block bg-[#003FA5] text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                  Episode {currentEpisode + 1}
                </span>
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {episodes[currentEpisode].title}
              </h3>
              
              <p className="text-lg text-gray-700 mb-6">
                {episodes[currentEpisode].description}
              </p>
              
              <div className="flex items-center space-x-6 mb-8">
                <span className="text-gray-600 font-medium">{episodes[currentEpisode].duration}</span>
                <span className="text-gray-600">{episodes[currentEpisode].date}</span>
              </div>
              
              <div className="flex space-x-4">
                <a href="https://open.spotify.com/show/1gLtus1YpWX23MIWat9IfG" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-[#1DB954] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1AA34A] transition-colors">
                  <span>Spotify</span>
                  <ExternalLink size={16} />
                </a>
                <a href="https://podcasts.apple.com/us/podcast/wtf-why-transform-finance/id1649119685" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 bg-[#A855F7] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#9333EA] transition-colors">
                  <span>Apple</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
            
            <div className="relative">
              <img
                src={episodes[currentEpisode].image}
                alt={episodes[currentEpisode].alt}
                className={`aspect-square object-cover w-full h-full rounded-xl shadow-lg ${episodes[currentEpisode].comingSoon ? 'grayscale' : ''}`}
              />
              {episodes[currentEpisode].comingSoon && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 text-white text-2xl font-bold">
                  Coming Soon!
                </div>
              )}
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
                  key={index}
                  onClick={() => setCurrentEpisode(index)}
                  className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-300 ${index === currentEpisode ? 'border-[#003FA5] scale-105' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img
                    src={episode.image}
                    alt={episode.alt}
                    className={`w-full h-full object-cover ${episode.comingSoon ? 'grayscale' : ''}`}
                  />
                  {episode.comingSoon && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-[10px] font-bold">
                      Coming Soon!
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            <button onClick={nextEpisode} className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <ChevronRight size={24} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </section>
};
export default FinanceTransformersSection;
