
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
          <div className="flex items-center mb-4">
            <span className="font-bold text-lg">Finance Transformers</span>
          </div>
            <p className="text-gray-400 leading-relaxed">
              Transformation des Finanzwesens durch provokante Thought Leadership, 
              praktische Einblicke und mutige Gespräche.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wide">Schnellzugriff</h3>
            <ul className="space-y-2">
              <li><a href="#wtf" className="text-gray-400 hover:text-[#13B87B] transition-colors">WTF Podcast</a></li>
              <li><a href="#finance-transformers" className="text-gray-400 hover:text-[#13B87B] transition-colors">Finance Transformers</a></li>
              <li><a href="#cfo-memo" className="text-gray-400 hover:text-[#13B87B] transition-colors">Das CFO Memo</a></li>
              <li><a href="#social" className="text-gray-400 hover:text-[#13B87B] transition-colors">Social Media</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wide">Kontakt</h3>
            <ul className="space-y-2 text-gray-400">
              <li>contact@financetransformers.ai</li>
              <li>
                <a 
                  href="https://teuscherconsulting.de" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#13B87B] transition-colors"
                >
                  teuscherconsulting.de
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Finance Transformers. Alle Rechte vorbehalten.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-[#13B87B] transition-colors text-sm">Datenschutzerklärung</a>
              <a href="#" className="text-gray-400 hover:text-[#13B87B] transition-colors text-sm">Nutzungsbedingungen</a>
              <a href="#" className="text-gray-400 hover:text-[#13B87B] transition-colors text-sm">Cookie-Richtlinie</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
