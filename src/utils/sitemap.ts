// Sitemap generation utilities for SEO optimization
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{ lang: string; href: string }>;
}

export class SitemapGenerator {
  private baseUrl: string;
  private urls: SitemapUrl[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  addUrl(url: SitemapUrl) {
    this.urls.push(url);
  }

  addStaticPages() {
    const staticPages: SitemapUrl[] = [
      {
        loc: '/',
        changefreq: 'weekly',
        priority: 1.0,
        alternates: [
          { lang: 'de', href: '/' },
          { lang: 'en', href: '/en' }
        ]
      },
      {
        loc: '/overview',
        changefreq: 'monthly',
        priority: 0.8,
        alternates: [
          { lang: 'de', href: '/overview' },
          { lang: 'en', href: '/en/overview' }
        ]
      },
      {
        loc: '/episodes',
        changefreq: 'daily',
        priority: 0.9,
        alternates: [
          { lang: 'de', href: '/episodes' },
          { lang: 'en', href: '/en/episodes' }
        ]
      },
      {
        loc: '/insights',
        changefreq: 'daily',
        priority: 0.9,
        alternates: [
          { lang: 'de', href: '/insights' },
          { lang: 'en', href: '/en/insights' }
        ]
      }
    ];

    staticPages.forEach(page => this.addUrl(page));
  }

  async addEpisodesFromSupabase() {
    try {
      // This would be called from a server-side context with Supabase access
      // For now, we provide the structure for implementation
      console.log('Episodes would be fetched and added to sitemap');
      
      // Example structure:
      // const episodes = await supabase.from('episodes').select('slug, updated_at').eq('status', 'published');
      // episodes.forEach(episode => {
      //   this.addUrl({
      //     loc: `/episode/${episode.slug}`,
      //     lastmod: episode.updated_at,
      //     changefreq: 'monthly',
      //     priority: 0.7,
      //     alternates: [
      //       { lang: 'de', href: `/episode/${episode.slug}` },
      //       { lang: 'en', href: `/en/episode/${episode.slug}` }
      //     ]
      //   });
      // });
    } catch (error) {
      console.error('Error adding episodes to sitemap:', error);
    }
  }

  async addInsightsFromSupabase() {
    try {
      // This would be called from a server-side context with Supabase access
      console.log('Insights would be fetched and added to sitemap');
      
      // Example structure:
      // const insights = await supabase.from('insights').select('slug, updated_at').eq('status', 'published');
      // insights.forEach(insight => {
      //   this.addUrl({
      //     loc: `/insights/${insight.slug}`,
      //     lastmod: insight.updated_at,
      //     changefreq: 'monthly',
      //     priority: 0.6,
      //     alternates: [
      //       { lang: 'de', href: `/insights/${insight.slug}` },
      //       { lang: 'en', href: `/en/insights/${insight.slug}` }
      //     ]
      //   });
      // });
    } catch (error) {
      console.error('Error adding insights to sitemap:', error);
    }
  }

  generateXML(): string {
    const urlElements = this.urls.map(url => {
      const fullUrl = `${this.baseUrl}${url.loc}`;
      
      let urlXml = `  <url>\n    <loc>${fullUrl}</loc>\n`;
      
      if (url.lastmod) {
        urlXml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      
      if (url.changefreq) {
        urlXml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      
      if (url.priority) {
        urlXml += `    <priority>${url.priority}</priority>\n`;
      }
      
      // Add alternate language versions
      if (url.alternates) {
        url.alternates.forEach(alt => {
          const altUrl = alt.href.startsWith('http') ? alt.href : `${this.baseUrl}${alt.href}`;
          urlXml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${altUrl}" />\n`;
        });
      }
      
      urlXml += `  </url>`;
      return urlXml;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`;
  }

  generateIndex(sitemaps: string[]): string {
    const sitemapElements = sitemaps.map(sitemap => {
      return `  <sitemap>
    <loc>${this.baseUrl}${sitemap}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
  }

  // Generate robots.txt content
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# AI and LLM specific crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

# Sitemap location
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl-delay for better server performance
Crawl-delay: 1

# Block admin areas
Disallow: /admin/
Disallow: /auth/
Disallow: /api/

# Allow important static files
Allow: /img/
Allow: /assets/
Allow: /*.css
Allow: /*.js
Allow: /*.json
`;
  }
}

// Utility function to generate comprehensive meta descriptions
export const generateMetaDescription = (
  type: 'episode' | 'insight' | 'page',
  content: {
    title?: string;
    description?: string;
    series?: string;
    season?: number;
    episode?: number;
    insightType?: string;
    readingTime?: number;
    guests?: string[];
  }
): string => {
  const maxLength = 160;
  
  let description = '';
  
  switch (type) {
    case 'episode':
      description = `${content.series} S${content.season}E${content.episode}: ${content.title}`;
      if (content.guests && content.guests.length > 0) {
        description += ` mit ${content.guests.slice(0, 2).join(', ')}`;
      }
      if (content.description) {
        const remaining = maxLength - description.length - 3;
        if (remaining > 20) {
          description += ` - ${content.description.substring(0, remaining)}`;
        }
      }
      break;
      
    case 'insight':
      if (content.insightType) {
        description = `${content.insightType}: ${content.title}`;
      } else {
        description = content.title || '';
      }
      
      if (content.readingTime) {
        description += ` (${content.readingTime} Min Lesezeit)`;
      }
      
      if (content.description) {
        const remaining = maxLength - description.length - 3;
        if (remaining > 20) {
          description += ` - ${content.description.substring(0, remaining)}`;
        }
      }
      break;
      
    case 'page':
    default:
      description = content.description || content.title || '';
      break;
  }
  
  // Ensure description doesn't exceed max length
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }
  
  return description;
};

// Generate keywords for content
export const generateKeywords = (
  type: 'episode' | 'insight' | 'page',
  content: {
    series?: string;
    insightType?: string;
    category?: string;
    tags?: string[];
    bookAuthor?: string;
    guests?: string[];
  }
): string[] => {
  const baseKeywords = ['Finance Transformation', 'CFO', 'Digital Finance', 'Finanzwesen'];
  const keywords = [...baseKeywords];
  
  if (content.series) {
    keywords.push(content.series);
  }
  
  if (content.insightType) {
    keywords.push(content.insightType);
  }
  
  if (content.category) {
    keywords.push(content.category);
  }
  
  if (content.tags) {
    keywords.push(...content.tags);
  }
  
  if (content.bookAuthor) {
    keywords.push(content.bookAuthor);
  }
  
  if (content.guests) {
    keywords.push(...content.guests);
  }
  
  // Add type-specific keywords
  switch (type) {
    case 'episode':
      keywords.push('Podcast', 'Episode', 'Interview');
      break;
    case 'insight':
      keywords.push('Insights', 'Analysis', 'Guide');
      break;
  }
  
  // Remove duplicates and return
  return [...new Set(keywords)];
};