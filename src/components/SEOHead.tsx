import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  episode?: {
    series: string;
    season: number;
    episode: number;
    duration?: string;
    publishDate?: string;
    transcript?: string;
    guests?: Array<{ name: string; bio?: string }>;
  };
  insight?: {
    type: 'book_summary' | 'blog_article' | 'guide' | 'case_study';
    readingTime?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    category?: string;
    tags?: string[];
    bookTitle?: string;
    bookAuthor?: string;
    bookPublicationYear?: number;
  };
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  alternateLanguages?: Array<{ lang: string; url: string }>;
}

const SEOHead = ({ 
  title = "Finance Transformers - Podcasts, die Finance auf links drehen",
  description = "Wir sprechen über Transformation, wie sie wirklich passiert – ehrlich, unterhaltsam und relevant.",
  keywords = ["Finance Transformation", "CFO", "Digital Finance", "Podcast", "Finanzwesen"],
  image = "/img/wtf-cover.png",
  url = window.location.href,
  type = "website",
  episode,
  insight,
  author = "Finance Transformers Team",
  publishedTime,
  modifiedTime,
  alternateLanguages
}: SEOHeadProps) => {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Helper function to update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('author', author);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // Add language meta tag
    updateMetaTag('language', i18n.language);
    
    // Add article-specific meta tags if applicable
    if (publishedTime) {
      updateMetaTag('article:published_time', publishedTime, true);
    }
    if (modifiedTime) {
      updateMetaTag('article:modified_time', modifiedTime, true);
    }
    if (insight?.tags) {
      insight.tags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.content = tag;
        document.head.appendChild(meta);
      });
    }
    
    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image.startsWith('http') ? image : `${window.location.origin}${image}`, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Finance Transformers', true);
    
    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image.startsWith('http') ? image : `${window.location.origin}${image}`);
    
    // Add hreflang tags for multilingual content
    if (alternateLanguages) {
      // Remove existing hreflang tags
      document.querySelectorAll('link[hreflang]').forEach(link => link.remove());
      
      alternateLanguages.forEach(({ lang, url: langUrl }) => {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        link.href = langUrl;
        document.head.appendChild(link);
      });
      
      // Add x-default for fallback
      const defaultLink = document.createElement('link');
      defaultLink.rel = 'alternate';
      defaultLink.hreflang = 'x-default';
      defaultLink.href = url;
      document.head.appendChild(defaultLink);
    }

    // Remove existing structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add structured data for podcast episodes
    if (episode) {
      const episodeData = {
        "@context": "https://schema.org",
        "@type": "PodcastEpisode",
        "name": title,
        "description": description,
        "partOfSeries": {
          "@type": "PodcastSeries",
          "name": `Finance Transformers - ${episode.series.toUpperCase()}`,
          "url": window.location.origin,
          "genre": ["Finance", "Business", "Technology", "Education"],
          "inLanguage": i18n.language
        },
        "episodeNumber": episode.episode,
        "seasonNumber": episode.season,
        "datePublished": episode.publishDate,
        "duration": episode.duration,
        "image": image.startsWith('http') ? image : `${window.location.origin}${image}`,
        "url": url,
        "author": {
          "@type": "Organization",
          "name": "Finance Transformers",
          "url": window.location.origin
        },
        "publisher": {
          "@type": "Organization", 
          "name": "Finance Transformers",
          "url": window.location.origin
        },
        "inLanguage": i18n.language,
        "keywords": keywords.join(', ')
      };

      if (episode.transcript) {
        episodeData["transcript"] = episode.transcript;
      }

      if (episode.guests && episode.guests.length > 0) {
        episodeData["actor"] = episode.guests.map(guest => ({
          "@type": "Person",
          "name": guest.name,
          "description": guest.bio
        }));
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(episodeData);
      document.head.appendChild(script);
    }

    // Add structured data for insights/articles
    if (insight) {
      let structuredData: any = {
        "@context": "https://schema.org",
        "@type": insight.type === 'book_summary' ? 'Review' : 'Article',
        "headline": title,
        "description": description,
        "image": image.startsWith('http') ? image : `${window.location.origin}${image}`,
        "url": url,
        "datePublished": publishedTime,
        "dateModified": modifiedTime || publishedTime,
        "author": {
          "@type": "Organization",
          "name": author,
          "url": window.location.origin
        },
        "publisher": {
          "@type": "Organization",
          "name": "Finance Transformers",
          "url": window.location.origin,
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/img/wtf-cover.png`
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url
        },
        "inLanguage": i18n.language,
        "keywords": [...keywords, ...(insight.tags || [])].join(', ')
      };

      if (insight.readingTime) {
        structuredData["timeRequired"] = `PT${insight.readingTime}M`;
      }

      if (insight.category) {
        structuredData["about"] = {
          "@type": "Thing",
          "name": insight.category
        };
      }

      if (insight.difficulty) {
        structuredData["educationalLevel"] = insight.difficulty;
      }

      // Special handling for book summaries
      if (insight.type === 'book_summary' && insight.bookTitle) {
        structuredData["itemReviewed"] = {
          "@type": "Book",
          "name": insight.bookTitle,
          "author": {
            "@type": "Person",
            "name": insight.bookAuthor
          },
          "datePublished": insight.bookPublicationYear
        };
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // Add general website structured data if no specific content type
    if (!episode && !insight) {
      const websiteData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Finance Transformers",
        "url": window.location.origin,
        "description": "Platform for finance transformation insights, podcasts, and educational content",
        "inLanguage": [i18n.language],
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${window.location.origin}/episodes?search={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Finance Transformers",
          "url": window.location.origin
        }
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(websiteData);
      document.head.appendChild(script);
    }
    
  }, [title, description, keywords, image, url, type, episode, insight, author, publishedTime, modifiedTime, alternateLanguages, i18n.language]);

  return null;
};

export default SEOHead;