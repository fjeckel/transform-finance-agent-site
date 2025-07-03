import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ShowNote {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  sort_order: number;
}

interface ShowNotesManagerProps {
  value: ShowNote[];
  onChange: (notes: ShowNote[]) => void;
  disabled?: boolean;
}

export const ShowNotesManager: React.FC<ShowNotesManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const [newNote, setNewNote] = useState({
    timestamp: '',
    title: '',
    content: '',
  });

  const addNote = () => {
    if (!newNote.timestamp || !newNote.title) return;

    const note: ShowNote = {
      id: `temp-${Date.now()}`,
      timestamp: newNote.timestamp,
      title: newNote.title,
      content: newNote.content,
      sort_order: value.length,
    };

    onChange([...value, note]);
    setNewNote({ timestamp: '', title: '', content: '' });
  };

  const removeNote = (id: string) => {
    onChange(value.filter(note => note.id !== id));
  };

  const updateNote = (id: string, field: keyof ShowNote, newValue: string | number) => {
    onChange(
      value.map(note =>
        note.id === id ? { ...note, [field]: newValue } : note
      )
    );
  };

  const formatTimestamp = (timestamp: string) => {
    // Convert seconds to MM:SS format
    const totalSeconds = parseInt(timestamp);
    if (isNaN(totalSeconds)) return timestamp;
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Show Notes
          <span className="text-sm font-normal text-muted-foreground">
            ({value.length} notes)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note form */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Timestamp (e.g., 0:30 or 30)"
              value={newNote.timestamp}
              onChange={(e) => setNewNote({ ...newNote, timestamp: e.target.value })}
              disabled={disabled}
            />
            <Input
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              disabled={disabled}
            />
          </div>
          <Textarea
            placeholder="Note content (optional)"
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="min-h-[60px]"
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={addNote}
            disabled={!newNote.timestamp || !newNote.title || disabled}
            size="sm"
          >
            <Plus size={16} className="mr-1" />
            Add Note
          </Button>
        </div>

        {/* Existing notes */}
        <div className="space-y-2">
          {value
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((note, index) => (
              <div key={note.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="cursor-move mt-2">
                  <GripVertical size={16} className="text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={note.timestamp}
                      onChange={(e) => updateNote(note.id, 'timestamp', e.target.value)}
                      placeholder="Timestamp"
                      disabled={disabled}
                      className="text-sm"
                    />
                    <Input
                      value={note.title}
                      onChange={(e) => updateNote(note.id, 'title', e.target.value)}
                      placeholder="Note title"
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                  {note.content && (
                    <Textarea
                      value={note.content}
                      onChange={(e) => updateNote(note.id, 'content', e.target.value)}
                      placeholder="Note content"
                      disabled={disabled}
                      className="min-h-[60px] text-sm"
                    />
                  )}
                  <div className="text-xs text-muted-foreground">
                    Timestamp: {formatTimestamp(note.timestamp)}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeNote(note.id)}
                  disabled={disabled}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}

          {value.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No show notes yet. Add timestamps and notes to help listeners navigate your episode.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
