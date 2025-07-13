import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  author?: string;
  episode?: {
    series: string;
    season: number;
    episode: number;
    duration?: string;
    publishDate?: string;
    audioUrl?: string;
    guests?: string[];
  };
}

const SEOHead = ({ 
  title = "Finance Transformers - Podcasts, die Finance auf links drehen",
  description = "Wir sprechen über Transformation, wie sie wirklich passiert – ehrlich, unterhaltsam und relevant.",
  image = "/img/wtf-cover.png",
  url = window.location.href,
  type = "website",
  keywords = "Finance, Transformation, Podcast, CFO, Controller, Digitalisierung, Innovation",
  author = "Finance Transformers",
  episode
}: SEOHeadProps) => {
  
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
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('language', 'de');
    
    // Canonical URL
    updateMetaTag('canonical', url);
    
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
    
    // Add structured data for podcast episodes
    if (episode) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "PodcastEpisode",
        "name": title,
        "description": description,
        "partOfSeries": {
          "@type": "PodcastSeries",
          "name": `Finance Transformers - ${episode.series.toUpperCase()}`,
          "url": window.location.origin,
          "author": {
            "@type": "Organization",
            "name": "Finance Transformers"
          }
        },
        "episodeNumber": episode.episode,
        "seasonNumber": episode.season,
        "datePublished": episode.publishDate,
        "duration": episode.duration,
        "image": image.startsWith('http') ? image : `${window.location.origin}${image}`,
        "url": url,
        "creator": {
          "@type": "Organization",
          "name": "Finance Transformers"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Finance Transformers"
        },
        ...(episode.audioUrl && {
          "associatedMedia": {
            "@type": "MediaObject",
            "contentUrl": episode.audioUrl,
            "encodingFormat": "audio/mpeg"
          }
        }),
        ...(episode.guests && episode.guests.length > 0 && {
          "actor": episode.guests.map(guest => ({
            "@type": "Person",
            "name": guest
          }))
        })
      };

      // Remove existing structured data
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
    
  }, [title, description, image, url, type, keywords, author, episode]);

  return null;
};

export default SEOHead;