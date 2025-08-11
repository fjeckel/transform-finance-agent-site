import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Edit, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOverviewPageSections } from '@/hooks/useOverviewPageSections';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminOverview = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { data: sections, isLoading, refetch } = useOverviewPageSections();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();

  const handleEdit = (section: any) => {
    setEditingSection(section.id);
    setFormData({
      title: section.title,
      subtitle: section.subtitle || '',
      description: section.description || '',
      background_color: section.background_color,
      text_color: section.text_color,
    });
  };

  const handleSave = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('main_page_sections')
        .update({
          title: formData.title,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          background_color: formData.background_color,
          text_color: formData.text_color,
        })
        .eq('id', sectionId);

      if (error) throw error;

      toast({
        title: t('common:status.success'),
        description: t('admin:messages.sectionUpdated', 'Sektion wurde erfolgreich aktualisiert.'),
      });

      setEditingSection(null);
      refetch();
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: t('common:status.error'),
        description: t('admin:messages.updateError', 'Fehler beim Aktualisieren der Sektion.'),
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setFormData({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-48">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin" className="inline-flex items-center text-muted-foreground hover:text-[#13B87B] transition-colors">
              <ArrowLeft size={20} className="mr-2" />
              {t('common:buttons.back')} zum {t('admin:title')}
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/overview" target="_blank">
                <Button variant="outline" size="sm">
                  <Eye size={16} className="mr-2" />
                  {t('admin:actions.livePreview', 'Live Vorschau')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 font-cooper">
            {t('admin:pages.overviewManagement', 'Overview Page Management')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin:pages.overviewDescription', 'Verwalte den Inhalt der Overview-Seite. Alle Änderungen werden sofort live übernommen.')}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections?.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="bg-accent/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {section.title}
                      <Badge variant="secondary" className="text-xs">
                        {section.section_type}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('admin:fields.sectionKey', 'Section Key')}: {section.section_key} | {t('admin:fields.order', 'Order')}: {section.sort_order}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingSection === section.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSave(section.id)}
                        >
                          <Save size={16} className="mr-2" />
                          {t('common:buttons.save')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          <X size={16} className="mr-2" />
                          {t('common:buttons.cancel')}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(section)}
                      >
                        <Edit size={16} className="mr-2" />
                        {t('common:buttons.edit')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {editingSection === section.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('common:general.title')}</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={t('admin:placeholders.sectionTitle', 'Sektion Titel')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('admin:fields.subtitle', 'Untertitel')}</label>
                      <Input
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        placeholder={t('admin:placeholders.sectionSubtitle', 'Sektion Untertitel (optional)')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('common:general.description')}</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={t('admin:placeholders.sectionDescription', 'Sektion Beschreibung')}
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('admin:fields.backgroundColor', 'Hintergrundfarbe')}</label>
                        <Input
                          value={formData.background_color}
                          onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                          placeholder={t('admin:placeholders.backgroundColor', 'z.B. #ffffff oder linear-gradient(...)')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('admin:fields.textColor', 'Textfarbe')}</label>
                        <Input
                          value={formData.text_color}
                          onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                          placeholder={t('admin:placeholders.textColor', 'z.B. #000000 oder white')}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">{t('common:general.title')}</h4>
                      <p className="text-foreground">{section.title}</p>
                    </div>
                    
                    {section.subtitle && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">{t('admin:fields.subtitle', 'Untertitel')}</h4>
                        <p className="text-foreground">{section.subtitle}</p>
                      </div>
                    )}
                    
                    {section.description && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">{t('common:general.description')}</h4>
                        <p className="text-foreground">{section.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">{t('admin:fields.background', 'Hintergrund')}</h4>
                        <p className="text-xs font-mono bg-accent p-2 rounded truncate">
                          {section.background_color}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground">{t('admin:fields.textColor', 'Textfarbe')}</h4>
                        <p className="text-xs font-mono bg-accent p-2 rounded">
                          {section.text_color}
                        </p>
                      </div>
                    </div>

                    {section.content && section.content.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('admin:fields.contentItems', 'Content Items')}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {section.content.slice(0, 5).map((content) => (
                            <div key={content.id} className="text-xs bg-accent/30 p-2 rounded">
                              <span className="font-medium">{content.content_key}:</span> {content.content_value.substring(0, 100)}
                              {content.content_value.length > 100 && '...'}
                            </div>
                          ))}
                          {section.content.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              ...{t('common:general.and', 'und')} {section.content.length - 5} {t('admin:fields.moreContentItems', 'weitere Content Items')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 {t('admin:hints.title', 'Hinweise')}</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• {t('admin:hints.detailedEditing', 'Detaillierte Content-Bearbeitung (wie Badges, Links) erfolgt direkt in der Datenbank oder über separate Tools')}</li>
            <li>• {t('admin:hints.backgroundColors', 'Hintergrundfarben unterstützen CSS-Gradient-Syntax für schöne Verläufe')}</li>
            <li>• {t('admin:hints.liveChanges', 'Änderungen werden sofort live übernommen - keine Freigabe erforderlich')}</li>
            <li>• {t('admin:hints.sectionOrder', 'Die Reihenfolge der Sektionen wird über das sort_order Feld gesteuert')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;