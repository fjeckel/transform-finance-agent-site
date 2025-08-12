'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, CheckCircle, Timer } from 'lucide-react';
import { learningPaths, trustSignals } from './data/learningPaths';
import { useStartHereAnalytics } from './hooks/useStartHereAnalytics';
import { UserJourneyModal } from './components/UserJourneyModal';
import { PathSelectionGrid } from './components/PathSelectionGrid';
import { TrustSignals } from './components/TrustSignals';
import { SocialProof } from './components/SocialProof';

interface StartHereSectionProps {
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

export const StartHereSection: React.FC<StartHereSectionProps> = ({ 
  className = '',
  variant = 'default' 
}) => {
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const {
    trackSectionViewed,
    trackPathSelected,
    trackJourneyStarted,
    trackTrustSignalInteraction
  } = useStartHereAnalytics();

  useEffect(() => {
    setMounted(true);
    trackSectionViewed(variant);
  }, [trackSectionViewed, variant]);

  const handlePathSelection = (pathId: string) => {
    setSelectedPathId(pathId);
    trackPathSelected(pathId);
    setIsJourneyModalOpen(true);
  };

  const handleJourneyStart = (pathId: string) => {
    trackJourneyStarted(pathId, 'quick_start');
    // TODO: Navigate to content or start journey flow
  };

  const handleGetStartedClick = () => {
    setIsJourneyModalOpen(true);
    trackJourneyStarted('personalized', 'section_cta');
  };

  if (!mounted) return null;

  return (
    <>
      <section className={`py-16 bg-gradient-to-br from-slate-50 via-white to-blue-50 ${className}`}>
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 text-sm font-medium">
              Dein personalisierter Lernpfad
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Wo möchtest du 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> starten</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Finance Transformation muss nicht kompliziert sein. Wähle deinen Weg 
              basierend auf deiner Rolle, Erfahrung und den aktuellen Herausforderungen.
            </p>

            {/* Trust Signals */}
            <TrustSignals 
              companies={trustSignals.companies}
              onInteraction={(signalType, signalId, action) => 
                trackTrustSignalInteraction(signalType, signalId, action)
              }
            />
          </div>

          {/* Learning Paths Grid */}
          <PathSelectionGrid 
            paths={learningPaths}
            onPathSelect={handlePathSelection}
            onPathHover={(pathId, duration) => {
              // trackPathCardHovered is handled in PathCard component
            }}
          />

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Nicht sicher, was zu dir passt?
              </h3>
              <p className="text-gray-600 mb-6">
                Lass uns gemeinsam deinen optimalen Lernpfad finden. 
                2-3 Minuten für personalisierte Empfehlungen.
              </p>
              <Button 
                onClick={handleGetStartedClick}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Persönlichen Pfad finden
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Social Proof & Statistics */}
          <div className="mt-16">
            <SocialProof 
              stats={trustSignals.statistics}
              socialData={trustSignals.socialProof}
              onInteraction={(signalType, signalId, action) => 
                trackTrustSignalInteraction(signalType, signalId, action)
              }
            />
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">94%</div>
              <div className="text-sm text-gray-600">berichten Verbesserungen in 30 Tagen</div>
            </div>
            
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Timer className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">5 Min</div>
              <div className="text-sm text-gray-600">bis zum ersten wertvollen Insight</div>
            </div>
            
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">1200+</div>
              <div className="text-sm text-gray-600">Finance Leaders vertrauen uns</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Journey Modal */}
      <UserJourneyModal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
        selectedPathId={selectedPathId}
        onComplete={(pathId, preferences) => {
          // TODO: Handle journey completion
          console.log('Journey completed:', { pathId, preferences });
          setIsJourneyModalOpen(false);
        }}
      />
    </>
  );
};