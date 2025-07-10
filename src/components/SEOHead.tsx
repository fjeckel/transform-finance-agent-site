import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  episode?: {
    series: string;
    season: number;
    episode: number;
    duration?: string;
    publishDate?: string;
  };
}

const SEOHead = ({ 
  title = "Finance Transformers - Podcasts, die Finance auf links drehen",
  description = "Wir sprechen über Transformation, wie sie wirklich passiert – ehrlich, unterhaltsam und relevant.",
  image = "/img/wtf-cover.png",
  url = window.location.href,
  type = "website",
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
    updateMetaTag('author', 'Finance Transformers');
    
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
          "url": window.location.origin
        },
        "episodeNumber": episode.episode,
        "seasonNumber": episode.season,
        "datePublished": episode.publishDate,
        "duration": episode.duration,
        "image": image.startsWith('http') ? image : `${window.location.origin}${image}`,
        "url": url
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
    
  }, [title, description, image, url, type, episode]);

  return null;
};

export default SEOHead;