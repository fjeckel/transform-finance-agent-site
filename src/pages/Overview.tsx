import React, { useState } from 'react';
import { ArrowLeft, Info, FileText, Wrench, Users, TrendingUp, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';
import { MobileSearch } from '@/components/ui/mobile-search';

const Overview = () => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Überblick - Finance Transformers"
        description="Entdecke die Welt der Finance Transformers: WTF?!, CFO Memos und Tool Time. Dein umfassender Leitfaden zur Finanztransformation."
      />
      
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-[#13B87B] transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Zurück zur Startseite
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 pb-20 lg:pb-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 font-cooper">
            Die Welt der Finance Transformers
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Willkommen in unserem Universum der Finanztransformation. Hier findest du alles, 
            was du über unsere verschiedenen Formate und Inhalte wissen musst.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* What is WTF?! */}
          <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-[#13B87B] to-[#0F9A6A] text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Info size={24} />
                </div>
                <CardTitle className="text-2xl font-cooper">Was ist WTF?!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>WTF?! - Warum Finance Transformieren</strong> ist unser Hauptpodcast, 
                  der sich den großen Fragen der Finanztransformation widmet.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Target size={16} className="text-[#13B87B] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Mission</h4>
                      <p className="text-sm text-muted-foreground">
                        Wir hinterfragen bestehende Finanzprozesse und zeigen neue Wege auf
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-[#13B87B] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Für wen?</h4>
                      <p className="text-sm text-muted-foreground">
                        CFOs, Finance Manager und alle, die Finanzprozesse transformieren wollen
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <TrendingUp size={16} className="text-[#13B87B] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Themen</h4>
                      <p className="text-sm text-muted-foreground">
                        Digitalisierung, Automatisierung, Prozessoptimierung, Technologie-Trends
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">Podcast</Badge>
                    <Badge variant="secondary">Wöchentlich</Badge>
                    <Badge variant="secondary">30-45 Min</Badge>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/episodes">
                      WTF?! Episoden ansehen
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What is CFO Memo */}
          <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-[#003FA5] to-[#0056E0] text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText size={24} />
                </div>
                <CardTitle className="text-2xl font-cooper">Was ist CFO Memo?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>CFO Memos</strong> sind kompakte, praxisorientierte Dokumente, 
                  die komplexe Finanzthemen auf den Punkt bringen.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Target size={16} className="text-[#003FA5] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Format</h4>
                      <p className="text-sm text-muted-foreground">
                        Strukturierte PDF-Dokumente mit konkreten Handlungsempfehlungen
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-[#003FA5] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Zielgruppe</h4>
                      <p className="text-sm text-muted-foreground">
                        Führungskräfte im Finance-Bereich, die schnelle Lösungen brauchen
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <TrendingUp size={16} className="text-[#003FA5] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Nutzen</h4>
                      <p className="text-sm text-muted-foreground">
                        Sofort umsetzbare Strategien und Best Practices für deinen Arbeitsalltag
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">PDF Download</Badge>
                    <Badge variant="secondary">Praxisnah</Badge>
                    <Badge variant="secondary">5-10 Seiten</Badge>
                  </div>
                  <Button asChild className="w-full" variant="outline">
                    <Link to="/episodes?tab=memos">
                      CFO Memos entdecken
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tool Time Section */}
        <Card className="mb-12 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wrench size={24} />
              </div>
              <div>
                <CardTitle className="text-2xl font-cooper">Was ist Tool Time by WTF?!</CardTitle>
                <p className="text-purple-100 mt-2">
                  Deep Dives in die Tools und Technologien der Finanztransformation
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Tool Time</strong> ist unser Spezialformat für alle, die tief in 
                  die technische Seite der Finanztransformation eintauchen wollen.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Target size={16} className="text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Fokus</h4>
                      <p className="text-sm text-muted-foreground">
                        Detaillierte Tool-Reviews, Implementierungsstrategien und Tech-Trends
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground">Für Techies</h4>
                      <p className="text-sm text-muted-foreground">
                        Finance-Experten mit technischem Background und Tool-Interesse
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Typische Themen:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                    ERP-Systeme und ihre Finance-Module
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                    Business Intelligence und Reporting-Tools
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                    Automatisierungsplattformen (RPA, Workflows)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                    Cloud-Finance-Lösungen und APIs
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                    KI und Machine Learning im Finance-Bereich
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">Deep Dive</Badge>
                <Badge variant="secondary">Tool-Focus</Badge>
                <Badge variant="secondary">45-60 Min</Badge>
                <Badge variant="secondary">Hands-on</Badge>
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link to="/episodes">
                  Tool Time Episoden ansehen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-[#13B87B]/10 to-[#003FA5]/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 font-cooper">
            Bereit für deine Finance Transformation?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Egal ob du gerade erst anfängst oder schon mittendrin bist - bei uns findest du 
            die passenden Inhalte für jeden Schritt deiner Reise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/episodes">
                Alle Inhalte entdecken
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">
                Mehr über uns erfahren
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <MobileSearch open={mobileSearchOpen} onOpenChange={setMobileSearchOpen} />
    </div>
  );
};

export default Overview;