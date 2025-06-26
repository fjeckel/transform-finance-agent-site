
import React from 'react';
import { ArrowLeft, Play, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Episodes = () => {
  const episodes = [
    {
      id: 1,
      title: "Dr. Veronika von Heise-Rotenburg: Zukunftsfähige Finanzorganisationen",
      description: "Dr. Veronika von Heise-Rotenburg erläutert, wie zukunftsfähige Finanzorganisationen aufgebaut werden und welche Rolle Technologie dabei spielt.",
      duration: "45:32",
      publishDate: "15. Dezember 2024",
      season: 1,
      episode: 5,
      image: "/img/veronika.jpg",
      slug: "episode"
    },
    {
      id: 2,
      title: "Lisa Müller: Digitale Transformation im Finance-Bereich",
      description: "Lisa Müller teilt ihre Erfahrungen zur erfolgreichen Digitalisierung von Finanzprozessen in mittelständischen Unternehmen.",
      duration: "38:45",
      publishDate: "8. Dezember 2024",
      season: 1,
      episode: 4,
      image: "/img/lisa.jpg",
      slug: "episode"
    },
    {
      id: 3,
      title: "Katharina Schmidt: KI in der Finanzanalyse",
      description: "Katharina Schmidt erklärt, wie künstliche Intelligenz die Finanzanalyse revolutioniert und welche Chancen sich dadurch ergeben.",
      duration: "42:18",
      publishDate: "1. Dezember 2024",
      season: 1,
      episode: 3,
      image: "/img/katharina.jpg",
      slug: "episode"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-[#13B87B] transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Zurück zur Startseite
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-cooper">
            Alle Episoden
          </h1>
          <p className="text-lg text-gray-600">
            Entdecke alle Episoden von Finance Transformers mit Experten aus der Finanzwelt
          </p>
        </div>

        {/* Episodes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes.map((episode) => (
            <Card key={episode.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-square overflow-hidden">
                <img
                  src={episode.image}
                  alt={episode.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <CardHeader className="pb-3">
                <div className="mb-2">
                  <span className="inline-block bg-[#003FA5] text-white px-2 py-1 rounded-full text-xs font-bold">
                    S{episode.season}E{episode.episode}
                  </span>
                </div>
                
                <CardTitle className="text-lg leading-tight mb-2">
                  {episode.title}
                </CardTitle>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    <span>{episode.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>{episode.publishDate}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {episode.description}
                </p>
                
                <div className="flex space-x-2">
                  <Link to={`/${episode.slug}`} className="flex-1">
                    <Button className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white">
                      <Play size={16} className="mr-2" />
                      Anhören
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-12">
          <Button variant="outline" className="px-8 py-3">
            Weitere Episoden laden
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Episodes;
