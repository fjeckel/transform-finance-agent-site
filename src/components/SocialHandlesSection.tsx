import React from 'react';
import { LinkedinIcon } from 'lucide-react';

const SocialHandlesSection = () => {
  const socialLinks = [
    {
      name: 'LinkedIn',
      icon: <LinkedinIcon className="w-8 h-8" />,
      url: 'https://www.linkedin.com/company/86932507/admin/dashboard/',
      color: 'bg-[#0077B5] hover:bg-[#005885]',
      description: 'Professionelle Einblicke und Branchendiskussionen'
    },
    {
      name: 'YouTube',
      icon: <div className="w-8 h-8 text-white font-bold flex items-center justify-center">YT</div>,
      url: 'https://www.youtube.com/channel/UC2sXuBElJDyzxKv3J8kmyng',
      color: 'bg-[#FF0000] hover:bg-[#CC0000]',
      description: 'Video-Content und Podcast-Episoden'
    },
  ];

  return (
    <section id="social" className="py-20 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 uppercase tracking-tight font-cooper">
            Folgen Sie der <span className="text-[#13B87B]">Transformation</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Werden Sie Teil unserer Community auf verschiedenen Plattformen für tägliche Einblicke, 
            Behind-the-Scenes-Content und Echtzeitdiskussionen über die Zukunft des Finanzwesens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`p-3 rounded-full ${social.color} transition-all duration-300 group-hover:scale-110`}>
                  {social.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{social.name}</h3>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                {social.description}
              </p>
              
              <div className="absolute inset-0 bg-gradient-to-r from-[#13B87B]/20 to-[#D0840E]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </a>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 border border-white/20">
            <span className="text-white font-medium">Verbunden bleiben:</span>
            <div className="flex space-x-3">
              {socialLinks.slice(0, 3).map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-full ${social.color} transition-all duration-300 hover:scale-110`}
                >
                  <div className="w-5 h-5 text-white flex items-center justify-center">
                    {social.name === 'YouTube' ? '📺' : social.name === 'LinkedIn' ? '💼' : '🐦'}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialHandlesSection;
