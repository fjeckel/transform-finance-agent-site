import React from 'react';
import { Home, Headphones, FileText, User, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label, isActive, onClick }) => {
  const content = (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 touch-target",
        isActive 
          ? "text-[#13B87B] bg-[#13B87B]/10" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
      onClick={onClick}
    >
      <Icon size={20} className="mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );

  if (onClick) {
    return (
      <button 
        className="flex-1 flex justify-center" 
        aria-label={label}
        role="button"
        tabIndex={0}
      >
        {content}
      </button>
    );
  }

  return (
    <Link 
      to={href} 
      className="flex-1 flex justify-center" 
      aria-label={`Navigiere zu ${label}`}
      role="link"
    >
      {content}
    </Link>
  );
};

export const BottomNavigation: React.FC<{ onSearchOpen?: () => void }> = ({ onSearchOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      isActive: location.pathname === '/',
    },
    {
      href: '/episodes',
      icon: Headphones,
      label: 'Episoden',
      isActive: location.pathname.startsWith('/episodes') || location.pathname.startsWith('/episode'),
    },
    {
      href: '/episodes?tab=memos',
      icon: FileText,
      label: 'Memos',
      isActive: false, // Will be handled by Episodes tab logic
    },
    {
      icon: Search,
      label: 'Suchen',
      onClick: onSearchOpen,
    },
    {
      href: user ? '/dashboard' : '/auth',
      icon: User,
      label: user ? 'Profil' : 'Login',
      isActive: location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin'),
    },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 lg:hidden" />
      
      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" 
        role="navigation" 
        aria-label="Mobile Navigation"
      >
        <div className="bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
          <div className="flex items-center justify-around px-2 py-1 safe-area-inset-bottom" role="tablist">
            {navItems.map((item, index) => (
              <NavItem
                key={item.href || index}
                href={item.href || ''}
                icon={item.icon}
                label={item.label}
                isActive={item.isActive}
                onClick={item.onClick}
              />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNavigation;