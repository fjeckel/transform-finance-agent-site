import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopHeader } from './TopHeader';
import { BottomNavigation } from '@/components/ui/bottom-navigation';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
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
      {/* Keep the existing mobile bottom navigation */}
      <BottomNavigation />
    </SidebarProvider>
  );
}