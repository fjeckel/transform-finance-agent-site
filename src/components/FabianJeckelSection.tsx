import React from 'react';
import { LinkedinIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const FabianJeckelSection = () => {
  return (
    <section id="fabian-jeckel" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-1 lg:order-2">
            <div className="flex flex-col items-center text-center space-y-2">
              <Avatar className="w-40 h-40 max-w-lg rounded-none">
                <AvatarImage src="/img/fabian-jeckel.jpg" alt="Fabian Jeckel" />
                <AvatarFallback>FJ</AvatarFallback>
              </Avatar>
              <div className="text-xl font-bold">Fabian Jeckel</div>
              <div className="text-sm">Presales Solution Consultant</div>
            </div>
          </div>

          <div className="order-2 lg:order-1">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 uppercase tracking-tight font-cooper">
              Mehr über<br />
              <span className="text-[#13B87B]">Fabian Jeckel</span>
            </h2>
            
            <div className="prose prose-lg text-gray-700 mb-8">
              <p className="text-lg leading-relaxed">Fabian ist &quot;der Mann zwischen Finance und Tech&quot; – als Presales Solution Consultant bei Workday bringt er komplexe Technologie-Lösungen und Finance-Anforderungen zusammen. 
            </p>
              <p>
                Vom klassischen Controlling entwickelte sich Fabian zum "Digital Finance Craftsman". 
                Seine Expertise liegt darin, internationale Software-Lösungen für Finance-Teams 
                verständlich zu machen und dabei provokante Thesen ("Schlagbohrer ist kein Bohrhammer") 
                mit gesundem Realitätssinn zu verbinden. Sein Faible für KI-Tools bringt er 
                pragmatisch in den Corporate-Alltag ein.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="https://www.linkedin.com/in/fabianjeckel/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 bg-[#0077B5] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#005885] transition-colors duration-300">
                <LinkedinIcon size={16} />
                <span>Auf LinkedIn vernetzen</span>
              </a>
              <a href="mailto:fabian@financetransformers.ai" className="flex items-center justify-center space-x-2 border-2 border-[#13B87B] text-[#13B87B] px-6 py-3 rounded-lg font-bold hover:bg-[#13B87B] hover:text-white transition-all duration-300">
                <span>Kontakt aufnehmen</span>
              </a>
            </div>
          </div>
        </div>
        </div>
      </section>
    );
};
export default FabianJeckelSection;
