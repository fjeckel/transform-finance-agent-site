
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const FinanceTransformersSection = () => {
  const [currentEpisode, setCurrentEpisode] = useState(0);
  
  const episodes = [
    {
      title: "The Future of Financial Planning",
      description: "How AI and automation are revolutionizing FP&A processes",
      duration: "28 min",
      date: "Dec 2024"
    },
    {
      title: "Digital Transformation in Finance",
      description: "Breaking down silos and building integrated financial ecosystems",
      duration: "35 min",
      date: "Nov 2024"
    },
    {
      title: "The CFO as Chief Transformation Officer",
      description: "Evolving the finance leader's role in the digital age",
      duration: "42 min",
      date: "Nov 2024"
    }
  ];

  const nextEpisode = () => {
    setCurrentEpisode((prev) => (prev + 1) % episodes.length);
  };

  const prevEpisode = () => {
    setCurrentEpisode((prev) => (prev - 1 + episodes.length) % episodes.length);
  };

  return (
    <section id="finance-transformers" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 uppercase tracking-tight">
            Finance <span className="text-[#003FA5]">Transformers</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Deep-dive conversations with industry leaders, innovators, and disruptors 
            who are reshaping the finance function for the digital age.
          </p>
        </div>

        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-xl">
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
                <a
                  href="https://open.spotify.com/show/1gLtus1YpWX23MIWat9IfG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-[#1DB954] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1AA34A] transition-colors"
                >
                  <span>Spotify</span>
                  <ExternalLink size={16} />
                </a>
                <a
                  href="https://podcasts.apple.com/us/podcast/wtf-why-transform-finance/id1649119685"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-[#A855F7] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#9333EA] transition-colors"
                >
                  <span>Apple</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#003FA5] to-[#002080] rounded-xl flex items-center justify-center text-white shadow-lg">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">🎙️</div>
                  <div className="text-lg font-bold">Finance Transformers</div>
                  <div className="text-sm opacity-80">Podcast Series</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Episode Navigation */}
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={prevEpisode}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            
            <div className="flex space-x-2">
              {episodes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentEpisode(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentEpisode ? 'bg-[#003FA5] scale-125' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextEpisode}
              className="p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            >
              <ChevronRight size={24} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinanceTransformersSection;
