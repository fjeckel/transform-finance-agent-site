import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Play, Pause, Clock, Calendar, Download, Share2, Heart, Copy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEpisodeBySlug } from '@/hooks/useEpisodeBySlug';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { toast } from '@/hooks/use-toast';
import SEOHead from '@/components/SEOHead';
import ImageWithFallback from '@/components/ui/image-with-fallback';

const DynamicEpisode = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: episode, isLoading, error } = useEpisodeBySlug(slug || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotesSection, setShowNotesSection] = useState(true);

  const handleCopyTranscript = async () => {
    if (!episode?.transcript) return;
    try {
      await navigator.clipboard.writeText(episode.transcript);
      toast({ title: 'Transkript kopiert' });
    } catch (err) {
      toast({
        title: 'Kopieren fehlgeschlagen',
        description: 'Bitte versuchen Sie es erneut.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Episode nicht gefunden</h1>
          <Link to="/" className="text-[#13B87B] hover:underline">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const platformLinks = episode.episode_platforms || [];
  const showNotes = episode.show_notes?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || [];
  const guests = episode.episode_guests?.map(eg => eg.guests).filter(Boolean) || [];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title={`${episode.title} | Finance Transformers`}
        description={episode.description || `S${episode.season}E${episode.episode_number} - ${episode.title}`}
        image={episode.image_url || '/img/wtf-cover.png'}
        type="article"
        episode={{
          series: episode.series || 'wtf',
          season: episode.season || 1,
          episode: episode.episode_number,
          duration: episode.duration || undefined,
          publishDate: episode.publish_date || undefined
        }}
      />
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-[#13B87B] transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Zurück zur Startseite
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Episode Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ImageWithFallback
                src={episode.image_url || '/placeholder.svg'}
                alt={episode.title}
                className="w-full aspect-square object-cover rounded-xl shadow-lg"
                loading="eager"
              />
            </div>
            
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className="inline-block bg-[#003FA5] text-white px-3 py-1 rounded-full text-sm font-bold">
                  S{episode.season}E{episode.episode_number}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4 font-cooper">
                {episode.title}
              </h1>
              
              {episode.description && (
                <p className="text-lg text-gray-700 mb-6">
                  {episode.description}
                </p>
              )}
              
              <div className="flex items-center space-x-6 mb-6 text-gray-600">
                {episode.duration && (
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2" />
                    <span>{episode.duration}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  <span>{formatDate(episode.publish_date)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-[#13B87B] hover:bg-[#0F9A6A] text-white px-6 py-3"
                >
                  {isPlaying ? <Pause size={20} className="mr-2" /> : <Play size={20} className="mr-2" />}
                  {isPlaying ? 'Pause' : 'Abspielen'}
                </Button>
                
                <Button variant="outline" className="px-4 py-3">
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
                
                <Button variant="outline" className="px-4 py-3">
                  <Share2 size={16} className="mr-2" />
                  Teilen
                </Button>
                
                <Button variant="outline" className="px-4 py-3">
                  <Heart size={16} className="mr-2" />
                  Merken
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        {episode.audio_url && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-6 h-6 bg-[#1DB954] rounded mr-3"></div>
                Audio Player
              </CardTitle>
            </CardHeader>
            <CardContent>
              <audio controls className="w-full">
                <source src={episode.audio_url} type="audio/mpeg" />
                Ihr Browser unterstützt das Audio-Element nicht.
              </audio>
            </CardContent>
          </Card>
        )}

        {/* Platform Links */}
        {platformLinks.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Auf anderen Plattformen anhören</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platformLinks.map((platform, index) => (
                  <a
                    key={index}
                    href={platform.platform_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:scale-105 group"
                  >
                    <span className="font-bold text-sm text-gray-800 group-hover:text-gray-900">
                      {platform.platform_name}
                    </span>
                    <ExternalLink size={14} className="text-gray-600" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guests */}
        {guests.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Gäste dieser Episode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guests.map((guest) => (
                  <div key={guest.id} className="flex items-center space-x-4">
                    <ImageWithFallback
                      src={guest.image_url || '/placeholder.svg'}
                      alt={guest.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{guest.name}</h3>
                      {guest.bio && (
                        <p className="text-gray-600 text-sm">{guest.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show Notes */}
        {showNotes.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <Collapsible open={showNotesSection} onOpenChange={setShowNotesSection}>
                <CollapsibleTrigger className="w-full">
                  <CardTitle className="flex items-center justify-between">
                    Show Notes
                    <span className="text-sm font-normal">
                      {showNotesSection ? 'Ausblenden' : 'Anzeigen'}
                    </span>
                  </CardTitle>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {showNotes.map((note) => (
                        <div key={note.id} className="border-l-4 border-[#13B87B] pl-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-mono">
                              {note.timestamp}
                            </span>
                            <h3 className="font-bold text-gray-900">{note.title}</h3>
                          </div>
                          {note.content && (
                            <p className="text-gray-700">{note.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>
          </Card>
        )}

        {/* Content/Description */}
        {episode.content && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Episode Inhalt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: episode.content.replace(/\n/g, '<br>') }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        {episode.transcript && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <Collapsible open={showTranscript} onOpenChange={setShowTranscript} className="flex-1">
                  <CollapsibleTrigger className="w-full">
                    <CardTitle className="flex items-center justify-between">
                      Vollständiges Transkript
                      <span className="text-sm font-normal">
                        {showTranscript ? 'Ausblenden' : 'Anzeigen'}
                      </span>
                    </CardTitle>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-4">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                          {episode.transcript}
                        </pre>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTranscript}
                  className="ml-2 mt-1"
                >
                  <Copy size={14} className="mr-1" />
                  Kopieren
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
};
export default DynamicEpisode;