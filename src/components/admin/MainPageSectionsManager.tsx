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
import { ImageUpload } from '@/components/ui/image-upload';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

const sectionFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  section_key: z.string().min(1, 'Section key is required'),
  section_type: z.string().min(1, 'Section type is required'),
  background_color: z.string().min(1, 'Background color is required'),
  text_color: z.string().min(1, 'Text color is required'),
});

const contentFormSchema = z.object({
  content_key: z.string().min(1, 'Content key is required'),
  content_type: z.string().min(1, 'Content type is required'),
  content_value: z.string().min(1, 'Content value is required'),
}).refine((data) => {
  // Allow empty content_value for image types since ImageUpload handles it
  if (data.content_type === 'image' || data.content_key === 'cover_image') {
    return true;
  }
  return data.content_value.length > 0;
}, {
  message: 'Content value is required',
  path: ['content_value'],
});

const linkFormSchema = z.object({
  platform_name: z.string().min(1, 'Platform name is required'),
  link_type: z.string().min(1, 'Link type is required'),
  url: z.string().url('Must be a valid URL'),
  display_text: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().optional(),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;
type ContentFormData = z.infer<typeof contentFormSchema>;
type LinkFormData = z.infer<typeof linkFormSchema>;

const MainPageSectionsManager = () => {
  const [selectedSection, setSelectedSection] = useState<MainPageSection | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editingLink, setEditingLink] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sectionForm = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      section_key: '',
      section_type: 'podcast',
      background_color: '#ffffff',
      text_color: '#000000',
    },
  });

  const contentForm = useForm<ContentFormData>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      content_key: '',
      content_type: 'text',
      content_value: '',
    },
  });

  const linkForm = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      platform_name: '',
      link_type: 'social',
      url: '',
      display_text: '',
      color: '#000000',
      icon: '',
    },
  });

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

  const createSectionMutation = useMutation({
    mutationFn: async (data: SectionFormData) => {
      const maxSortOrder = Math.max(...(sections?.map(s => s.sort_order) || [0]));
      const { error } = await supabase
        .from('main_page_sections')
        .insert({
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          section_key: data.section_key,
          section_type: data.section_type,
          background_color: data.background_color,
          text_color: data.text_color,
          sort_order: maxSortOrder + 1,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Section created successfully' });
      setIsEditDialogOpen(false);
      sectionForm.reset();
    },
    onError: (error) => {
      toast({ 
        title: 'Error creating section', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('main_page_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Section deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error deleting section', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const createContentMutation = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: string; data: ContentFormData }) => {
      const { error } = await supabase
        .from('section_content')
        .insert({
          section_id: sectionId,
          content_key: data.content_key,
          content_type: data.content_type,
          content_value: data.content_value,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Content added successfully' });
      setIsContentDialogOpen(false);
      contentForm.reset();
    },
    onError: (error) => {
      toast({ 
        title: 'Error adding content', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ContentFormData }) => {
      const { error } = await supabase
        .from('section_content')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Content updated successfully' });
      setIsContentDialogOpen(false);
      contentForm.reset();
      setEditingContent(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating content', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('section_content')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Content deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error deleting content', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: string; data: LinkFormData }) => {
      const maxSortOrder = Math.max(...(selectedSection?.links?.map(l => l.sort_order) || [0]));
      const { error } = await supabase
        .from('section_links')
        .insert({
          section_id: sectionId,
          platform_name: data.platform_name,
          link_type: data.link_type,
          url: data.url,
          display_text: data.display_text,
          color: data.color,
          icon: data.icon,
          sort_order: maxSortOrder + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Link added successfully' });
      setIsLinkDialogOpen(false);
      linkForm.reset();
    },
    onError: (error) => {
      toast({ 
        title: 'Error adding link', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LinkFormData }) => {
      const { error } = await supabase
        .from('section_links')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Link updated successfully' });
      setIsLinkDialogOpen(false);
      linkForm.reset();
      setEditingLink(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Error updating link', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('section_links')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-main-page-sections'] });
      toast({ title: 'Link deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error deleting link', 
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
        <Button onClick={() => {
          setSelectedSection(null);
          sectionForm.reset();
          setIsEditDialogOpen(true);
        }}>
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
                      sectionForm.reset({
                        title: section.title,
                        subtitle: section.subtitle || '',
                        description: section.description || '',
                        section_key: section.section_key,
                        section_type: section.section_type,
                        background_color: section.background_color,
                        text_color: section.text_color,
                      });
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSectionMutation.mutate(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSection ? 'Edit Section' : 'Add New Section'}
            </DialogTitle>
          </DialogHeader>
          <Form {...sectionForm}>
            <form onSubmit={sectionForm.handleSubmit((data) => {
              if (selectedSection) {
                updateSectionMutation.mutate({ id: selectedSection.id, updates: data });
              } else {
                createSectionMutation.mutate(data);
              }
            })} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={sectionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sectionForm.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={sectionForm.control}
                name="section_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Key</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="unique-section-key" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sectionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={sectionForm.control}
                  name="section_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="podcast">Podcast Section</SelectItem>
                          <SelectItem value="episode_carousel">Episode Carousel</SelectItem>
                          <SelectItem value="person_profile">Person Profile</SelectItem>
                          <SelectItem value="social_links">Social Links</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sectionForm.control}
                  name="background_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sectionForm.control}
                  name="text_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedSection && (
                <Tabs defaultValue="content" className="w-full">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="links">Links</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Section Content</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingContent(null);
                          contentForm.reset();
                          setIsContentDialogOpen(true);
                        }}
                      >
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
                            <div className="flex space-x-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingContent(content);
                                  contentForm.reset({
                                    content_key: content.content_key,
                                    content_type: content.content_type,
                                    content_value: content.content_value,
                                  });
                                  setIsContentDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteContentMutation.mutate(content.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="links" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Section Links</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingLink(null);
                          linkForm.reset();
                          setIsLinkDialogOpen(true);
                        }}
                      >
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
                            <div className="flex space-x-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingLink(link);
                                  linkForm.reset({
                                    platform_name: link.platform_name,
                                    link_type: link.link_type,
                                    url: link.url,
                                    display_text: link.display_text || '',
                                    color: link.color,
                                    icon: link.icon || '',
                                  });
                                  setIsLinkDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteLinkMutation.mutate(link.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedSection ? 'Update Section' : 'Create Section'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Content Dialog */}
      <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContent ? 'Edit Content' : 'Add Content'}
            </DialogTitle>
          </DialogHeader>
          <Form {...contentForm}>
            <form onSubmit={contentForm.handleSubmit((data) => {
              if (editingContent) {
                updateContentMutation.mutate({ id: editingContent.id, data });
              } else if (selectedSection) {
                createContentMutation.mutate({ sectionId: selectedSection.id, data });
              }
            })} className="space-y-4">
              <FormField
                control={contentForm.control}
                name="content_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Key</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="hero_image" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contentForm.control}
                name="content_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={contentForm.control}
                name="content_value"
                render={({ field }) => {
                  const contentType = contentForm.watch('content_type');
                  const contentKey = contentForm.watch('content_key');
                  const isImageContent = contentType === 'image' || contentKey === 'cover_image';
                  
                  return (
                    <FormItem>
                      <FormLabel>
                        {isImageContent ? 'Cover Image' : 'Content Value'}
                      </FormLabel>
                      <FormControl>
                        {isImageContent ? (
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            episodeId={`main-page-sections/${selectedSection?.id || 'temp'}`}
                          />
                        ) : (
                          <Textarea {...field} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsContentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingContent ? 'Update Content' : 'Add Content'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? 'Edit Link' : 'Add Link'}
            </DialogTitle>
          </DialogHeader>
          <Form {...linkForm}>
            <form onSubmit={linkForm.handleSubmit((data) => {
              if (editingLink) {
                updateLinkMutation.mutate({ id: editingLink.id, data });
              } else if (selectedSection) {
                createLinkMutation.mutate({ sectionId: selectedSection.id, data });
              }
            })} className="space-y-4">
              <FormField
                control={linkForm.control}
                name="platform_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Spotify" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="link_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="podcast">Podcast</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="download">Download</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={linkForm.control}
                name="display_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Text (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Listen on Spotify" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={linkForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={linkForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="spotify" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLink ? 'Update Link' : 'Add Link'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainPageSectionsManager;