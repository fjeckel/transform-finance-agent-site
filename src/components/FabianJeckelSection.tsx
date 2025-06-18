
import React from 'react';
import { LinkedinIcon } from 'lucide-react';

const FabianJeckelSection = () => {
  return (
    <section id="fabian-jeckel" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="text-center text-gray-600">
                  <div className="w-32 h-32 bg-[#13B87B] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-4xl font-bold">FJ</span>
                  </div>
                  <div className="text-xl font-bold">Fabian Jeckel</div>
                  <div className="text-sm">Digital Finance Strategist</div>
                </div>
              </div>
              
              {/* Decorative rings */}
              <div className="absolute -top-4 -left-4 w-20 h-20 border-4 border-[#D0840E] rounded-full opacity-60"></div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 border-4 border-[#003FA5] rounded-full opacity-60"></div>
              
              {/* Achievement badges */}
              <div className="absolute top-4 right-4 bg-white rounded-lg px-3 py-2 shadow-lg">
                <div className="text-xs font-bold text-gray-800">Tech Pioneer</div>
                <div className="text-xs text-gray-600">AI & Automation</div>
              </div>
              
              <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg">
                <div className="text-xs font-bold text-gray-800">Global Reach</div>
                <div className="text-xs text-gray-600">3 Continents</div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 uppercase tracking-tight">
              More About<br />
              <span className="text-[#13B87B]">Fabian Jeckel</span>
            </h2>
            
            <div className="prose prose-lg text-gray-700 mb-8">
              <p className="text-lg leading-relaxed">
                Fabian brings a unique blend of financial expertise and technology innovation to the 
                Finance Transformers team. With a background in both corporate finance and fintech 
                startups, he understands the challenges and opportunities facing modern finance 
                professionals from multiple perspectives.
              </p>
              <p>
                As a digital finance strategist, Fabian helps organizations navigate the complex 
                landscape of AI, blockchain, and automation in finance. His practical approach 
                combines cutting-edge technology with sound financial principles to drive 
                sustainable transformation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 bg-[#0077B5] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#005885] transition-colors duration-300"
              >
                <LinkedinIcon size={16} />
                <span>Connect on LinkedIn</span>
              </a>
              <a
                href="mailto:fabian@financetransformers.com"
                className="flex items-center justify-center space-x-2 border-2 border-[#13B87B] text-[#13B87B] px-6 py-3 rounded-lg font-bold hover:bg-[#13B87B] hover:text-white transition-all duration-300"
              >
                <span>Get in Touch</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FabianJeckelSection;
