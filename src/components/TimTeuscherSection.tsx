
import React from 'react';
import { ExternalLink, LinkedinIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
            <div className="flex flex-col items-center text-center space-y-2">

              <Avatar className="w-40 h-40 max-w-lg rounded-none">

                <AvatarImage src="/img/tim-teuscher.jpg" alt="Tim Teuscher" />
                <AvatarFallback>TT</AvatarFallback>
              </Avatar>
              <div className="text-xl font-bold">Tim Teuscher</div>
              <div className="text-sm">Finance-Transformations-Experte</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimTeuscherSection;
