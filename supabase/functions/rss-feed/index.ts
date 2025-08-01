import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Episode {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  audio_url: string;
  image_url: string;
  duration: string;
  publish_date: string;
  season: number;
  episode_number: number;
  series: string;
  episode_guests: { guest: { name: string } }[];
}

const escapeXml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDuration = (duration: string): string => {
  // Convert MM:SS or HH:MM:SS to iTunes duration format
  if (!duration) return '00:00:00';
  const parts = duration.split(':');
  if (parts.length === 2) {
    return `00:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return duration;
};

const getSeriesInfo = (series: string, language: string = 'de') => {
  const seriesMap: Record<string, Record<string, { title: string; description: string; category: string }>> = {
    'wtf': {
      'de': {
        title: 'WTF?! Finance',
        description: 'Komplexe Finanzthemen verständlich erklärt',
        category: 'Business',
      },
      'en': {
        title: 'WTF?! Finance',
        description: 'Understanding complex financial topics in simple terms',
        category: 'Business',
      },
    },
    'finance_transformers': {
      'de': {
        title: 'Finance Transformers',
        description: 'Finanzwesen durch Technologie und Innovation transformieren',
        category: 'Technology',
      },
      'en': {
        title: 'Finance Transformers',
        description: 'Transforming finance through technology and innovation',
        category: 'Technology',
      },
    },
    'cfo_memo': {
      'de': {
        title: 'CFO Memo',
        description: 'Strategische Einblicke für Finanzführungskräfte',
        category: 'Business',
      },
      'en': {
        title: 'CFO Memo',
        description: 'Strategic insights for finance leaders',
        category: 'Business',
      },
    },
  };
  
  return seriesMap[series]?.[language] || seriesMap['finance_transformers']?.[language] || seriesMap['finance_transformers']['de'];
};

const generateRssFeed = (episodes: Episode[], series?: string, baseUrl: string = 'https://financetransformers.com', language: string = 'de') => {
  const seriesInfo = series ? getSeriesInfo(series, language) : {
    title: language === 'en' ? 'Finance Transformers Podcast Network' : 'Finance Transformers Podcast Netzwerk',
    description: language === 'en' ? 'All episodes from Finance Transformers podcast network' : 'Alle Episoden aus dem Finance Transformers Podcast Netzwerk',
    category: 'Business',
  };

  const channelImage = series === 'wtf' 
    ? `${baseUrl}/img/wtf-cover.png`
    : `${baseUrl}/img/wtf-cover.png`; // Update with appropriate images

  const rssItems = episodes.map(episode => {
    const episodeUrl = `${baseUrl}/episode/${episode.slug}`;
    const guests = episode.episode_guests?.map(eg => eg.guest.name).join(', ');
    
    return `
    <item>
      <title>${escapeXml(episode.title)}</title>
      <description>${escapeXml(episode.description)}</description>
      <link>${episodeUrl}</link>
      <guid isPermaLink="true">${episodeUrl}</guid>
      <pubDate>${new Date(episode.publish_date).toUTCString()}</pubDate>
      ${episode.audio_url ? `
      <enclosure url="${escapeXml(episode.audio_url)}" type="audio/mpeg" />
      ` : ''}
      <itunes:title>${escapeXml(episode.title)}</itunes:title>
      <itunes:summary>${escapeXml(episode.description)}</itunes:summary>
      <itunes:author>Finance Transformers</itunes:author>
      <itunes:image href="${escapeXml(episode.image_url || channelImage)}" />
      <itunes:duration>${formatDuration(episode.duration)}</itunes:duration>
      <itunes:season>${episode.season}</itunes:season>
      <itunes:episode>${episode.episode_number}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>
      ${guests ? `<itunes:keywords>${escapeXml(guests)}</itunes:keywords>` : ''}
      ${episode.content ? `<content:encoded><![CDATA[${episode.content}]]></content:encoded>` : ''}
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(seriesInfo.title)}</title>
    <description>${escapeXml(seriesInfo.description)}</description>
    <link>${baseUrl}${language === 'en' ? '/en' : ''}</link>
    <language>${language === 'en' ? 'en-US' : 'de-DE'}</language>
    <copyright>© ${new Date().getFullYear()} Finance Transformers</copyright>
    <atom:link href="${baseUrl}/api/rss${series ? `/${series}` : ''}${language === 'en' ? '?lang=en' : ''}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>Finance Transformers</itunes:author>
    <itunes:summary>${escapeXml(seriesInfo.description)}</itunes:summary>
    <itunes:owner>
      <itunes:name>Finance Transformers</itunes:name>
      <itunes:email>podcast@financetransformers.com</itunes:email>
    </itunes:owner>
    <itunes:explicit>no</itunes:explicit>
    <itunes:image href="${channelImage}" />
    <itunes:category text="${seriesInfo.category}">
      <itunes:category text="Investing" />
    </itunes:category>
    ${rssItems}
  </channel>
</rss>`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const series = pathParts[pathParts.length - 1];
    
    // Validate series parameter
    const validSeries = ['wtf', 'finance_transformers', 'cfo_memo'];
    const isValidSeries = validSeries.includes(series);

    // Build query
    let query = supabase
      .from('episodes')
      .select(`
        id,
        title,
        slug,
        description,
        content,
        audio_url,
        image_url,
        duration,
        publish_date,
        season,
        episode_number,
        series,
        episode_guests (
          guest:guests (
            name
          )
        )
      `)
      .eq('status', 'published')
      .order('publish_date', { ascending: false });

    if (isValidSeries) {
      query = query.eq('series', series);
    }

    const { data: episodes, error } = await query;

    if (error) {
      throw error;
    }

    const baseUrl = url.searchParams.get('baseUrl') || 'https://financetransformers.com';
    const language = url.searchParams.get('lang') || 'de';
    
    // Validate language parameter
    const validLanguages = ['de', 'en'];
    const validatedLanguage = validLanguages.includes(language) ? language : 'de';
    
    const rssFeed = generateRssFeed(episodes || [], isValidSeries ? series : undefined, baseUrl, validatedLanguage);

    return new Response(rssFeed, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});