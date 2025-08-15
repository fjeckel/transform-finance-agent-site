import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ResearchSessionSummary, ResearchFolder } from '../types';
import type { ResearchSession, ResearchParameters } from '@/types/research';

export const useSessionHistory = () => {
  const [sessions, setSessions] = useState<ResearchSessionSummary[]>([]);
  const [folders, setFolders] = useState<ResearchFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load all sessions for the current user
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try the new schema with chat history support
      let { data: sessionsData, error: sessionsError } = await supabase
        .from('research_sessions')
        .select(`
          id,
          session_title,
          status,
          research_type,
          created_at,
          updated_at,
          conversation_metadata,
          folder_id,
          actual_cost_usd,
          estimated_cost_usd,
          folder:research_session_folders(
            name,
            color,
            icon
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(100);

      // If the new schema fails, fall back to the old schema
      if (sessionsError && sessionsError.code === 'PGRST200') {
        console.log('New schema not available, falling back to old schema');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('research_sessions')
          .select(`
            id,
            title,
            status,
            research_type,
            created_at,
            updated_at,
            actual_cost_usd,
            estimated_cost_usd
          `)
          .order('updated_at', { ascending: false })
          .limit(100);

        if (fallbackError) throw fallbackError;

        // Convert old schema to new format
        sessionsData = (fallbackData || []).map(session => ({
          id: session.id,
          session_title: session.title || 'Untitled Research',
          status: session.status,
          research_type: session.research_type,
          created_at: session.created_at,
          updated_at: session.updated_at,
          conversation_metadata: {
            message_count: 1,
            last_activity: session.updated_at,
            tags: [],
            favorite: false,
            archived: false,
            total_cost: session.actual_cost_usd || 0,
            provider_usage: {}
          },
          folder_id: null,
          actual_cost_usd: session.actual_cost_usd,
          estimated_cost_usd: session.estimated_cost_usd,
          folder: null
        }));
      } else if (sessionsError) {
        throw sessionsError;
      }

      setSessions(sessionsData || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load research sessions');
      toast({
        title: 'Error',
        description: 'Failed to load research sessions. The chat history feature may not be fully available yet.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load folders for organization
  const loadFolders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('research_session_folders')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        // If folders table doesn't exist, just set empty array
        if (error.code === '42P01') {
          console.log('Folders table not available yet, using empty folders list');
          setFolders([]);
          return;
        }
        throw error;
      }
      setFolders(data || []);
    } catch (err) {
      console.error('Error loading folders:', err);
      setFolders([]); // Fallback to empty folders
    }
  }, []);

  // Create a new research session
  const createSession = useCallback(async (
    prompt: string,
    parameters?: Partial<ResearchParameters>
  ): Promise<ResearchSession | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Try to generate session title from prompt, fallback if function doesn't exist
      let titleData = 'Research Session';
      try {
        const { data: rpcTitleData } = await supabase
          .rpc('generate_session_title', { prompt_text: prompt });
        titleData = rpcTitleData || 'Research Session';
      } catch (rpcError) {
        // Fallback title generation if RPC function doesn't exist
        const cleaned = prompt.toLowerCase()
          .replace(/please|analyze|research|study/g, '')
          .trim()
          .slice(0, 40);
        titleData = cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || 'Research Session';
      }

      // First try the new schema
      let sessionData: any = {
        user_id: user.id,
        title: titleData,
        session_title: titleData,
        research_prompt: prompt,
        research_type: parameters?.researchType || 'custom',
        status: 'pending' as const,
        max_tokens: 4000,
        temperature: 0.3,
        estimated_cost_usd: 0.05,
        conversation_metadata: {
          message_count: 1,
          last_activity: new Date().toISOString(),
          tags: [],
          favorite: false,
          archived: false,
          total_cost: 0,
          provider_usage: {}
        }
      };

      let { data, error } = await supabase
        .from('research_sessions')
        .insert(sessionData)
        .select()
        .single();

      // If new schema fails, try old schema
      if (error && error.message?.includes('session_title')) {
        console.log('New schema not available, using old schema for session creation');
        sessionData = {
          user_id: user.id,
          title: titleData,
          research_prompt: prompt,
          research_type: parameters?.researchType || 'custom',
          status: 'pending' as const,
          max_tokens: 4000,
          temperature: 0.3,
          estimated_cost_usd: 0.05
        };

        const result = await supabase
          .from('research_sessions')
          .insert(sessionData)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Refresh sessions list
      await loadSessions();

      toast({
        title: 'Session Created',
        description: 'New research session has been created'
      });

      // Convert database format to frontend format
      return {
        id: data.id,
        title: data.title,
        topic: data.research_prompt,
        status: 'setup',
        currentStep: 1,
        totalSteps: 3,
        parameters: {
          researchType: data.research_type as any,
          depth: 'comprehensive',
          focusAreas: [],
          outputFormat: 'detailed',
          outputLength: 'comprehensive',
          includeSourceData: true,
          targetAudience: 'executives'
        },
        estimatedCost: {
          minCost: 0.03,
          maxCost: 0.08,
          expectedCost: 0.05,
          currency: 'USD',
          breakdown: {
            claude: { minCost: 0.015, maxCost: 0.04, expectedTokens: 3000 },
            openai: { minCost: 0.015, maxCost: 0.04, expectedTokens: 3000 }
          },
          confidence: 80,
          basedOnSimilarQueries: 100
        },
        totalCost: 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        userId: data.user_id,
        isPublic: false
      };
    } catch (err) {
      console.error('Error creating session:', err);
      toast({
        title: 'Error',
        description: 'Failed to create research session',
        variant: 'destructive'
      });
      return null;
    }
  }, [loadSessions, toast]);

  // Update session metadata
  const updateSession = useCallback(async (
    sessionId: string,
    updates: Partial<ResearchSessionSummary>
  ) => {
    try {
      // Filter out new schema fields if they don't exist
      const safeUpdates: any = {
        updated_at: new Date().toISOString()
      };

      // Map session_title to title for old schema compatibility
      if (updates.session_title) {
        safeUpdates.title = updates.session_title;
        safeUpdates.session_title = updates.session_title;
      }

      // Only include other fields if they exist in the schema
      Object.keys(updates).forEach(key => {
        if (key !== 'session_title' && updates[key as keyof ResearchSessionSummary] !== undefined) {
          safeUpdates[key] = updates[key as keyof ResearchSessionSummary];
        }
      });

      const { error } = await supabase
        .from('research_sessions')
        .update(safeUpdates)
        .eq('id', sessionId);

      if (error) throw error;

      // Update local state
      setSessions(prev => prev.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      ));

      // Update conversation metadata if function exists
      if (updates.conversation_metadata) {
        try {
          await supabase.rpc('update_session_metadata', {
            p_session_id: sessionId
          });
        } catch (rpcError) {
          console.log('update_session_metadata function not available');
        }
      }
    } catch (err) {
      console.error('Error updating session:', err);
      toast({
        title: 'Error',
        description: 'Failed to update session',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('research_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));

      toast({
        title: 'Session Deleted',
        description: 'Research session has been deleted'
      });
    } catch (err) {
      console.error('Error deleting session:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const newFavoriteStatus = !session.conversation_metadata.favorite;
    const updatedMetadata = {
      ...session.conversation_metadata,
      favorite: newFavoriteStatus
    };

    await updateSession(sessionId, {
      conversation_metadata: updatedMetadata
    });
  }, [sessions, updateSession]);

  // Move session to folder
  const moveToFolder = useCallback(async (
    sessionId: string,
    folderId: string | null
  ) => {
    await updateSession(sessionId, { folder_id: folderId });
  }, [updateSession]);

  // Create a new folder
  const createFolder = useCallback(async (
    name: string,
    color: string = '#6B7280',
    icon: string = 'folder'
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('research_session_folders')
        .insert({
          user_id: user.id,
          name,
          color,
          icon,
          sort_order: folders.length
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          toast({
            title: 'Feature Not Available',
            description: 'Folder organization is not available yet. Database migration pending.',
            variant: 'destructive'
          });
          return null;
        }
        throw error;
      }

      setFolders(prev => [...prev, data]);

      toast({
        title: 'Folder Created',
        description: `Folder "${name}" has been created`
      });

      return data;
    } catch (err) {
      console.error('Error creating folder:', err);
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive'
      });
      return null;
    }
  }, [folders.length, toast]);

  // Load data on mount
  useEffect(() => {
    loadSessions();
    loadFolders();
  }, [loadSessions, loadFolders]);

  return {
    sessions,
    folders,
    loading,
    error,
    loadSessions,
    loadFolders,
    createSession,
    updateSession,
    deleteSession,
    toggleFavorite,
    moveToFolder,
    createFolder
  };
};