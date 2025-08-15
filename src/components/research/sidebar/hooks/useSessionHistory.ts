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

      const { data: sessionsData, error: sessionsError } = await supabase
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

      if (sessionsError) throw sessionsError;

      setSessions(sessionsData || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load research sessions');
      toast({
        title: 'Error',
        description: 'Failed to load research sessions',
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

      if (error) throw error;
      setFolders(data || []);
    } catch (err) {
      console.error('Error loading folders:', err);
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

      // Generate session title from prompt
      const { data: titleData } = await supabase
        .rpc('generate_session_title', { prompt_text: prompt });

      const sessionData = {
        user_id: user.id,
        title: titleData || 'Research Session',
        session_title: titleData || 'Research Session',
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

      const { data, error } = await supabase
        .from('research_sessions')
        .insert(sessionData)
        .select()
        .single();

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
      const { error } = await supabase
        .from('research_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Update local state
      setSessions(prev => prev.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      ));

      // Update conversation metadata if needed
      if (updates.conversation_metadata) {
        await supabase.rpc('update_session_metadata', {
          p_session_id: sessionId
        });
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

      if (error) throw error;

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