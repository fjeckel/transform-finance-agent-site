
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
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-start">
          <div className="order-2 lg:order-1 max-w-2xl md:max-w-lg lg:max-w-xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 lg:mb-8 uppercase tracking-tight font-cooper">
              WTF?!
            </h2>
            
            <div className="prose prose-lg text-gray-700 mb-6 lg:mb-8">
              <p className="text-lg lg:text-xl leading-relaxed mb-4">
                Das Finanzwesen ist kaputt. Spreadsheets aus den 1980ern. Manuelle Prozesse, die 
                Kreativität töten. Risikoaverse Kulturen, die Innovation ersticken. Es ist Zeit, 
                aufzuhören, das "Nein-Ministerium" zu sein und stattdessen zum Katalysator der 
                Transformation zu werden.
              </p>
              <p className="text-base lg:text-lg">
                Begleite Tim und Fabian dabei, wie sie konventionelle Finanzweisheiten herausfordern, 
                modernste Technologien erkunden und provokante Einsichten teilen, die deine 
                Denkweise über Geld, Betrieb und Führung im digitalen Zeitalter transformieren werden.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 uppercase tracking-wide">Jetzt anhören:</h3>
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
          
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
              <img
                src="/img/wtf-cover.png"
                alt="WTF?! Podcast Cover"
                className="aspect-square w-full object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WTFSection;
