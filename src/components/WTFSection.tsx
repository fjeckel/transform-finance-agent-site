import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OptimizedImage from '@/components/ui/optimized-image';

const WTFSection = () => {
  const podcastLinks = [
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/channel/UC2sXuBElJDyzxKv3J8kmyng',
      color: 'hsl(0 100% 50%)'
    },
    {
      name: 'Spotify',
      url: 'https://open.spotify.com/show/1gLtus1YpWX23MIWat9IfG',
      color: 'hsl(141 76% 48%)'
    },
    {
      name: 'Apple Podcasts',
      url: 'https://podcasts.apple.com/us/podcast/wtf-why-transform-finance/id1649119685',
      color: 'hsl(258 90% 66%)'
    },
    {
      name: 'Amazon Music',
      url: 'https://music.amazon.com/podcasts/37f90f93-ac9e-460f-964a-52fa09ee0dde/wtf---why-transform-finance',
      color: 'hsl(39 100% 50%)'
    }
  ];

  return (
    <section id="wtf" className="py-20 bg-secondary">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-start">
          {/* Content */}
          <div className="order-2 lg:order-1 max-w-2xl md:max-w-lg lg:max-w-xl animate-fade-in-up">
            <h2 className="text-section-title font-bold text-foreground mb-6 lg:mb-8 uppercase tracking-tight font-cooper">
              WTF?!
            </h2>
            
            <div className="prose prose-lg text-muted-foreground mb-6 lg:mb-8 space-y-4">
              <p className="text-lg lg:text-xl leading-relaxed">
                Das Finanzwesen ist kaputt. Spreadsheets aus den 1980ern. Manuelle Prozesse, die Kreativität töten. 
                Risikoaverse Kulturen, die Innovation ersticken. Viele reden über Transformation, wenige verstehen sie. 
                Es ist Zeit, das zu beenden, das "Nein-Ministerium" zu sein und stattdessen zum Katalysator der 
                Transformation zu werden.
              </p>
              <p className="text-base lg:text-lg">
                Begleite Tim und Fabian dabei, wie sie konventionelle Finanzweisheiten auf den Kopf stellen, 
                modernste Technologien erkunden und provokante Einsichten teilen, die dein Weltbild über Geld, 
                Betrieb und Führung im digitalen Zeitalter verändern werden.
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg lg:text-xl font-bold text-foreground uppercase tracking-wide font-cooper">
                Jetzt anhören:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {podcastLinks.map((link) => (
                  <Button
                    key={link.name}
                    variant="outline"
                    asChild
                    className="card-interactive group border-2 hover:border-primary"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 py-3 px-4 transition-all duration-300"
                    >
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">
                        {link.name}
                      </span>
                      <ExternalLink size={16} className="group-hover:text-primary transition-colors" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
              <div className="card-interactive">
                <OptimizedImage 
                  src="/img/wtf-cover.png" 
                  alt="WTF?! Podcast Cover" 
                  className="aspect-square w-full object-cover rounded-2xl shadow-large"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WTFSection;