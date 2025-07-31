
import React, { useState, useEffect } from 'react';
import { Menu, X, LogIn, Settings, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SearchBox } from '@/components/ui/search-box';

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
    { label: 'WARUM FT?', href: '#wtf', type: 'section' },
    { label: 'ÜBER UNS', href: '#finance-transformers', type: 'section' },
    { label: 'INHALTE', href: '/episodes', type: 'route' },
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
        <div className={`bg-background/95 backdrop-blur-sm shadow-lg transition-all duration-300 border-b border-border/50 ${isScrolled ? 'scale-98' : 'scale-100'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between">
              {/* Logo/Brand */}
              <div className="flex items-center">
                <div className="text-xl font-bold text-foreground font-cooper">
                  Finance Transformers
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="flex items-center space-x-8">
                {/* Search */}
                <div className="hidden md:block">
                  <SearchBox />
                </div>
                
                <ul className="flex items-center space-x-6">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <button
                        onClick={() => handleNavClick(item)}
                        className="text-sm font-bold text-foreground hover:text-[#13B87B] transition-colors duration-200 py-2 px-3 rounded hover:bg-accent tracking-wide whitespace-nowrap font-cooper"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
                
                {/* Auth Section */}
                <div className="flex items-center space-x-3 border-l border-border pl-6">
                  <ThemeToggle />
                  {user ? (
                    <>
                      <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
                      <Link to="/dashboard">
                        <Button variant="outline" size="sm">
                          <User size={16} className="mr-2" />
                          Dashboard
                        </Button>
                      </Link>
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
        <div className={`bg-background/95 backdrop-blur-sm shadow-lg border-b border-border/50 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center">
              <div className="text-lg font-bold text-foreground font-cooper">
                Finance Transformers
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-foreground hover:text-[#13B87B] transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {isOpen && (
          <div className="bg-background/95 backdrop-blur-sm shadow-lg border-b border-border/50">
            <ul className="py-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => handleNavClick(item)}
                    className="block w-full text-left text-sm font-bold text-foreground hover:text-[#13B87B] transition-colors duration-200 py-3 px-6 hover:bg-accent uppercase tracking-wide font-cooper"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              
              {/* Mobile Auth Section */}
              <li className="border-t border-border mt-4 pt-4">
                {user ? (
                  <div className="px-6 space-y-3">
                    <p className="text-sm text-muted-foreground">Welcome, {user.email}</p>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <User size={16} className="mr-2" />
                        Dashboard
                      </Button>
                    </Link>
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
