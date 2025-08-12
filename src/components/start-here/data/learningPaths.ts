import { LearningPath } from '../types/paths';
import { Lightbulb, Target, Settings, TrendingUp, Users, Zap } from 'lucide-react';

export const learningPaths: LearningPath[] = [
  {
    id: 'finance_transformation_basics',
    title: 'Finance Transformation Grundlagen',
    description: 'Perfekt für Controller und Finance Manager, die systematisch in die Transformation einsteigen möchten. Bewährte Strategien von Unternehmen wie Hugo Boss und Everphone.',
    icon: Lightbulb,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    difficulty: 'beginner',
    estimatedTime: '2-3 Wochen',
    topics: [
      'Transformation Grundlagen',
      'Prozessoptimierung', 
      'Digitale Tools',
      'Change Management',
      'Quick Wins identifizieren',
      'Team Alignment'
    ],
    outcomes: [
      'Verstehe die Kernprinzipien der Finance Transformation',
      'Identifiziere Quick Wins in deinem Bereich',
      'Entwickle eine Roadmap für erste Optimierungen',
      'Baue ein Verständnis für digitale Finance Tools auf'
    ],
    prerequisites: [],
    contentTypes: ['episode', 'insight'],
    targetAudience: ['Controller', 'Finance Manager', 'Senior Analyst', 'Finance Business Partner'],
    popularity: 85,
    recommendedContent: [
      {
        id: 'episode_65',
        type: 'episode',
        title: 'Finance Transformation 101 - Was steckt wirklich dahinter?',
        slug: 'finance-transformation-101',
        estimatedTime: '25 min',
        difficulty: 'beginner',
        priority: 1,
        description: 'Die Grundlagen verstehen - Von manuellen Prozessen zu digitaler Exzellenz',
        tags: ['Grundlagen', 'Strategie', 'Digitalisierung']
      },
      {
        id: 'framework_basics',
        type: 'insight',
        title: '5-Schritte Finance Transformation Assessment',
        slug: 'transformation-assessment-framework',
        estimatedTime: '15 min',
        difficulty: 'beginner',
        priority: 2,
        description: 'Systematische Bewertung deines aktuellen Finance-Bereichs',
        tags: ['Assessment', 'Framework', 'Selbstbewertung']
      },
      {
        id: 'episode_58',
        type: 'episode',
        title: 'Quick Wins identifizieren - Die Low-Hanging-Fruits der Finance',
        slug: 'finance-quick-wins',
        estimatedTime: '22 min',
        difficulty: 'beginner',
        priority: 3,
        description: 'Sofortige Verbesserungen mit minimalem Aufwand erreichen',
        tags: ['Quick Wins', 'Effizienz', 'Priorisierung']
      }
    ],
    nextSteps: [
      {
        id: 'email_signup',
        title: 'Transformation Newsletter',
        description: 'Erhalte wöchentlich neue Insights und Praxistipps',
        actionType: 'email_signup',
        actionData: { list: 'transformation_basics', sequence: 'beginner_onboarding' },
        order: 1,
        isRequired: false
      },
      {
        id: 'leadership_transition',
        title: 'Bereit für Leadership?',
        description: 'Wechsle zum Leadership-Pfad für Führungsstrategien',
        actionType: 'content',
        actionData: { pathId: 'transformation_leadership' },
        order: 2
      }
    ]
  },
  
  {
    id: 'transformation_leadership',
    title: 'Transformation erfolgreich führen',
    description: 'Für CFOs und Finance Directors, die ihre Teams durch komplexe Transformationsprojekte führen. Erprobte Methoden von Leaders bei PwC, Workday und anderen Top-Unternehmen.',
    icon: Target,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    difficulty: 'intermediate',
    estimatedTime: '4-6 Wochen',
    topics: [
      'Transformations-Leadership',
      'Change Management',
      'Stakeholder Management',
      'ROI Messung & KPIs',
      'Team Development',
      'Vision & Kommunikation'
    ],
    outcomes: [
      'Entwickle eine überzeugende Transformation Vision',
      'Führe dein Team erfolgreich durch Veränderungen',
      'Messe und kommuniziere Transformation ROI',
      'Baue starke Stakeholder-Beziehungen auf'
    ],
    prerequisites: ['Grundverständnis Finance Transformation'],
    contentTypes: ['episode', 'memo', 'insight'],
    targetAudience: ['CFO', 'Finance Director', 'VP Finance', 'Head of Finance'],
    popularity: 92,
    recommendedContent: [
      {
        id: 'episode_72',
        type: 'episode',
        title: 'CFO Interview: Wie moderne Unternehmen die Finance digitalisieren',
        slug: 'cfo-interview-digitalization',
        estimatedTime: '35 min',
        difficulty: 'intermediate',
        priority: 1,
        description: 'Einblicke von erfolgreichen CFOs über ihre Transformationsreise',
        tags: ['Leadership', 'Interview', 'Best Practices']
      },
      {
        id: 'leadership_playbook',
        type: 'memo',
        title: '90-Tage Transformation Leadership Playbook',
        slug: 'transformation-leadership-playbook',
        estimatedTime: '45 min',
        difficulty: 'intermediate',
        priority: 2,
        description: 'Schritt-für-Schritt Anleitung für die ersten 90 Tage',
        tags: ['Playbook', 'Leadership', '90-Tage-Plan']
      },
      {
        id: 'episode_69',
        type: 'episode',
        title: 'Stakeholder Management in Finance Transformations',
        slug: 'stakeholder-management-finance',
        estimatedTime: '28 min',
        difficulty: 'intermediate',
        priority: 3,
        description: 'Wie du alle Stakeholder ins Boot holst und bei der Stange hältst',
        tags: ['Stakeholder', 'Management', 'Kommunikation']
      }
    ],
    nextSteps: [
      {
        id: 'executive_community',
        title: 'Executive Community beitreten',
        description: 'Exklusive LinkedIn-Gruppe für Finance Leaders',
        actionType: 'external_link',
        actionData: { url: '/community/executives' },
        order: 1
      },
      {
        id: 'consulting_offer',
        title: 'Transformation Beratung',
        description: 'Individuelle Unterstützung für deine spezifische Situation',
        actionType: 'external_link',
        actionData: { url: '/consulting/transformation' },
        order: 2
      }
    ]
  },

  {
    id: 'specific_solutions',
    title: 'Gezielte Expertenlösungen',
    description: 'Für erfahrene Finance Professionals mit spezifischen technischen oder strategischen Herausforderungen. Spezialisiertes Know-how für komplexe Situationen.',
    icon: Settings,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    difficulty: 'advanced',
    estimatedTime: 'Individuell',
    topics: [
      'AI & Automation',
      'Advanced Analytics',
      'Tech Integration',
      'Compliance & Risk',
      'Performance Management',
      'Specialized Tools'
    ],
    outcomes: [
      'Löse spezifische technische Herausforderungen',
      'Implementiere fortgeschrittene Finance Tools',
      'Optimiere komplexe Prozesse und Workflows',
      'Entwickle maßgeschneiderte Lösungsansätze'
    ],
    prerequisites: ['Umfangreiche Finance-Erfahrung', 'Transformations-Grundkenntnisse'],
    contentTypes: ['episode', 'insight', 'memo'],
    targetAudience: ['Senior Finance Manager', 'Finance Systems Manager', 'Finance Consultant', 'Technical Lead Finance'],
    popularity: 78,
    recommendedContent: [
      {
        id: 'episode_ai_automation',
        type: 'episode',
        title: 'AI in Finance: Praktische Anwendungsfälle und Implementierung',
        slug: 'ai-finance-implementation',
        estimatedTime: '40 min',
        difficulty: 'advanced',
        priority: 1,
        description: 'Konkrete AI-Anwendungen für Finance-Bereiche',
        tags: ['AI', 'Automation', 'Technologie']
      },
      {
        id: 'advanced_analytics_guide',
        type: 'insight',
        title: 'Advanced Analytics Framework für Finance',
        slug: 'advanced-analytics-framework',
        estimatedTime: '30 min',
        difficulty: 'advanced',
        priority: 2,
        description: 'Datenanalyse-Methoden für komplexe Finance-Fragen',
        tags: ['Analytics', 'Data Science', 'Framework']
      }
    ],
    nextSteps: [
      {
        id: 'expert_network',
        title: 'Expert Network Access',
        description: 'Direkter Kontakt zu Episode-Gästen und Experten',
        actionType: 'external_link',
        actionData: { url: '/experts/network' },
        order: 1
      },
      {
        id: 'custom_research',
        title: 'Custom Research Anfrage',
        description: 'Spezifische Recherche für deine Herausforderung',
        actionType: 'external_link',
        actionData: { url: '/research/custom' },
        order: 2
      }
    ]
  }
];

// Company trust signals data
export const trustSignals = {
  companies: [
    {
      name: 'Everphone',
      logo: '/logos/everphone.svg',
      category: 'scaleup',
      description: 'Device-as-a-Service Leader'
    },
    {
      name: 'Hugo Boss',
      logo: '/logos/hugoboss.svg', 
      category: 'enterprise',
      description: 'Global Fashion Enterprise'
    },
    {
      name: 'Workday',
      logo: '/logos/workday.svg',
      category: 'saas',
      description: 'Enterprise Software'
    },
    {
      name: 'PwC',
      logo: '/logos/pwc.svg',
      category: 'consulting',
      description: 'Professional Services'
    }
  ],
  
  socialProof: {
    userCount: 1200,
    text: 'Vertraut von Finance-Führungskräften bei Everphone, Hugo Boss, Workday, PwC und 100+ weiteren Unternehmen',
    recentActivity: [
      'Sarah K. (CFO) hat gerade ihren Transformation-Pfad gestartet',
      'Michael R. (Controller) schloss den Grundlagen-Pfad ab',
      'Lisa M. (Finance Director) lädt das Leadership Playbook herunter'
    ]
  },
  
  statistics: {
    transformationSuccess: '94% berichten verbesserte Prozesse innerhalb von 30 Tagen',
    timeToValue: 'Durchschnittlich 5 Minuten bis zum ersten wertvollen Insight',
    completionRate: '78% beenden ihren gewählten Lernpfad vollständig'
  }
};