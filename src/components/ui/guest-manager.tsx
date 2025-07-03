import React, { useState, useEffect } from 'react';
import { Plus, X, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Guest {
  id: string;
  name: string;
  bio?: string;
  image_url?: string;
  social_links?: any;
}

interface GuestManagerProps {
  value: Guest[];
  onChange: (guests: Guest[]) => void;
  disabled?: boolean;
}

export const GuestManager: React.FC<GuestManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: '',
    bio: '',
    image_url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load guests',
        variant: 'destructive',
      });
    }
  };

  const createGuest = async () => {
    if (!newGuest.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('guests')
        .insert({
          name: newGuest.name,
          bio: newGuest.bio || null,
          image_url: newGuest.image_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      setAllGuests([...allGuests, data]);
      onChange([...value, data]);
      setNewGuest({ name: '', bio: '', image_url: '' });
      setShowNewGuestForm(false);
      
      toast({
        title: 'Guest Created',
        description: `${data.name} has been added to your guests`,
      });
    } catch (error) {
      console.error('Error creating guest:', error);
      toast({
        title: 'Error',
        description: 'Failed to create guest',
        variant: 'destructive',
      });
    }
  };

  const addGuest = (guest: Guest) => {
    if (!value.find(g => g.id === guest.id)) {
      onChange([...value, guest]);
    }
  };

  const removeGuest = (guestId: string) => {
    onChange(value.filter(g => g.id !== guestId));
  };

  const filteredGuests = allGuests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.find(g => g.id === guest.id)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Episode Guests
            <span className="text-sm font-normal text-muted-foreground">
              ({value.length} selected)
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNewGuestForm(!showNewGuestForm)}
            disabled={disabled}
          >
            <UserPlus size={16} className="mr-1" />
            New Guest
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected guests */}
        {value.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Guests</h4>
            <div className="space-y-2">
              {value.map((guest) => (
                <div key={guest.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={guest.image_url} alt={guest.name} />
                    <AvatarFallback>{getInitials(guest.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{guest.name}</div>
                    {guest.bio && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {guest.bio}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeGuest(guest.id)}
                    disabled={disabled}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New guest form */}
        {showNewGuestForm && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <h4 className="text-sm font-medium">Create New Guest</h4>
            <Input
              placeholder="Guest name"
              value={newGuest.name}
              onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
              disabled={disabled}
            />
            <Input
              placeholder="Profile image URL (optional)"
              value={newGuest.image_url}
              onChange={(e) => setNewGuest({ ...newGuest, image_url: e.target.value })}
              disabled={disabled}
            />
            <Textarea
              placeholder="Bio (optional)"
              value={newGuest.bio}
              onChange={(e) => setNewGuest({ ...newGuest, bio: e.target.value })}
              className="min-h-[60px]"
              disabled={disabled}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={createGuest}
                disabled={!newGuest.name.trim() || disabled}
                size="sm"
              >
                Create & Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewGuestForm(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Guest search and selection */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search existing guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              disabled={disabled}
            />
          </div>

          {filteredGuests.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => addGuest(guest)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={guest.image_url} alt={guest.name} />
                    <AvatarFallback className="text-xs">{getInitials(guest.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{guest.name}</div>
                    {guest.bio && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {guest.bio}
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm">
                    <Plus size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchTerm && filteredGuests.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No guests found matching "{searchTerm}"
            </div>
          )}
        </div>

        {allGuests.length === 0 && !showNewGuestForm && (
          <div className="text-center py-6 text-muted-foreground">
            No guests in your database yet. Create your first guest to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};