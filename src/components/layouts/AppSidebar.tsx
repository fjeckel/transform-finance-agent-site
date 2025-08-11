import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  FileText, 
  Lightbulb, 
  User, 
  Settings, 
  LogIn,
  ChevronRight,
  MoreHorizontal,
  Search,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useTranslation('common');

  const mainNavItems = [
    {
      title: 'Home',
      icon: Home,
      url: '/',
      isActive: location.pathname === '/',
    },
    {
      title: 'Über Uns',
      icon: Info,
      url: '/about',
      isActive: location.pathname === '/about',
    },
    {
      title: t('navigation.content'),
      icon: FileText,
      url: '/episodes',
      isActive: location.pathname.startsWith('/episodes') || 
                location.pathname.startsWith('/episode') || 
                location.pathname.startsWith('/report') ||
                location.pathname.startsWith('/insights'),
      items: [
        {
          title: 'Alle Episoden',
          url: '/episodes',
          isActive: location.pathname.startsWith('/episodes') || location.pathname.startsWith('/episode'),
        },
        {
          title: 'CFO Memos',
          url: '/episodes?filter=cfo_memo',
          isActive: location.pathname === '/episodes' && new URLSearchParams(window.location.search).get('filter') === 'cfo_memo',
        },
        {
          title: 'Insights',
          url: '/insights',
          isActive: location.pathname.startsWith('/insights'),
        },
      ],
    },
  ];

  const adminNavItems = isAdmin ? [
    {
      title: 'Admin Panel',
      icon: Settings,
      url: '/admin',
      isActive: location.pathname.startsWith('/admin'),
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
          isActive: location.pathname === '/admin',
        },
        {
          title: 'Analytics',
          url: '/admin/analytics',
          isActive: location.pathname === '/admin/analytics',
        },
        {
          title: 'Episodes',
          url: '/admin/episodes/new',
          isActive: location.pathname.startsWith('/admin/episodes'),
        },
        {
          title: 'Insights',
          url: '/admin/insights',
          isActive: location.pathname.startsWith('/admin/insights'),
        },
        {
          title: 'PDFs',
          url: '/admin/pdfs',
          isActive: location.pathname === '/admin/pdfs',
        },
        {
          title: 'RSS Feeds',
          url: '/admin/rss-feeds',
          isActive: location.pathname === '/admin/rss-feeds',
        },
      ],
    },
  ] : [];

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  return (
    <Sidebar variant="inset" className="hidden md:flex">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Link to="/" className="font-semibold text-lg hover:text-[#13B87B] transition-colors">
            Finance Transformers
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                      {item.items && <ChevronRight className="ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                  {item.items && (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                          >
                            <Link to={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        {adminNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.isActive}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.items && <ChevronRight className="ml-auto" />}
                      </Link>
                    </SidebarMenuButton>
                    {item.items && (
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subItem.isActive}
                            >
                              <Link to={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="" alt={user.email || ''} />
                      <AvatarFallback className="rounded-lg">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                    <MoreHorizontal className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton asChild size="lg">
                <Link to="/auth">
                  <LogIn className="h-4 w-4" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Sign In</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Access your account
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}