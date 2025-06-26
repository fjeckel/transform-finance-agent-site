
import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Play, Pause, Clock, Calendar, Download, Share2, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Episode = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  const episodeData = {
    title: "Dr. Veronika von Heise-Rotenburg: Zukunftsfähige Finanzorganisationen",
    description: "Dr. Veronika von Heise-Rotenburg erläutert, wie zukunftsfähige Finanzorganisationen aufgebaut werden und welche Rolle Technologie dabei spielt.",
    duration: "45:32",
    publishDate: "15. Dezember 2024",
    season: 1,
    episode: 5,
    image: "/img/veronika.jpg",
    spotifyUrl: "https://open.spotify.com/episode/example",
    appleUrl: "https://podcasts.apple.com/episode/example",
    youtubeUrl: "https://youtube.com/watch?v=example"
  };

  const showNotes = [
    {
      timestamp: "00:00",
      title: "Einführung",
      content: "Begrüßung und Vorstellung von Dr. Veronika von Heise-Rotenburg"
    },
    {
      timestamp: "03:15",
      title: "Herausforderungen moderner Finanzorganisationen",
      content: "Diskussion über die größten Probleme im heutigen Finanzwesen"
    },
    {
      timestamp: "12:30",
      title: "Technologie als Enabler",
      content: "Wie Technologie die Transformation von Finanzprozessen vorantreibt"
    },
    {
      timestamp: "25:45",
      title: "Change Management",
      content: "Strategien für erfolgreiche Veränderungsprozesse in Finanzteams"
    },
    {
      timestamp: "38:20",
      title: "Zukunftsausblick",
      content: "Prognosen für die Entwicklung der Finanzbranche in den nächsten Jahren"
    }
  ];

  const transcript = `
Tim: Herzlich willkommen zu einer neuen Folge von Finance Transformers. Ich bin Tim Teuscher und heute haben wir einen ganz besonderen Gast bei uns: Dr. Veronika von Heise-Rotenburg. Veronika, schön, dass du da bist!

Dr. Veronika: Vielen Dank für die Einladung, Tim. Ich freue mich sehr auf unser Gespräch.

Tim: Veronika, du bist Expertin für zukunftsfähige Finanzorganisationen. Was sind denn aus deiner Sicht die größten Herausforderungen, vor denen Finanzabteilungen heute stehen?

Dr. Veronika: Das ist eine sehr gute Frage. Ich sehe drei Hauptherausforderungen: Erstens die Digitalisierung der Prozesse, zweitens die Veränderung der Arbeitskultur und drittens die Integration neuer Technologien wie KI und Automatisierung.

Tim: Das sind wirklich große Themen. Lass uns mal konkret werden - wie kann Technologie dabei helfen, diese Herausforderungen zu meistern?

Dr. Veronika: Technologie ist definitiv ein Enabler, aber sie ist nicht die Lösung für alles. Es geht darum, die richtige Balance zu finden zwischen technischen Möglichkeiten und menschlichen Bedürfnissen...

[Fortsetzung des Transkripts...]
  `;

  const platformLinks = [
    { name: 'Spotify', url: episodeData.spotifyUrl, color: '#1DB954' },
    { name: 'Apple Podcasts', url: episodeData.appleUrl, color: '#A855F7' },
    { name: 'YouTube', url: episodeData.youtubeUrl, color: '#FF0000' },
    { name: 'Amazon Music', url: '#', color: '#FF9900' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
              <img
                src={episodeData.image}
                alt={episodeData.title}
                className="w-full aspect-square object-cover rounded-xl shadow-lg"
              />
            </div>
            
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className="inline-block bg-[#003FA5] text-white px-3 py-1 rounded-full text-sm font-bold">
                  S{episodeData.season}E{episodeData.episode}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4 font-cooper">
                {episodeData.title}
              </h1>
              
              <p className="text-lg text-gray-700 mb-6">
                {episodeData.description}
              </p>
              
              <div className="flex items-center space-x-6 mb-6 text-gray-600">
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  <span>{episodeData.duration}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  <span>{episodeData.publishDate}</span>
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

        {/* Spotify Player */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-6 h-6 bg-[#1DB954] rounded mr-3"></div>
              Spotify Player
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto mb-4">
                <Play size={24} className="text-white ml-1" />
              </div>
              <p className="text-gray-600 mb-4">
                Höre die Episode direkt hier oder öffne sie in Spotify
              </p>
              <Button 
                onClick={() => window.open(episodeData.spotifyUrl, '_blank')}
                className="bg-[#1DB954] hover:bg-[#1AA34A] text-white"
              >
                In Spotify öffnen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Links */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Auf anderen Plattformen anhören</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platformLinks.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:scale-105 group"
                >
                  <span className="font-bold text-sm text-gray-800 group-hover:text-gray-900">
                    {platform.name}
                  </span>
                  <ExternalLink size={14} className="text-gray-600" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Show Notes */}
        <Card className="mb-8">
          <CardHeader>
            <Collapsible open={showNotes} onOpenChange={setShowNotes}>
              <CollapsibleTrigger className="w-full">
                <CardTitle className="flex items-center justify-between">
                  Show Notes
                  <span className="text-sm font-normal">
                    {showNotes ? 'Ausblenden' : 'Anzeigen'}
                  </span>
                </CardTitle>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {showNotes.map((note, index) => (
                      <div key={index} className="border-l-4 border-[#13B87B] pl-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-mono">
                            {note.timestamp}
                          </span>
                          <h3 className="font-bold text-gray-900">{note.title}</h3>
                        </div>
                        <p className="text-gray-700">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>

        {/* Transcript */}
        <Card>
          <CardHeader>
            <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
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
                      {transcript}
                    </pre>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Episode;
