import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Image } from 'lucide-react';

interface MainPageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle?: string;
  description?: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
  section_type: string;
  content?: Array<{
    id: string;
    content_type: string;
    content_key: string;
    content_value: string;
    metadata?: any;
  }>;
  links?: Array<{
    id: string;
    link_type: string;
    platform_name: string;
    url: string;
    display_text?: string;
    color: string;
    icon?: string;
    sort_order: number;
  }>;
}

const MainPageSectionsManager = () => {
  const [selectedSection, setSelectedSection] = useState<MainPageSection | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ['admin-main-page-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('main_page_sections')
        .select(`
          *,
          content:section_content(*),
          links:section_links(*)
        `)
        .order('sort_order');

      if (error) throw error;
      return data as MainPageSection[];
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('main_page_sections')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Section updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating section', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const toggleSectionActive = (section: MainPageSection) => {
    updateSectionMutation.mutate({
      id: section.id,
      updates: { is_active: !section.is_active }
    });
  };

  const updateSortOrder = (sectionId: string, direction: 'up' | 'down') => {
    if (!sections) return;
    
    const currentSection = sections.find(s => s.id === sectionId);
    if (!currentSection) return;

    const otherSection = sections.find(s => 
      direction === 'up' 
        ? s.sort_order === currentSection.sort_order - 1
        : s.sort_order === currentSection.sort_order + 1
    );

    if (!otherSection) return;

    // Swap sort orders
    updateSectionMutation.mutate({
      id: currentSection.id,
      updates: { sort_order: otherSection.sort_order }
    });
    
    updateSectionMutation.mutate({
      id: otherSection.id,
      updates: { sort_order: currentSection.sort_order }
    });
  };

  const getSectionTypeLabel = (type: string) => {
    switch (type) {
      case 'podcast': return 'Podcast Section';
      case 'episode_carousel': return 'Episode Carousel';
      case 'person_profile': return 'Person Profile';
      case 'social_links': return 'Social Links';
      default: return type;
    }
  };

  const getSectionTypeColor = (type: string) => {
    switch (type) {
      case 'podcast': return 'bg-purple-100 text-purple-800';
      case 'episode_carousel': return 'bg-blue-100 text-blue-800';
      case 'person_profile': return 'bg-green-100 text-green-800';
      case 'social_links': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading main page sections...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Main Page Sections</h2>
        <Button onClick={() => setIsEditDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      <div className="grid gap-4">
        {sections?.map((section) => (
          <Card key={section.id} className={`transition-opacity ${!section.is_active ? 'opacity-50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge className={getSectionTypeColor(section.section_type)}>
                    {getSectionTypeLabel(section.section_type)}
                  </Badge>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  <Badge variant={section.is_active ? 'default' : 'secondary'}>
                    {section.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={section.is_active}
                    onCheckedChange={() => toggleSectionActive(section)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSortOrder(section.id, 'up')}
                    disabled={section.sort_order === 1}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSortOrder(section.id, 'down')}
                    disabled={section.sort_order === (sections?.length || 0)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSection(section);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.subtitle && (
                  <p className="text-sm text-muted-foreground font-medium">{section.subtitle}</p>
                )}
                <p className="text-sm text-muted-foreground">{section.description}</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Content Preview */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Content ({section.content?.length || 0})</h4>
                    <div className="space-y-1 text-xs">
                      {section.content?.slice(0, 3).map((content) => (
                        <div key={content.id} className="flex items-center space-x-2">
                          {content.content_type === 'image' && <Image className="h-3 w-3" />}
                          <span className="font-mono">{content.content_key}</span>
                          <span className="text-muted-foreground truncate">
                            {content.content_value.length > 30 
                              ? `${content.content_value.substring(0, 30)}...` 
                              : content.content_value}
                          </span>
                        </div>
                      ))}
                      {(section.content?.length || 0) > 3 && (
                        <div className="text-muted-foreground">
                          +{(section.content?.length || 0) - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Links Preview */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Links ({section.links?.length || 0})</h4>
                    <div className="space-y-1 text-xs">
                      {section.links?.slice(0, 3).map((link) => (
                        <div key={link.id} className="flex items-center space-x-2">
                          <ExternalLink className="h-3 w-3" />
                          <span className="font-medium">{link.platform_name}</span>
                          <span className="text-muted-foreground">{link.link_type}</span>
                        </div>
                      ))}
                      {(section.links?.length || 0) > 3 && (
                        <div className="text-muted-foreground">
                          +{(section.links?.length || 0) - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSection ? 'Edit Section' : 'Add New Section'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" defaultValue={selectedSection?.title} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input id="subtitle" defaultValue={selectedSection?.subtitle} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" defaultValue={selectedSection?.description} />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section_type">Section Type</Label>
                <Select defaultValue={selectedSection?.section_type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="podcast">Podcast Section</SelectItem>
                    <SelectItem value="episode_carousel">Episode Carousel</SelectItem>
                    <SelectItem value="person_profile">Person Profile</SelectItem>
                    <SelectItem value="social_links">Social Links</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="background_color">Background Color</Label>
                <Input 
                  id="background_color" 
                  type="color" 
                  defaultValue={selectedSection?.background_color || '#ffffff'} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text_color">Text Color</Label>
                <Input 
                  id="text_color" 
                  type="color" 
                  defaultValue={selectedSection?.text_color || '#000000'} 
                />
              </div>
            </div>

            <Tabs defaultValue="content" className="w-full">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Section Content</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedSection?.content?.map((content) => (
                    <div key={content.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium">{content.content_key}</div>
                          <div className="text-sm text-muted-foreground">
                            Type: {content.content_type}
                          </div>
                          <div className="text-sm">{content.content_value}</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="links" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Section Links</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedSection?.links?.map((link) => (
                    <div key={link.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium">{link.platform_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Type: {link.link_type}
                          </div>
                          <div className="text-sm">{link.url}</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button>
                {selectedSection ? 'Update Section' : 'Create Section'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainPageSectionsManager;