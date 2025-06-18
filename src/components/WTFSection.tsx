
import React from 'react';
import { ExternalLink } from 'lucide-react';

const WTFSection = () => {
  const podcastLinks = [
    { name: 'YouTube', url: 'https://www.youtube.com/channel/UC2sXuBElJDyzxKv3J8kmyng', color: '#FF0000' },
    { name: 'Spotify', url: 'https://open.spotify.com/show/1gLtus1YpWX23MIWat9IfG', color: '#1DB954' },
    { name: 'Apple Podcasts', url: 'https://podcasts.apple.com/us/podcast/wtf-why-transform-finance/id1649119685', color: '#A855F7' },
    { name: 'Amazon Music', url: 'https://music.amazon.com/podcasts/37f90f93-ac9e-460f-964a-52fa09ee0dde/wtf---why-transform-finance', color: '#FF9900' },
  ];

  return (
    <section id="wtf" className="py-20 bg-[#FBF4EB]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 uppercase tracking-tight">
              WTF?!<br />
              <span className="text-[#D0840E]">Why Transform Finance</span>
            </h2>
            
            <div className="prose prose-lg text-gray-700 mb-8">
              <p className="text-xl leading-relaxed">
                Finance is broken. Spreadsheets from the 1980s. Manual processes that kill creativity. 
                Risk-averse cultures that stifle innovation. It's time to stop being the "Department of No" 
                and start being the catalyst for transformation.
              </p>
              <p className="text-lg">
                Join Tim and Fabian as they challenge conventional finance wisdom, explore cutting-edge 
                technology, and share provocative insights that will transform how you think about money, 
                operations, and leadership in the digital age.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Listen Now:</h3>
              <div className="grid grid-cols-2 gap-3">
                {podcastLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 border-gray-300 hover:border-[#13B87B] transition-all duration-300 hover:scale-105 group"
                    style={{ '--hover-color': link.color } as React.CSSProperties}
                  >
                    <span className="font-bold text-sm text-gray-800 group-hover:text-[#13B87B]">{link.name}</span>
                    <ExternalLink size={16} className="text-gray-600 group-hover:text-[#13B87B]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#13B87B] to-[#0FA66A] rounded-2xl flex items-center justify-center shadow-2xl">
                <div className="text-center text-white p-8">
                  <div className="text-6xl font-bold mb-4">WTF?!</div>
                  <div className="text-xl font-medium">Why Transform Finance</div>
                  <div className="mt-6 w-16 h-1 bg-white mx-auto rounded"></div>
                </div>
              </div>
              
              {/* Decorative rings */}
              <div className="absolute -top-4 -right-4 w-20 h-20 border-4 border-[#D0840E] rounded-full opacity-60"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 border-4 border-[#003FA5] rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WTFSection;
