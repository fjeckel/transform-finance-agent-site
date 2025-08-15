import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Star, 
  MoreHorizontal, 
  Clock, 
  DollarSign, 
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Archive,
  Trash2,
  Edit,
  Copy,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ResearchSessionSummary } from '../types';

interface SessionItemProps {
  session: ResearchSessionSummary;
  isActive?: boolean;
  onClick?: () => void;
  onToggleFavorite?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  onRename?: (sessionId: string, newTitle: string) => void;
  onDuplicate?: (session: ResearchSessionSummary) => void;
  onMoveToFolder?: (sessionId: string, folderId: string | null) => void;
  className?: string;
}

export const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive = false,
  onClick,
  onToggleFavorite,
  onDelete,
  onRename,
  onDuplicate,
  onMoveToFolder,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.session_title);

  const getStatusIcon = () => {
    switch (session.status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (session.status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== session.session_title) {
      onRename?.(session.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(session.session_title);
      setIsEditing(false);
    }
  };

  const formatCost = (cost: number) => {
    return cost > 0 ? `$${cost.toFixed(4)}` : '--';
  };

  const totalProviderCount = Object.keys(session.conversation_metadata?.provider_usage || {}).length;

  return (
    <div
      className={cn(
        'group relative flex flex-col p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-gray-50',
        isActive ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white border-gray-200',
        session.conversation_metadata?.archived && 'opacity-60',
        className
      )}
      onClick={!isEditing ? onClick : undefined}
    >
      {/* Folder indicator */}
      {session.folder && (
        <div 
          className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
          style={{ backgroundColor: session.folder.color }}
        />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="w-full text-sm font-medium bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
              {session.session_title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Favorite star */}
          {session.conversation_metadata?.favorite && (
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
          )}

          {/* Status indicator */}
          {getStatusIcon()}

          {/* Context menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onToggleFavorite?.(session.id)}>
                <Star className="h-4 w-4 mr-2" />
                {session.conversation_metadata?.favorite ? 'Remove from favorites' : 'Add to favorites'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(session)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMoveToFolder?.(session.id, null)}>
                <Folder className="h-4 w-4 mr-2" />
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(session.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status badge and research type */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge 
          variant="outline" 
          className={cn('text-xs border', getStatusColor())}
        >
          {session.status.replace('_', ' ')}
        </Badge>
        <span className="text-xs text-gray-500 capitalize">
          {session.research_type.replace('_', ' ')}
        </span>
      </div>

      {/* Metadata row */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Message count */}
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>{session.conversation_metadata?.message_count || 0}</span>
          </div>

          {/* Provider count */}
          {totalProviderCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <span>{totalProviderCount}</span>
            </div>
          )}

          {/* Cost */}
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{formatCost(session.actual_cost_usd || session.estimated_cost_usd)}</span>
          </div>
        </div>

        {/* Last activity */}
        <span className="truncate">
          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
        </span>
      </div>

      {/* Tags */}
      {session.conversation_metadata?.tags && session.conversation_metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {session.conversation_metadata.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
              {tag}
            </Badge>
          ))}
          {session.conversation_metadata.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              +{session.conversation_metadata.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Archived indicator */}
      {session.conversation_metadata?.archived && (
        <div className="absolute top-2 right-2">
          <Archive className="h-3 w-3 text-gray-400" />
        </div>
      )}
    </div>
  );
};