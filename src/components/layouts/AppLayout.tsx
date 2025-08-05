import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopHeader } from './TopHeader';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { MobileSearch } from '@/components/ui/mobile-search';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        {showSidebar && <AppSidebar />}
        <SidebarInset className="flex flex-col">
          <TopHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
      {/* Mobile bottom navigation with search trigger */}
      <BottomNavigation onSearchOpen={() => setMobileSearchOpen(true)} />
      {/* Global mobile search modal */}
      <MobileSearch open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />
    </SidebarProvider>
  );
}