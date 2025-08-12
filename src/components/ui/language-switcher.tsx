import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTranslationStats } from '@/hooks/useTranslationStats';
import { useQueryClient } from '@tanstack/react-query';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isDefault?: boolean;
}

const languages: Language[] = [
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isDefault: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

interface LanguageSwitcherProps {
  showCompleteness?: boolean;
  variant?: 'default' | 'compact';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  showCompleteness = false,
  variant = 'default'
}) => {
  const { i18n } = useTranslation();
  const { data: translationStats, isLoading } = useTranslationStats();
  const queryClient = useQueryClient();

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    
    // Store language preference in localStorage
    localStorage.setItem('preferred-language', languageCode);
    
    // Update URL path for SEO with expanded language support
    const currentPath = window.location.pathname;
    let newPath = currentPath;
    
    // Remove existing language prefix
    const pathWithoutLang = currentPath.replace(/^\/(en|de|fr|es)/, '');
    
    // Add new language prefix (except for German which is default)
    if (languageCode !== 'de') {
      newPath = `/${languageCode}${pathWithoutLang}`;
    } else {
      newPath = pathWithoutLang || '/';
    }
    
    // Update URL without page reload
    window.history.pushState({}, '', newPath);
    
    // Invalidate all localized content queries to refresh data in new language
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        return query.queryKey.includes('localized-episodes') || 
               query.queryKey.includes('localized-episode') ||
               query.queryKey.includes('localized-insights') ||
               query.queryKey.includes('localized-content');
      }
    });
    
    // Dispatch custom event for other components to react to language changes
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: languageCode } 
    }));
  };

  const getCompleteness = (languageCode: string): number => {
    if (!translationStats || isLoading) return 0;
    
    const stats = translationStats.find(stat => stat.language_code === languageCode);
    if (!stats) return languageCode === 'de' ? 100 : 0; // German is default, so 100%
    
    // Calculate average completeness between insights and episodes
    const avgCompleteness = (stats.insights_completion_pct + stats.episodes_completion_pct) / 2;
    return Math.round(avgCompleteness);
  };

  const getCompletenessColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-500';
    if (percentage >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getCompletenessIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle size={12} className="text-green-500" />;
    if (percentage >= 30) return <AlertCircle size={12} className="text-yellow-500" />;
    return <AlertCircle size={12} className="text-red-500" />;
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
            <span className="text-lg">{currentLanguage.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {languages.map((language) => {
            const completeness = getCompleteness(language.code);
            return (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`flex items-center gap-2 cursor-pointer ${
                  i18n.language === language.code ? 'bg-accent' : ''
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{language.nativeName}</div>
                  {showCompleteness && (
                    <div className="text-xs text-muted-foreground">
                      {completeness}% translated
                    </div>
                  )}
                </div>
                {i18n.language === language.code && (
                  <CheckCircle size={14} className="text-green-500" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe size={16} />
          <span className="hidden sm:inline">
            {currentLanguage.flag} {currentLanguage.nativeName}
          </span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
          {showCompleteness && !isLoading && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {getCompleteness(currentLanguage.code)}%
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {languages.map((language) => {
          const completeness = getCompleteness(language.code);
          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`flex items-center gap-3 cursor-pointer p-3 ${
                i18n.language === language.code ? 'bg-accent' : ''
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{language.nativeName}</span>
                  {i18n.language === language.code && (
                    <CheckCircle size={14} className="text-green-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{language.name}</div>
                {showCompleteness && (
                  <div className="flex items-center gap-1 mt-1">
                    {getCompletenessIcon(completeness)}
                    <span className={`text-xs ${getCompletenessColor(completeness)}`}>
                      {completeness}% content available
                    </span>
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        {showCompleteness && (
          <>
            <div className="border-t my-1" />
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Translation completeness is updated in real-time
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};