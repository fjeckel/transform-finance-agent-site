import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { EnhancedSearch } from '@/components/ui/enhanced-search';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function TopHeader() {
  const location = useLocation();
  const { t } = useTranslation('common');

  // Generate breadcrumb based on current path
  const generateBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) return null;
    
    const breadcrumbMap: Record<string, string> = {
      'overview': t('navigation.overview'),
      'episodes': t('navigation.content'),
      'insights': t('navigation.insights'),
      'admin': 'Admin Panel',
      'dashboard': 'Dashboard',
      'auth': 'Authentication',
    };

    const firstSegment = pathSegments[0];
    const breadcrumbTitle = breadcrumbMap[firstSegment] || firstSegment;

    return breadcrumbTitle;
  };

  const breadcrumbTitle = generateBreadcrumb();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {breadcrumbTitle && (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{breadcrumbTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      
      {/* Right side controls */}
      <div className="ml-auto flex items-center gap-2 px-4">
        <div className="hidden md:block min-w-[300px]">
          <EnhancedSearch placeholder="Episoden, Insights durchsuchen..." />
        </div>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}