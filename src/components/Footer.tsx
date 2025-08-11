
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation(['footer', 'navigation']);
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
          <div className="flex items-center mb-4">
            <span className="font-bold text-lg">Finance Transformers</span>
          </div>
            <p className="text-gray-400 leading-relaxed">
              {t('footer:brand.description')}
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wide">{t('footer:quickLinks.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-[#13B87B] transition-colors">
                  {t('navigation:menu.home')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-[#13B87B] transition-colors">
                  {t('navigation:menu.aboutUs')}
                </Link>
              </li>
              <li>
                <Link to="/episodes" className="text-gray-400 hover:text-[#13B87B] transition-colors">
                  {t('navigation:menu.episodes')}
                </Link>
              </li>
              <li>
                <Link to="/insights" className="text-gray-400 hover:text-[#13B87B] transition-colors">
                  Insights
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wide">{t('footer:contact.title')}</h3>
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
              {t('footer:copyright')}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                to="/legal"
                className="text-gray-400 hover:text-[#13B87B] transition-colors text-sm"
              >
                {t('footer:legal.imprintAndLegal')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
