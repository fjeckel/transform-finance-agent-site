
import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';


const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'WTF?! WARUM FINANCE TRANSFORMIEREN', href: '#wtf', type: 'section' },
    { label: 'FINANCE TRANSFORMERS', href: '#finance-transformers', type: 'section' },
    { label: 'ALLE INHALTE', href: '/episodes', type: 'route' },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.type === 'route') {
      navigate(item.href);
    } else {
      const element = document.querySelector(item.href);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
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
                <div className="text-xl font-bold text-gray-900 font-cooper">
                  Finance Transformers
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="flex items-center space-x-8">
                <ul className="flex items-center space-x-8">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <button
                        onClick={() => handleNavClick(item)}
                        className="text-xs font-bold text-foreground hover:text-primary transition-colors duration-200 py-2 px-3 rounded hover:bg-muted uppercase tracking-wide whitespace-nowrap font-cooper"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Auth Section */}
                <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
                  {user ? (
                    <>
                      <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                      {isAdmin && (
                        <Link to="/admin">
                          <Button variant="outline" size="sm">
                            <Settings size={16} className="mr-2" />
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Button variant="outline" size="sm" onClick={signOut}>
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth">
                      <Button variant="outline" size="sm">
                        <LogIn size={16} className="mr-2" />
                        Login
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 lg:hidden">
        <div className={`bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center">
              <div className="text-lg font-bold text-gray-900 font-cooper">
                Finance Transformers
              </div>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-800 hover:text-primary transition-colors"
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
                    onClick={() => handleNavClick(item)}
                    className="block w-full text-left text-sm font-bold text-foreground hover:text-primary transition-colors duration-200 py-3 px-6 hover:bg-muted uppercase tracking-wide font-cooper"
                  >
                    {item.label}
                  </button>
                </li>
              ))}

              
              {/* Mobile Auth Section */}
              <li className="border-t border-gray-200 mt-4 pt-4">
                {user ? (
                  <div className="px-6 space-y-3">
                    <p className="text-sm text-gray-600">Welcome, {user.email}</p>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Settings size={16} className="mr-2" />
                          Admin Panel
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { signOut(); setIsOpen(false); }}
                      className="w-full"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="px-6">
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <LogIn size={16} className="mr-2" />
                        Login
                      </Button>
                    </Link>
                  </div>
                )}
              </li>
            </ul>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
