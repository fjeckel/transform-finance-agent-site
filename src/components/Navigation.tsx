
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'WTF?! WARUM FINANCE TRANSFORMIEREN', href: '#wtf' },
    { label: 'FINANCE TRANSFORMERS', href: '#finance-transformers' },
    { label: 'DAS CFO MEMO', href: '#cfo-memo' },
    { label: 'MEHR ÜBER TIM TEUSCHER', href: '#tim-teuscher' },
    { label: 'MEHR ÜBER FABIAN JECKEL', href: '#fabian-jeckel' },
    { label: 'SOCIAL MEDIA', href: '#social' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation - Horizontal at top */}
      <nav className={`fixed top-0 left-0 right-0 z-50 hidden lg:block transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
        <div className={`bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300 ${isScrolled ? 'scale-98' : 'scale-100'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">
              {/* Logo/Brand */}
              <div className="flex items-center">
                <span className="font-bold text-xl text-gray-800">Finance Transformers</span>
              </div>
              
              {/* Menu Items */}
              <ul className="flex items-center space-x-8">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <button
                      onClick={() => scrollToSection(item.href)}
                      className="text-xs font-bold text-gray-800 hover:text-[#13B87B] transition-colors duration-200 py-2 px-3 rounded hover:bg-gray-50 uppercase tracking-wide whitespace-nowrap"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 lg:hidden">
        <div className={`bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center">
              <span className="font-bold text-gray-800">Finance Transformers</span>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-800 hover:text-[#13B87B] transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {isOpen && (
          <div className="bg-white/95 backdrop-blur-sm shadow-lg">
            <ul className="py-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => scrollToSection(item.href)}
                    className="block w-full text-left text-sm font-bold text-gray-800 hover:text-[#13B87B] transition-colors duration-200 py-3 px-6 hover:bg-gray-50 uppercase tracking-wide"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
