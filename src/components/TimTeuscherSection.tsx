
import React from 'react';
import { ExternalLink, LinkedinIcon } from 'lucide-react';

const TimTeuscherSection = () => {
  return (
    <section id="tim-teuscher" className="py-20 bg-[#FBF4EB]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 uppercase tracking-tight">
              Mehr über<br />
              <span className="text-[#D0840E]">Tim Teuscher</span>
            </h2>
            
            <div className="prose prose-lg text-gray-700 mb-8">
              <p className="text-lg leading-relaxed">
                Tim ist ein erfahrener Finance-Transformationsberater mit über 15 Jahren Erfahrung 
                dabei, Fortune-500-Unternehmen bei der Modernisierung ihrer Finanzoperationen zu helfen. 
                Als Gründer von Teuscher Consulting spezialisiert er sich auf digitale Finanzstrategie, 
                Prozessautomatisierung und organisatorisches Change Management.
              </p>
              <p>
                Sein provokanter Ansatz stellt traditionelles Finanzdenken in Frage und liefert 
                gleichzeitig messbare Ergebnisse. Tim hat Transformationen in Unternehmen in ganz 
                Europa und Nordamerika geleitet und sich als Thought Leader an der Schnittstelle 
                von Finanzen und Technologie einen Namen gemacht.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://teuscherconsulting.de"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-[#003FA5] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#002080] transition-colors duration-300"
              >
                <span>Website besuchen</span>
                <ExternalLink size={16} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 border-2 border-[#0077B5] text-[#0077B5] px-6 py-3 rounded-lg font-bold hover:bg-[#0077B5] hover:text-white transition-all duration-300"
              >
                <LinkedinIcon size={16} />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="text-center text-gray-600">
                  <div className="w-32 h-32 bg-[#D0840E] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-4xl font-bold">TT</span>
                  </div>
                  <div className="text-xl font-bold">Tim Teuscher</div>
                  <div className="text-sm">Finance-Transformations-Experte</div>
                </div>
              </div>
              
              {/* Decorative rings */}
              <div className="absolute -top-4 -right-4 w-20 h-20 border-4 border-[#003FA5] rounded-full opacity-60"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 border-4 border-[#13B87B] rounded-full opacity-60"></div>
              
              {/* Achievement badges */}
              <div className="absolute top-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg">
                <div className="text-xs font-bold text-gray-800">15+ Jahre</div>
                <div className="text-xs text-gray-600">Erfahrung</div>
              </div>
              
              <div className="absolute bottom-4 right-4 bg-white rounded-lg px-3 py-2 shadow-lg">
                <div className="text-xs font-bold text-gray-800">50+ Projekte</div>
                <div className="text-xs text-gray-600">Abgeschlossen</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimTeuscherSection;
