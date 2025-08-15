// Research Sidebar Types
export interface ResearchSessionSummary {
  id: string;
  session_title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  research_type: string;
  created_at: string;
  updated_at: string;
  conversation_metadata: {
    message_count: number;
    last_activity: string | null;
    tags: string[];
    favorite: boolean;
    archived: boolean;
    total_cost: number;
    provider_usage: Record<string, number>;
  };
  folder_id: string | null;
  folder?: {
    name: string;
    color: string;
    icon: string;
  };
  actual_cost_usd: number;
  estimated_cost_usd: number;
}

export interface ResearchFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  sort_order: number;
  session_count: number;
  created_at: string;
  updated_at: string;
}

export interface SidebarFilters {
  status: 'all' | 'pending' | 'in_progress' | 'completed' | 'failed';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter';
  folder: string | 'all';
  provider: 'all' | 'claude' | 'openai' | 'grok';
  favorite: boolean | null;
  archived: boolean;
}

export interface SidebarSearchState {
  query: string;
  filters: SidebarFilters;
  sortBy: 'updated_at' | 'created_at' | 'title' | 'cost';
  sortOrder: 'asc' | 'desc';
}

export interface SessionContextMenuAction {
  id: string;
  label: string;
  icon: string;
  action: (session: ResearchSessionSummary) => void;
  separator?: boolean;
  destructive?: boolean;
}