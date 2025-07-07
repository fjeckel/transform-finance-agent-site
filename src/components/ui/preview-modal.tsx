import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episode: {
    title: string;
    description?: string;
    content?: string;
    season?: number;
    episode_number: number;
    series?: string;
    publish_date?: string;
    duration?: string;
    status: string;
    image_url?: string;
    audio_url?: string;
  };
  showNotes?: Array<{
    timestamp: string;
    title: string;
    content?: string;
  }>;
  guests?: Array<{
    name: string;
    bio?: string;
    image_url?: string;
  }>;
  platformLinks?: Array<{
    platform_name: string;
    platform_url: string;
  }>;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onOpenChange,
  episode,
  showNotes = [],
  guests = [],
  platformLinks = [],
}) => {
  const formatTimestamp = (timestamp: string) => {
    const totalSeconds = parseInt(timestamp);
    if (isNaN(totalSeconds)) return timestamp;
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Episode Preview
            <Badge variant={episode.status === 'published' ? 'default' : 'secondary'}>
              {episode.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Episode Header */}
          <div className="space-y-4">
            {episode.image_url && (
              <img 
                src={episode.image_url} 
                alt={episode.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            
            <div>
              <h1 className="text-2xl font-bold mb-2">{episode.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                {episode.season && (
                  <span>Season {episode.season}, Episode {episode.episode_number}</span>
                )}
                {episode.publish_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(episode.publish_date).toLocaleDateString()}
                  </div>
                )}
                {episode.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {episode.duration}
                  </div>
                )}
              </div>
              
              {episode.description && (
                <p className="text-muted-foreground mb-4">{episode.description}</p>
              )}
            </div>
          </div>

          {/* Audio Player */}
          {episode.audio_url && (
            <div className="space-y-2">
              <h3 className="font-semibold">Audio</h3>
              <audio controls className="w-full">
                <source src={episode.audio_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Episode Content */}
          {episode.content && (
            <div className="space-y-2">
              <h3 className="font-semibold">Episode Content</h3>
              <div className="prose prose-sm max-w-none">
                {episode.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* Guests */}
          {guests.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Guests
              </h3>
              <div className="space-y-3">
                {guests.map((guest, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {guest.image_url && (
                      <img 
                        src={guest.image_url} 
                        alt={guest.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{guest.name}</h4>
                      {guest.bio && (
                        <p className="text-sm text-muted-foreground">{guest.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show Notes */}
          {showNotes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Show Notes</h3>
              <div className="space-y-2">
                {showNotes
                  .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp))
                  .map((note, index) => (
                    <div key={index} className="flex gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 text-sm font-mono text-muted-foreground min-w-[60px]">
                        {formatTimestamp(note.timestamp)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{note.title}</h4>
                        {note.content && (
                          <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Platform Links */}
          {platformLinks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Listen On</h3>
              <div className="flex flex-wrap gap-2">
                {platformLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.platform_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border rounded-md text-sm hover:bg-muted transition-colors"
                  >
                    {link.platform_name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};