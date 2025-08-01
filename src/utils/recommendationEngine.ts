// Content Recommendation Engine
import { supabase } from '@/integrations/supabase/client';

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  type: 'episode' | 'insight' | 'pdf';
  categories?: string[];
  tags?: string[];
  difficulty?: string;
  reading_time?: number;
  duration?: string;
  description?: string;
  summary?: string;
  series?: string;
  insight_type?: string;
  book_author?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  preferred_categories: string[];
  preferred_difficulty: string[];
  preferred_types: string[];
  viewed_content: string[];
  bookmarked_content: string[];
  interaction_weights: Record<string, number>;
}

export interface RecommendationScore {
  content: ContentItem;
  score: number;
  reasons: string[];
}

class RecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private contentSimilarity: Map<string, Map<string, number>> = new Map();

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine() {
    await this.precomputeContentSimilarity();
  }

  // Precompute content similarity using TF-IDF and cosine similarity
  private async precomputeContentSimilarity() {
    try {
      // Fetch all content
      const [episodes, insights, pdfs] = await Promise.all([
        this.fetchEpisodes(),
        this.fetchInsights(),
        this.fetchPdfs(),
      ]);

      const allContent = [...episodes, ...insights, ...pdfs];
      
      // Compute similarity matrix
      for (let i = 0; i < allContent.length; i++) {
        const similarities = new Map<string, number>();
        
        for (let j = 0; j < allContent.length; j++) {
          if (i !== j) {
            const similarity = this.computeContentSimilarity(allContent[i], allContent[j]);
            similarities.set(allContent[j].id, similarity);
          }
        }
        
        // Keep only top 10 most similar items
        const sortedSimilarities = Array.from(similarities.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);
        
        this.contentSimilarity.set(
          allContent[i].id, 
          new Map(sortedSimilarities)
        );
      }
    } catch (error) {
      console.warn('Failed to precompute content similarity:', error);
    }
  }

  private async fetchEpisodes(): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from('episodes')
      .select('id, title, slug, description, content, summary, series, duration, created_at, updated_at')
      .eq('status', 'published');

    if (error) throw error;

    return data?.map(episode => ({
      ...episode,
      type: 'episode' as const,
      categories: [episode.series],
      tags: this.extractTags(episode.content || episode.description || ''),
    })) || [];
  }

  private async fetchInsights(): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from('insights')
      .select('id, title, slug, description, content, summary, category, difficulty_level, reading_time, insight_type, book_author, created_at, updated_at')
      .eq('status', 'published');

    if (error) throw error;

    return data?.map(insight => ({
      ...insight,
      type: 'insight' as const,
      categories: insight.category ? [insight.category] : [],
      tags: this.extractTags(insight.content || insight.description || ''),
      difficulty: insight.difficulty_level,
    })) || [];
  }

  private async fetchPdfs(): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from('pdfs')
      .select('id, title, slug, description, created_at, updated_at');

    if (error) throw error;

    return data?.map(pdf => ({
      ...pdf,
      type: 'pdf' as const,
      categories: ['report'],
      tags: this.extractTags(pdf.description || ''),
    })) || [];
  }

  private extractTags(text: string): string[] {
    // Simple tag extraction based on common finance terms
    const financeTerms = [
      'AI', 'KI', 'automation', 'digitalisierung', 'transformation', 
      'analytics', 'reporting', 'dashboard', 'CFO', 'controller',
      'business intelligence', 'machine learning', 'blockchain',
      'cloud', 'SaaS', 'fintech', 'innovation', 'prozess',
      'strategie', 'kostenmanagement', 'budgetierung', 'forecasting'
    ];

    const lowerText = text.toLowerCase();
    return financeTerms.filter(term => lowerText.includes(term.toLowerCase()));
  }

  private computeContentSimilarity(content1: ContentItem, content2: ContentItem): number {
    let score = 0;

    // Type similarity (same type gets bonus)
    if (content1.type === content2.type) {
      score += 0.3;
    }

    // Category overlap
    const categories1 = content1.categories || [];
    const categories2 = content2.categories || [];
    const categoryOverlap = this.jaccard(categories1, categories2);
    score += categoryOverlap * 0.4;

    // Tag overlap
    const tags1 = content1.tags || [];
    const tags2 = content2.tags || [];
    const tagOverlap = this.jaccard(tags1, tags2);
    score += tagOverlap * 0.3;

    // Difficulty similarity (for insights)
    if (content1.difficulty && content2.difficulty) {
      if (content1.difficulty === content2.difficulty) {
        score += 0.2;
      }
    }

    // Title similarity (basic keyword matching)
    const titleSimilarity = this.computeTextSimilarity(
      content1.title,
      content2.title
    );
    score += titleSimilarity * 0.1;

    return Math.min(score, 1.0);
  }

  private jaccard(set1: string[], set2: string[]): number {
    const intersection = set1.filter(item => set2.includes(item));
    const union = [...new Set([...set1, ...set2])];
    return union.length === 0 ? 0 : intersection.length / union.length;
  }

  private computeTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\W+/);
    const words2 = text2.toLowerCase().split(/\W+/);
    return this.jaccard(words1, words2);
  }

  // Get user profile from analytics data
  private async getUserProfile(userId: string): Promise<UserProfile> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    try {
      // Fetch user's analytics events
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('event_type, event_data, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      const profile: UserProfile = {
        user_id: userId,
        preferred_categories: [],
        preferred_difficulty: [],
        preferred_types: [],
        viewed_content: [],
        bookmarked_content: [],
        interaction_weights: {},
      };

      // Analyze user behavior
      events?.forEach(event => {
        const data = event.event_data;
        
        if (event.event_type === 'insight_interaction') {
          if (data?.action === 'view') {
            profile.viewed_content.push(data.insight_id);
          }
          if (data?.action === 'bookmark') {
            profile.bookmarked_content.push(data.insight_id);
          }
          if (data?.insight_type) {
            profile.preferred_types.push(data.insight_type);
          }
        }
        
        if (event.event_type === 'episode_interaction') {
          if (data?.action === 'view' || data?.action === 'play') {
            profile.viewed_content.push(data.episode_id);
          }
          if (data?.action === 'bookmark') {
            profile.bookmarked_content.push(data.episode_id);
          }
        }
      });

      // Calculate preferences based on frequency
      profile.preferred_types = this.getTopFrequent(profile.preferred_types, 5);
      
      this.userProfiles.set(userId, profile);
      return profile;
    } catch (error) {
      console.warn('Failed to get user profile:', error);
      return {
        user_id: userId,
        preferred_categories: [],
        preferred_difficulty: [],
        preferred_types: [],
        viewed_content: [],
        bookmarked_content: [],
        interaction_weights: {},
      };
    }
  }

  private getTopFrequent(items: string[], limit: number): string[] {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }

  // Get content-based recommendations
  async getContentBasedRecommendations(
    contentId: string,
    limit: number = 6
  ): Promise<RecommendationScore[]> {
    const similarities = this.contentSimilarity.get(contentId);
    if (!similarities) return [];

    return Array.from(similarities.entries())
      .slice(0, limit)
      .map(([id, score]) => ({
        content: { id } as ContentItem, // This would be populated with full content data
        score,
        reasons: ['Similar content'],
      }));
  }

  // Get personalized recommendations for a user
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10,
    excludeIds: string[] = []
  ): Promise<RecommendationScore[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const [episodes, insights, pdfs] = await Promise.all([
        this.fetchEpisodes(),
        this.fetchInsights(),
        this.fetchPdfs(),
      ]);

      const allContent = [...episodes, ...insights, ...pdfs]
        .filter(content => 
          !excludeIds.includes(content.id) && 
          !userProfile.viewed_content.includes(content.id)
        );

      const recommendations: RecommendationScore[] = [];

      for (const content of allContent) {
        let score = 0;
        const reasons: string[] = [];

        // Type preference
        if (userProfile.preferred_types.includes(content.type)) {
          score += 0.3;
          reasons.push(`Matches your ${content.type} preference`);
        }

        // Category preference
        const categoryMatch = content.categories?.some(cat => 
          userProfile.preferred_categories.includes(cat)
        );
        if (categoryMatch) {
          score += 0.25;
          reasons.push('Matches your interests');
        }

        // Difficulty preference (for insights)
        if (content.difficulty && userProfile.preferred_difficulty.includes(content.difficulty)) {
          score += 0.2;
          reasons.push(`${content.difficulty} level content`);
        }

        // Content-based similarity to viewed content
        let maxSimilarity = 0;
        for (const viewedId of userProfile.viewed_content.slice(-10)) {
          const similarity = this.contentSimilarity.get(viewedId)?.get(content.id) || 0;
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
        score += maxSimilarity * 0.4;
        if (maxSimilarity > 0.3) {
          reasons.push('Similar to content you\'ve viewed');
        }

        // Recency boost
        const daysSinceCreated = (Date.now() - new Date(content.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated < 7) {
          score += 0.1;
          reasons.push('Recently published');
        }

        // Popularity boost (simplified - could be based on actual view counts)
        if (content.type === 'insight' && content.insight_type === 'book_summary') {
          score += 0.05;
        }

        if (score > 0.1) {
          recommendations.push({
            content,
            score,
            reasons,
          });
        }
      }

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.warn('Failed to get personalized recommendations:', error);
      return [];
    }
  }

  // Get trending content based on recent interactions
  async getTrendingContent(
    timeRange: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<RecommendationScore[]> {
    try {
      const daysBack = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('event_data')
        .in('event_type', ['insight_interaction', 'episode_interaction'])
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Count interactions by content
      const contentCounts: Record<string, { views: number; shares: number; bookmarks: number }> = {};
      
      events?.forEach(event => {
        const data = event.event_data;
        const contentId = data?.insight_id || data?.episode_id;
        
        if (contentId) {
          if (!contentCounts[contentId]) {
            contentCounts[contentId] = { views: 0, shares: 0, bookmarks: 0 };
          }
          
          if (data?.action === 'view') contentCounts[contentId].views++;
          if (data?.action === 'share') contentCounts[contentId].shares++;
          if (data?.action === 'bookmark') contentCounts[contentId].bookmarks++;
        }
      });

      // Calculate trending scores
      const trendingScores = Object.entries(contentCounts)
        .map(([contentId, counts]) => {
          const score = counts.views * 1 + counts.shares * 3 + counts.bookmarks * 2;
          return {
            contentId,
            score,
            reasons: [`${counts.views} views, ${counts.shares} shares, ${counts.bookmarks} bookmarks`],
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // This would need to be enhanced to fetch full content data
      return trendingScores.map(item => ({
        content: { id: item.contentId } as ContentItem,
        score: item.score,
        reasons: item.reasons,
      }));
    } catch (error) {
      console.warn('Failed to get trending content:', error);
      return [];
    }
  }
}

// Singleton instance
export const recommendationEngine = new RecommendationEngine();

// React hook for recommendations
export const useRecommendations = () => {
  return {
    getContentBased: recommendationEngine.getContentBasedRecommendations.bind(recommendationEngine),
    getPersonalized: recommendationEngine.getPersonalizedRecommendations.bind(recommendationEngine),
    getTrending: recommendationEngine.getTrendingContent.bind(recommendationEngine),
  };
};