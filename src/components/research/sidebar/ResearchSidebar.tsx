import React, { useState } from 'react';
import { Plus, FolderPlus, Settings, Archive, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessionHistory } from './hooks/useSessionHistory';
import { useSessionSearch } from './hooks/useSessionSearch';
import { SearchBar } from './components/SearchBar';
import { SessionItem } from './components/SessionItem';
import type { ResearchSession } from '@/types/research';
import type { ResearchSessionSummary } from './types';

interface ResearchSidebarProps {
  currentSessionId?: string | null;
  onSessionSelect?: (session: ResearchSessionSummary) => void;
  onNewSession?: () => Promise<ResearchSession | null>;
  className?: string;
}

export const ResearchSidebar: React.FC<ResearchSidebarProps> = ({
  currentSessionId,
  onSessionSelect,
  onNewSession,
  className
}) => {
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Session management hooks
  const {
    sessions,
    folders,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    toggleFavorite,
    moveToFolder,
    createFolder
  } = useSessionHistory();

  // Search and filtering
  const {
    searchState,
    filteredSessions,
    filterStats,
    setSearchQuery,
    updateFilters,
    updateSort,
    clearFilters
  } = useSessionSearch(sessions);

  // Handle new session creation
  const handleNewSession = async () => {
    setIsCreatingSession(true);
    try {
      const newSession = await onNewSession?.();
      if (newSession) {
        // Session list will be automatically refreshed by useSessionHistory
      }
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Handle session selection
  const handleSessionSelect = (session: ResearchSessionSummary) => {
    onSessionSelect?.(session);
  };

  // Handle session renaming
  const handleRename = async (sessionId: string, newTitle: string) => {
    await updateSession(sessionId, { session_title: newTitle });
  };

  // Handle session duplication
  const handleDuplicate = async (session: ResearchSessionSummary) => {
    // Create a new session based on the existing one
    const duplicatedSession = await createSession(
      `Copy of ${session.session_title}`,
      {
        researchType: session.research_type as any,
        depth: 'comprehensive',
        focusAreas: []
      }
    );

    if (duplicatedSession) {
      onSessionSelect?.({
        ...session,
        id: duplicatedSession.id,
        session_title: `Copy of ${session.session_title}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  // Handle session deletion with confirmation
  const handleDelete = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${session.session_title}"? This action cannot be undone.`
    );

    if (confirmed) {
      await deleteSession(sessionId);
      
      // If we deleted the current session, clear selection
      if (sessionId === currentSessionId) {
        onSessionSelect?.(sessions[0]); // Select first available session
      }
    }
  };

  // Group sessions by folder
  const groupedSessions = React.useMemo(() => {
    const grouped: Record<string, ResearchSessionSummary[]> = {};
    
    filteredSessions.forEach(session => {
      const key = session.folder_id || 'unorganized';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(session);
    });

    return grouped;
  }, [filteredSessions]);

  if (error) {
    return (
      <div className={cn('bg-white border-r border-gray-200 flex flex-col', className)}>
        <div className="p-4 text-center text-red-600">
          <p className="text-sm">Failed to load sessions</p>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white border-r border-gray-200 flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-gray-900">Research Sessions</h2>
        <Button
          size="sm"
          onClick={handleNewSession}
          disabled={isCreatingSession}
          className="bg-[#13B87B] hover:bg-[#0FA66A] text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Search and filters */}
      <SearchBar
        searchState={searchState}
        folders={folders}
        onSearchChange={setSearchQuery}
        onFiltersChange={updateFilters}
        onSortChange={updateSort}
        onClearFilters={clearFilters}
      />

      {/* Session list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : filteredSessions.length === 0 ? (
            // Empty state
            <div className="text-center py-8 text-gray-500">
              {sessions.length === 0 ? (
                <div>
                  <p className="text-sm mb-2">No research sessions yet</p>
                  <Button size="sm" onClick={handleNewSession}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create your first session
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-2">No sessions match your filters</p>
                  <Button size="sm" variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Session groups
            Object.entries(groupedSessions).map(([folderId, folderSessions]) => {
              const folder = folders.find(f => f.id === folderId);
              const isUnorganized = folderId === 'unorganized';

              return (
                <div key={folderId} className="space-y-2">
                  {/* Folder header */}
                  {!isUnorganized && folder && (
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-600">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span>{folder.name}</span>
                      <span className="text-gray-400">({folderSessions.length})</span>
                    </div>
                  )}

                  {/* Sessions in folder */}
                  {folderSessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onClick={() => handleSessionSelect(session)}
                      onToggleFavorite={toggleFavorite}
                      onDelete={handleDelete}
                      onRename={handleRename}
                      onDuplicate={handleDuplicate}
                      onMoveToFolder={moveToFolder}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="border-t p-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {filteredSessions.length} of {sessions.length} sessions
          </span>
          <div className="flex items-center gap-2">
            {filterStats.favorites > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{filterStats.favorites}</span>
              </div>
            )}
            {filterStats.archived > 0 && (
              <div className="flex items-center gap-1">
                <Archive className="h-3 w-3" />
                <span>{filterStats.archived}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};