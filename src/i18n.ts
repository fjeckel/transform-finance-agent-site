import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Translation resources
const resources = {
  de: {
    common: {
      // Navigation
      navigation: {
        overview: "ÜBERBLICK",
        whyFT: "WARUM FT?",
        aboutUs: "ÜBER UNS", 
        content: "INHALTE",
        insights: "INSIGHTS",
      },
      // Common UI elements
      buttons: {
        back: "Zurück",
        save: "Speichern",
        cancel: "Abbrechen",
        edit: "Bearbeiten",
        delete: "Löschen",
        view: "Ansehen",
        create: "Erstellen",
        update: "Aktualisieren",
        publish: "Veröffentlichen",
        loadMore: "Weitere laden",
        readMore: "Weiterlesen",
        showLess: "Weniger anzeigen",
        search: "Suchen",
        filter: "Filter",
        reset: "Zurücksetzen",
      },
      // Status and states
      status: {
        draft: "Entwurf",
        published: "Veröffentlicht",
        archived: "Archiviert",
        scheduled: "Geplant",
        loading: "Wird geladen...",
        error: "Fehler",
        success: "Erfolgreich",
      },
      // Time and dates
      time: {
        minutes: "Min",
        readingTime: "Lesezeit",
        publishedOn: "Veröffentlicht am",
        createdOn: "Erstellt am",
        updatedOn: "Aktualisiert am",
      },
      // General terms
      general: {
        title: "Titel",
        description: "Beschreibung",
        content: "Inhalt",
        summary: "Zusammenfassung",
        author: "Autor",
        category: "Kategorie",
        tags: "Tags",
        views: "Aufrufe",
        episodes: "Episoden",
        insights: "Insights",
        featured: "Empfohlen",
        all: "Alle",
        none: "Keine",
        optional: "Optional",
        required: "Erforderlich",
      },
      // Messages
      messages: {
        noResults: "Keine Ergebnisse gefunden",
        searchPlaceholder: "Suchen...",
        tryDifferentTerms: "Versuchen Sie es mit anderen Suchbegriffen",
        comingSoon: "Bald verfügbar",
        welcome: "Willkommen",
        loginRequired: "Anmeldung erforderlich",
      },
    },
    episodes: {
      title: "Alle Inhalte",
      subtitle: "Entdecke alle Episoden unserer Podcast-Serien und unsere CFO Memos",
      episodeSummary: "Episode Zusammenfassung",
      allEpisodes: "Alle Episoden",
      cfoMemos: "CFO Memos",
      series: {
        wtf: "WTF?!",
        financeTransformers: "Finance Transformers", 
        cfoMemo: "CFO Memo",
      },
      filterBySeries: "Filter nach Serie:",
      sortBy: "Sortierung:",
      sortOptions: {
        episodeDesc: "Neueste Episode zuerst",
        episodeAsc: "Älteste Episode zuerst", 
        dateDesc: "Neueste nach Datum",
        dateAsc: "Älteste nach Datum",
        titleAsc: "Titel A-Z",
        titleDesc: "Titel Z-A",
      },
      searchPlaceholder: "Suche nach Titel, Gast oder Beschreibung...",
      resultsFor: "Ergebnisse für",
      noEpisodes: "Keine Episoden verfügbar",
      noResults: "Keine Ergebnisse gefunden",
      season: "Staffel",
      episode: "Episode",
      duration: "Dauer",
      guests: "Gäste",
      platforms: "Plattformen",
      toEpisode: "Zur Episode",
    },
    insights: {
      title: "Finance Insights",
      subtitle: "Vertiefte Einblicke, Buchzusammenfassungen und praktische Leitfäden für deine Finance Transformation. Wissen, das dich wirklich weiterbringt.",
      recommendedInsights: "Empfohlene Insights",
      similarInsights: "Ähnliche Insights",
      allInsights: "Alle Insights ansehen",
      insightNotFound: "Insight nicht gefunden",
      backToInsights: "Zurück zu den Insights",
      expandKnowledge: "Mehr Finance Insights entdecken",
      expandDescription: "Erweitere dein Wissen mit weiteren Buchzusammenfassungen, Artikeln und Leitfäden.",
      types: {
        bookSummary: "Buchzusammenfassung",
        blogArticle: "Artikel", 
        guide: "Leitfaden",
        caseStudy: "Fallstudie",
      },
      difficulty: {
        beginner: "Einsteiger",
        intermediate: "Fortgeschritten",
        advanced: "Experte",
        allLevels: "Alle Level",
      },
      aboutBook: "Über das Buch",
      bookTitle: "Titel",
      bookAuthor: "Autor",
      bookYear: "Jahr",
      bookIsbn: "ISBN",
      searchPlaceholder: "Insights durchsuchen...",
      filterBy: "Filter:",
      contentType: "Inhaltstyp",
      allTypes: "Alle Typen",
      allCategories: "Alle Kategorien",
      allLevels: "Alle Level",
      insightsFound: "Insights gefunden",
      resetFilters: "Filter zurücksetzen",
      noInsights: "Keine Insights gefunden",
      tryOtherTerms: "Versuche andere Suchbegriffe oder ändere deine Filter.",
    },
    overview: {
      title: "Finance Transformers Überblick",
      subtitle: "Ihr umfassender Leitfaden zur digitalen Transformation im Finanzwesen",
      sections: {
        wtf: {
          title: "Was ist WTF?!",
          description: "Unser Flagship-Podcast, der komplexe Finanzthemen in verständliche Gespräche verwandelt.",
        },
        cfoMemo: {
          title: "Was ist CFO Memo",
          description: "Strategische Einblicke und Expertenwissen für Finanzführungskräfte.",
        },
        toolTime: {
          title: "Was ist Tool Time by WTF?!",
          description: "Praktische Tool-Reviews und Implementierungsstrategien für Finance-Teams.",
        },
      },
    },
  },
  en: {
    common: {
      // Navigation
      navigation: {
        overview: "OVERVIEW",
        whyFT: "WHY FT?",
        aboutUs: "ABOUT US",
        content: "CONTENT", 
        insights: "INSIGHTS",
      },
      // Common UI elements
      buttons: {
        back: "Back",
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        view: "View",
        create: "Create",
        update: "Update", 
        publish: "Publish",
        loadMore: "Load More",
        readMore: "Read More",
        showLess: "Show Less",
        search: "Search",
        filter: "Filter",
        reset: "Reset",
      },
      // Status and states
      status: {
        draft: "Draft",
        published: "Published",
        archived: "Archived",
        scheduled: "Scheduled",
        loading: "Loading...",
        error: "Error",
        success: "Success",
      },
      // Time and dates
      time: {
        minutes: "min",
        readingTime: "Reading Time",
        publishedOn: "Published on",
        createdOn: "Created on",
        updatedOn: "Updated on",
      },
      // General terms
      general: {
        title: "Title",
        description: "Description",
        content: "Content",
        summary: "Summary",
        author: "Author",
        category: "Category",
        tags: "Tags",
        views: "Views",
        episodes: "Episodes",
        insights: "Insights",
        featured: "Featured",
        all: "All",
        none: "None",
        optional: "Optional",
        required: "Required",
      },
      // Messages
      messages: {
        noResults: "No results found",
        searchPlaceholder: "Search...",
        tryDifferentTerms: "Try different search terms",
        comingSoon: "Coming Soon",
        welcome: "Welcome",
        loginRequired: "Login Required",
      },
    },
    episodes: {
      title: "All Content",
      subtitle: "Discover all episodes of our podcast series and our CFO Memos",
      episodeSummary: "Episode Summary",
      allEpisodes: "All Episodes",
      cfoMemos: "CFO Memos",
      series: {
        wtf: "WTF?!",
        financeTransformers: "Finance Transformers",
        cfoMemo: "CFO Memo",
      },
      filterBySeries: "Filter by Series:",
      sortBy: "Sort By:",
      sortOptions: {
        episodeDesc: "Newest Episode First",
        episodeAsc: "Oldest Episode First",
        dateDesc: "Newest by Date",
        dateAsc: "Oldest by Date", 
        titleAsc: "Title A-Z",
        titleDesc: "Title Z-A",
      },
      searchPlaceholder: "Search by title, guest, or description...",
      resultsFor: "results for",
      noEpisodes: "No episodes available",
      noResults: "No results found",
      season: "Season",
      episode: "Episode",
      duration: "Duration",
      guests: "Guests",
      platforms: "Platforms",
      toEpisode: "To Episode",
    },
    insights: {
      title: "Finance Insights",
      subtitle: "In-depth insights, book summaries, and practical guides for your finance transformation. Knowledge that truly moves you forward.",
      recommendedInsights: "Recommended Insights",
      similarInsights: "Similar Insights",
      allInsights: "View All Insights",
      insightNotFound: "Insight not found",
      backToInsights: "Back to Insights",
      expandKnowledge: "Discover More Finance Insights",
      expandDescription: "Expand your knowledge with additional book summaries, articles, and guides.",
      types: {
        bookSummary: "Book Summary",
        blogArticle: "Article",
        guide: "Guide",
        caseStudy: "Case Study",
      },
      difficulty: {
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
        allLevels: "All Levels",
      },
      aboutBook: "About the Book",
      bookTitle: "Title",
      bookAuthor: "Author",
      bookYear: "Year",
      bookIsbn: "ISBN",
      searchPlaceholder: "Search insights...",
      filterBy: "Filter by:",
      contentType: "Content Type",
      allTypes: "All Types",
      allCategories: "All Categories",
      allLevels: "All Levels",
      insightsFound: "insights found",
      resetFilters: "Reset Filters",
      noInsights: "No insights found",
      tryOtherTerms: "Try other search terms or change your filters.",
    },
    overview: {
      title: "Finance Transformers Overview",
      subtitle: "Your comprehensive guide to digital transformation in finance",
      sections: {
        wtf: {
          title: "What is WTF?!",
          description: "Our flagship podcast that transforms complex finance topics into understandable conversations.",
        },
        cfoMemo: {
          title: "What is CFO Memo",
          description: "Strategic insights and expert knowledge for finance leadership.",
        },
        toolTime: {
          title: "What is Tool Time by WTF?!",
          description: "Practical tool reviews and implementation strategies for finance teams.",
        },
      },
    },
  },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'de',
    debug: process.env.NODE_ENV === 'development',

    // Language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Namespace configuration
    defaultNS: 'common',
    ns: ['common', 'episodes', 'insights', 'overview'],

    // React specific options
    react: {
      useSuspense: false,
    },
  });

export default i18n;