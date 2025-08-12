import { UserJourneyStep } from '../types/userProfile';
import { 
  Crown, 
  Calculator, 
  Users, 
  TrendingUp, 
  Briefcase, 
  User,
  Building,
  Rocket,
  Building2,
  UserCheck,
  Headphones,
  FileText,
  Shuffle,
  Clock,
  Zap,
  Target
} from 'lucide-react';

export const journeySteps: UserJourneyStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen bei Finance Transformers!',
    description: 'Lass uns deinen perfekten Lernpfad finden. Das dauert nur 2-3 Minuten und hilft uns, dir die relevantesten Inhalte zu zeigen.',
    type: 'single_select',
    options: [
      {
        id: 'ready',
        label: 'Perfekt, lass uns starten!',
        description: 'Ich bin bereit für personalisierte Empfehlungen',
        icon: Rocket,
        value: 'ready'
      }
    ]
  },

  {
    id: 'role_identification',
    title: 'Deine aktuelle Rolle',
    description: 'Was beschreibt deine Position am besten? Das hilft uns, die relevantesten Inhalte für dich zu finden.',
    type: 'single_select',
    validation: { required: true },
    options: [
      {
        id: 'cfo',
        label: 'CFO / Finance Director',
        description: 'Strategische Führung und Gesamtverantwortung',
        icon: Crown,
        value: 'cfo',
        metadata: { seniority: 'executive', focus: 'strategic' }
      },
      {
        id: 'controller',
        label: 'Controller',
        description: 'Controlling, Reporting und Compliance',
        icon: Calculator,
        value: 'controller',
        metadata: { seniority: 'senior', focus: 'operational' }
      },
      {
        id: 'finance_manager',
        label: 'Finance Manager',
        description: 'Teamführung und operative Exzellenz',
        icon: Users,
        value: 'finance_manager',
        metadata: { seniority: 'management', focus: 'team_leadership' }
      },
      {
        id: 'senior_analyst',
        label: 'Senior Finance Analyst',
        description: 'Datenanalyse und Business Partnering',
        icon: TrendingUp,
        value: 'senior_analyst',
        metadata: { seniority: 'senior', focus: 'analytical' }
      },
      {
        id: 'consultant',
        label: 'Berater / Consultant',
        description: 'Beratung und Projekt-Management',
        icon: Briefcase,
        value: 'consultant',
        metadata: { seniority: 'expert', focus: 'consulting' }
      },
      {
        id: 'other',
        label: 'Andere Finance-Rolle',
        description: 'Spezialisierte oder andere Position',
        icon: User,
        value: 'other',
        metadata: { seniority: 'varies', focus: 'specialized' }
      }
    ]
  },

  {
    id: 'company_context',
    title: 'Dein Unternehmenskontext',
    description: 'In welcher Unternehmensumgebung arbeitest du? Das beeinflusst die Art der Herausforderungen und Lösungsansätze.',
    type: 'single_select',
    validation: { required: true },
    options: [
      {
        id: 'startup',
        label: 'Startup (< 50 Mitarbeiter)',
        description: 'Aufbau von Finance-Strukturen und -Prozessen',
        icon: Rocket,
        value: 'startup',
        metadata: { complexity: 'building', resources: 'limited', agility: 'high' }
      },
      {
        id: 'scaleup',
        label: 'Scale-up (50-500 Mitarbeiter)',
        description: 'Skalierung und Professionalisierung bestehender Prozesse',
        icon: TrendingUp,
        value: 'scaleup',
        metadata: { complexity: 'scaling', resources: 'growing', agility: 'medium' }
      },
      {
        id: 'enterprise',
        label: 'Enterprise (> 500 Mitarbeiter)',
        description: 'Optimierung und Transformation etablierter Strukturen',
        icon: Building2,
        value: 'enterprise',
        metadata: { complexity: 'optimizing', resources: 'substantial', agility: 'structured' }
      },
      {
        id: 'consulting',
        label: 'Beratung / Services',
        description: 'Client-orientierte Projekte und wechselnde Kontexte',
        icon: Briefcase,
        value: 'consulting',
        metadata: { complexity: 'varied', resources: 'project_based', agility: 'adaptive' }
      }
    ]
  },

  {
    id: 'experience_level',
    title: 'Deine Finance Transformation Erfahrung',
    description: 'Wie würdest du dein aktuelles Wissen im Bereich Finance Transformation einschätzen?',
    type: 'single_select',
    validation: { required: true },
    options: [
      {
        id: 'beginner',
        label: 'Einsteiger',
        description: 'Ich fange gerade erst an und brauche die Grundlagen',
        icon: Rocket,
        value: 'beginner',
        metadata: { learning_pace: 'structured', content_depth: 'introductory' }
      },
      {
        id: 'intermediate',
        label: 'Fortgeschritten',
        description: 'Ich habe Grundwissen und möchte tiefer einsteigen',
        icon: TrendingUp,
        value: 'intermediate',
        metadata: { learning_pace: 'accelerated', content_depth: 'detailed' }
      },
      {
        id: 'advanced',
        label: 'Erfahren',
        description: 'Ich kenne die Basics und suche spezifische Expertenlösungen',
        icon: Target,
        value: 'advanced',
        metadata: { learning_pace: 'focused', content_depth: 'specialized' }
      }
    ]
  },

  {
    id: 'primary_challenges',
    title: 'Deine aktuellen Herausforderungen',
    description: 'Was beschäftigt dich gerade am meisten? Du kannst mehrere Bereiche auswählen.',
    type: 'multi_select',
    validation: { 
      required: true,
      minSelections: 1,
      maxSelections: 5 
    },
    options: [
      {
        id: 'process_digitalization',
        label: 'Prozesse digitalisieren und automatisieren',
        value: 'process_digitalization',
        metadata: { category: 'technology', complexity: 'high' }
      },
      {
        id: 'reporting_efficiency',
        label: 'Reporting effizienter gestalten',
        value: 'reporting_efficiency',
        metadata: { category: 'operations', complexity: 'medium' }
      },
      {
        id: 'change_leadership',
        label: 'Team durch Veränderungen führen',
        value: 'change_leadership',
        metadata: { category: 'leadership', complexity: 'high' }
      },
      {
        id: 'tool_evaluation',
        label: 'Neue Finance Tools evaluieren und einführen',
        value: 'tool_evaluation',
        metadata: { category: 'technology', complexity: 'medium' }
      },
      {
        id: 'stakeholder_management',
        label: 'Stakeholder Management verbessern',
        value: 'stakeholder_management',
        metadata: { category: 'communication', complexity: 'medium' }
      },
      {
        id: 'compliance_risk',
        label: 'Compliance und Risk Management optimieren',
        value: 'compliance_risk',
        metadata: { category: 'governance', complexity: 'high' }
      },
      {
        id: 'planning_forecasting',
        label: 'Budgetplanung und Forecasting verbessern',
        value: 'planning_forecasting',
        metadata: { category: 'planning', complexity: 'medium' }
      },
      {
        id: 'cost_management',
        label: 'Cost Management und Effizienz steigern',
        value: 'cost_management',
        metadata: { category: 'efficiency', complexity: 'medium' }
      },
      {
        id: 'data_analytics',
        label: 'Datenqualität und Analytics verbessern',
        value: 'data_analytics',
        metadata: { category: 'analytics', complexity: 'high' }
      }
    ]
  },

  {
    id: 'learning_preferences',
    title: 'Wie lernst du am liebsten?',
    description: 'Welche Art von Inhalten passt am besten zu deinem Lernstil und Zeitplan?',
    type: 'single_select',
    validation: { required: true },
    options: [
      {
        id: 'audio',
        label: 'Podcast Episodes',
        description: 'Perfekt für unterwegs, beim Sport oder während der Fahrt',
        icon: Headphones,
        value: 'audio',
        metadata: { time_flexibility: 'high', engagement: 'passive', setting: 'mobile' }
      },
      {
        id: 'reading',
        label: 'Insights & schriftliche Inhalte',
        description: 'Strukturierte Artikel zum konzentrierten Lesen',
        icon: FileText,
        value: 'reading',
        metadata: { time_flexibility: 'medium', engagement: 'active', setting: 'desk' }
      },
      {
        id: 'mixed',
        label: 'Gemischte Inhalte',
        description: 'Je nach Situation Audio oder Text - maximale Flexibilität',
        icon: Shuffle,
        value: 'mixed',
        metadata: { time_flexibility: 'maximum', engagement: 'adaptive', setting: 'any' }
      }
    ]
  },

  {
    id: 'time_commitment',
    title: 'Dein zeitlicher Rahmen',
    description: 'Wie viel Zeit möchtest du wöchentlich in deine Finance Transformation investieren?',
    type: 'single_select',
    validation: { required: true },
    options: [
      {
        id: 'light',
        label: '30-60 Minuten pro Woche',
        description: 'Ein Episode oder Artikel pro Woche',
        icon: Clock,
        value: 'light',
        metadata: { weekly_content: 1, intensity: 'relaxed', commitment: 'low' }
      },
      {
        id: 'moderate',
        label: '1-2 Stunden pro Woche',
        description: '2-3 Inhalte pro Woche mit praktischer Anwendung',
        icon: Zap,
        value: 'moderate',
        metadata: { weekly_content: 2.5, intensity: 'steady', commitment: 'medium' }
      },
      {
        id: 'intensive',
        label: '2+ Stunden pro Woche',
        description: 'Intensive Lernreise mit sofortiger Umsetzung',
        icon: Target,
        value: 'intensive',
        metadata: { weekly_content: 4, intensity: 'accelerated', commitment: 'high' }
      }
    ]
  },

  {
    id: 'goals_definition',
    title: 'Deine Ziele',
    description: 'Was möchtest du in den nächsten 3-6 Monaten erreichen? (Mehrfachauswahl möglich)',
    type: 'multi_select',
    validation: { 
      required: true,
      minSelections: 1,
      maxSelections: 4 
    },
    options: [
      {
        id: 'foundation_knowledge',
        label: 'Solides Grundwissen aufbauen',
        value: 'foundation_knowledge',
        metadata: { timeline: 'short_term', difficulty: 'beginner' }
      },
      {
        id: 'leadership_skills',
        label: 'Leadership-Fähigkeiten entwickeln',
        value: 'leadership_skills',
        metadata: { timeline: 'medium_term', difficulty: 'intermediate' }
      },
      {
        id: 'specific_project',
        label: 'Aktuelles Projekt erfolgreich umsetzen',
        value: 'specific_project',
        metadata: { timeline: 'immediate', difficulty: 'varies' }
      },
      {
        id: 'career_advancement',
        label: 'Nächsten Karriereschritt vorbereiten',
        value: 'career_advancement',
        metadata: { timeline: 'long_term', difficulty: 'intermediate' }
      },
      {
        id: 'team_development',
        label: 'Mein Team weiterentwickeln',
        value: 'team_development',
        metadata: { timeline: 'medium_term', difficulty: 'advanced' }
      },
      {
        id: 'innovation_driving',
        label: 'Innovation in der Finance vorantreiben',
        value: 'innovation_driving',
        metadata: { timeline: 'long_term', difficulty: 'advanced' }
      }
    ]
  }
];

// Helper function to determine recommended path based on user responses
export const getRecommendedPathFromResponses = (responses: Record<string, any>): string => {
  const { role, company_context, experience_level, primary_challenges } = responses;
  
  // Advanced path for senior roles with complex challenges
  if (experience_level === 'advanced' || 
      ['cfo', 'consultant'].includes(role) ||
      primary_challenges?.includes('process_digitalization') ||
      primary_challenges?.includes('data_analytics')) {
    return 'specific_solutions';
  }
  
  // Leadership path for management roles and team leadership challenges
  if (['cfo', 'finance_manager'].includes(role) ||
      primary_challenges?.includes('change_leadership') ||
      primary_challenges?.includes('stakeholder_management') ||
      experience_level === 'intermediate') {
    return 'transformation_leadership';
  }
  
  // Basics path for everyone else
  return 'finance_transformation_basics';
};