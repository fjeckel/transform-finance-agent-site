import { 
  SampleTopic, 
  ResearchSession, 
  AIResult, 
  ResearchResults,
  TopicCategory 
} from '@/types/research';

export const sampleTopics: SampleTopic[] = [
  {
    id: "finance-1",
    title: "AI in Financial Services",
    description: "Comprehensive analysis of artificial intelligence applications in banking and finance",
    category: "finance",
    estimatedCost: 0.058,
    complexity: "advanced",
    keywords: ["artificial intelligence", "fintech", "banking", "automation", "risk management"],
    prompt: "Analyze the current and future applications of artificial intelligence in financial services, including trading algorithms, fraud detection, customer service automation, risk assessment, and regulatory compliance. Examine both opportunities and challenges.",
    expectedOutput: "Detailed report covering AI implementation strategies, case studies, ROI analysis, and future trends in financial technology"
  },
  {
    id: "marketing-1", 
    title: "Social Media Marketing ROI",
    description: "Measuring and optimizing return on investment for social media marketing campaigns",
    category: "marketing",
    estimatedCost: 0.042,
    complexity: "intermediate",
    keywords: ["social media", "roi", "marketing", "analytics", "conversion tracking"],
    prompt: "Examine methods for measuring and optimizing social media marketing ROI, including attribution models, KPI frameworks, analytics tools, and budget allocation strategies across different platforms.",
    expectedOutput: "Practical guide with measurement frameworks, tools recommendations, and optimization strategies"
  },
  {
    id: "technology-1",
    title: "Cybersecurity for Remote Work",
    description: "Essential cybersecurity strategies and tools for distributed teams",
    category: "technology", 
    estimatedCost: 0.045,
    complexity: "intermediate",
    keywords: ["cybersecurity", "remote work", "vpn", "endpoint security", "data protection"],
    prompt: "Research cybersecurity best practices for remote work environments, including endpoint protection, secure communications, data privacy, employee training, and incident response protocols.",
    expectedOutput: "Comprehensive security framework with implementation guidelines and tool recommendations"
  },
  {
    id: "business-1",
    title: "Digital Transformation Strategy",
    description: "Strategic approaches to successful digital transformation initiatives",
    category: "business",
    estimatedCost: 0.052,
    complexity: "advanced", 
    keywords: ["digital transformation", "strategy", "change management", "technology adoption"],
    prompt: "Analyze successful digital transformation strategies, including change management, technology selection, organizational restructuring, and performance measurement frameworks.",
    expectedOutput: "Strategic roadmap with implementation phases, success metrics, and risk mitigation strategies"
  },
  {
    id: "healthcare-1",
    title: "Telemedicine Implementation",
    description: "Best practices for implementing telemedicine programs in healthcare organizations",
    category: "healthcare",
    estimatedCost: 0.048,
    complexity: "advanced",
    keywords: ["telemedicine", "healthcare", "digital health", "patient care", "implementation"],
    prompt: "Examine telemedicine implementation strategies, including technology infrastructure, regulatory compliance, patient engagement, clinical workflows, and quality assurance measures.",
    expectedOutput: "Implementation guide with technical requirements, regulatory considerations, and success metrics"
  },
  {
    id: "sustainability-1",
    title: "Corporate ESG Strategies",
    description: "Environmental, Social, and Governance strategies for modern businesses",
    category: "sustainability",
    estimatedCost: 0.055,
    complexity: "advanced", 
    keywords: ["esg", "sustainability", "corporate responsibility", "governance", "reporting"],
    prompt: "Research effective ESG (Environmental, Social, Governance) strategies for corporations, including reporting frameworks, stakeholder engagement, risk management, and performance measurement.",
    expectedOutput: "ESG strategy framework with implementation roadmap and measurement criteria"
  },
  {
    id: "education-1",
    title: "Online Learning Engagement",
    description: "Strategies to improve student engagement in online learning environments",
    category: "education",
    estimatedCost: 0.038,
    complexity: "beginner",
    keywords: ["online learning", "student engagement", "education technology", "pedagogy"],
    prompt: "Analyze methods to increase student engagement in online learning, including interactive technologies, gamification, collaborative learning, and assessment strategies.",
    expectedOutput: "Practical guide with engagement techniques, technology tools, and assessment methods"
  },
  {
    id: "general-1",
    title: "Future of Work Post-COVID",
    description: "How the pandemic has reshaped work patterns and future workplace trends",
    category: "general",
    estimatedCost: 0.043,
    complexity: "intermediate",
    keywords: ["future of work", "covid-19", "hybrid work", "workplace trends", "productivity"],
    prompt: "Examine how COVID-19 has transformed work patterns and analyze emerging trends in hybrid work, employee expectations, workplace technology, and organizational culture.",
    expectedOutput: "Comprehensive analysis of post-pandemic work trends with strategic recommendations"
  }
];

export const mockClaudeResult: AIResult = {
  provider: 'claude',
  content: `# AI in Financial Services: A Comprehensive Analysis

## Executive Summary

Artificial Intelligence is revolutionizing the financial services industry, with applications spanning from algorithmic trading to customer service automation. This analysis examines current implementations, emerging trends, and strategic implications for financial institutions.

## Current Applications

### 1. Algorithmic Trading and Investment Management
- **High-frequency trading algorithms** processing millions of transactions per second
- **Robo-advisors** providing automated investment advice to retail customers
- **Portfolio optimization** using machine learning for risk-adjusted returns
- **Market sentiment analysis** from news and social media data

### 2. Risk Management and Compliance
- **Credit scoring models** using alternative data sources for better accuracy
- **Fraud detection systems** identifying suspicious patterns in real-time
- **Anti-money laundering (AML)** automated transaction monitoring
- **Regulatory compliance** automation for reporting and documentation

### 3. Customer Experience Enhancement
- **Chatbots and virtual assistants** for 24/7 customer support
- **Personalized banking** with tailored product recommendations
- **Predictive analytics** for customer lifetime value and churn prevention
- **Voice and biometric authentication** for enhanced security

## Technology Infrastructure

### Machine Learning Platforms
- Cloud-based ML services (AWS SageMaker, Google Cloud AI, Azure ML)
- On-premise solutions for sensitive data processing
- Hybrid architectures balancing security and scalability

### Data Management
- Real-time data streaming and processing
- Data lakes and warehouses for historical analysis
- Privacy-preserving techniques (federated learning, differential privacy)

## Implementation Challenges

### 1. Regulatory Compliance
- Model explainability requirements
- Data privacy regulations (GDPR, CCPA)
- Algorithmic bias and fairness concerns
- Cross-border data transfer restrictions

### 2. Technical Challenges
- Legacy system integration
- Data quality and standardization
- Scalability and performance optimization
- Cybersecurity and data protection

### 3. Organizational Factors
- Talent acquisition and retention
- Change management and cultural adaptation
- ROI measurement and business case development
- Vendor selection and partnership management

## Future Trends and Opportunities

### Emerging Technologies
- **Quantum computing** for complex optimization problems
- **Federated learning** for collaborative model training
- **Explainable AI** for transparent decision-making
- **Graph neural networks** for fraud detection and risk analysis

### Market Evolution
- **Open banking** APIs enabling fintech innovation
- **Central bank digital currencies (CBDCs)** transformation
- **Decentralized finance (DeFi)** integration challenges
- **Sustainable finance** ESG scoring and green investments

## Strategic Recommendations

### 1. Technology Strategy
- Develop a comprehensive AI roadmap aligned with business objectives
- Invest in cloud infrastructure and data management capabilities
- Build centers of excellence for AI development and deployment
- Establish partnerships with technology providers and fintechs

### 2. Risk Management
- Implement robust model governance and validation frameworks
- Develop bias detection and mitigation strategies
- Ensure regulatory compliance from design to deployment
- Create incident response plans for AI system failures

### 3. Human Capital
- Recruit data scientists and AI specialists
- Upskill existing workforce in AI literacy
- Foster a data-driven culture throughout the organization
- Develop career paths for AI and analytics professionals

### 4. Customer-Centric Approach
- Focus on solving real customer problems with AI
- Ensure transparency in AI-driven decisions
- Maintain human oversight for critical customer interactions
- Continuously measure and improve customer satisfaction

## ROI and Business Impact

### Quantifiable Benefits
- **Cost reduction**: 20-30% reduction in operational costs
- **Revenue growth**: 15-25% increase from personalized offerings
- **Risk mitigation**: 40-60% reduction in fraud losses
- **Efficiency gains**: 50-70% faster processing times

### Success Metrics
- Customer satisfaction and Net Promoter Score (NPS)
- Operational efficiency and cost per transaction
- Risk-adjusted returns and default rates
- Time to market for new products and services

## Conclusion

AI adoption in financial services is accelerating, driven by competitive pressures, customer expectations, and regulatory requirements. Success requires a holistic approach combining technology innovation, risk management, and cultural transformation. Financial institutions that strategically implement AI while maintaining trust and compliance will gain significant competitive advantages in the evolving digital economy.

The future of finance will be increasingly AI-driven, requiring continuous adaptation and investment in both technology and human capabilities.`,
  metadata: {
    model: 'claude-3-sonnet-20240229',
    tokensUsed: 3247,
    cost: 0.0289,
    processingTime: 12430,
    finishReason: 'stop'
  },
  timestamp: new Date(),
  status: 'completed'
};

export const mockOpenAIResult: AIResult = {
  provider: 'openai',
  content: `# Artificial Intelligence in Financial Services: Market Analysis and Implementation Guide

## Introduction

The financial services industry is undergoing a dramatic transformation driven by artificial intelligence technologies. From algorithmic trading to personalized banking, AI is reshaping how financial institutions operate, manage risk, and serve customers.

## Current Market Landscape

### Adoption Statistics
- 85% of financial institutions have implemented or are piloting AI solutions
- $10.5 billion invested in fintech AI startups in 2023
- 70% reduction in processing time for loan approvals using AI
- 90% accuracy in fraud detection with machine learning models

### Key Players and Solutions
- **Goldman Sachs**: Marcus AI for personal finance management
- **JPMorgan Chase**: COiN for contract analysis and legal document processing
- **Bank of America**: Erica virtual assistant serving 15+ million customers
- **Wells Fargo**: Predictive banking for personalized financial insights

## Implementation Areas and Use Cases

### 1. Operational Efficiency
**Process Automation**
- Document processing and data extraction
- Regulatory reporting automation
- Back-office operations streamlining
- Compliance monitoring and reporting

**Benefits Achieved:**
- 60% reduction in manual processing time
- 85% decrease in data entry errors
- $2.5 billion annual savings across the industry

### 2. Customer Experience Innovation

**Personalization Engine**
- Real-time product recommendations
- Dynamic pricing based on customer behavior
- Customized financial advice and planning
- Proactive customer outreach and support

**Digital Banking Evolution**
- Voice-activated banking commands
- Biometric authentication systems
- Predictive cash flow management
- Automated savings and investment suggestions

### 3. Advanced Analytics and Decision Making

**Credit Risk Assessment**
- Alternative data integration (social media, transaction patterns)
- Real-time credit scoring updates
- Small business lending automation
- Peer-to-peer lending risk evaluation

**Investment Management**
- Algorithmic trading optimization
- Portfolio rebalancing automation
- Market trend prediction models
- ESG investment screening

## Technical Implementation Framework

### Infrastructure Requirements
- **Cloud Computing**: Scalable processing power for model training
- **Data Pipeline**: Real-time data ingestion and processing
- **API Management**: Seamless integration with existing systems
- **Security Layer**: End-to-end encryption and access controls

### Development Methodology
1. **Data Strategy**: Establish data governance and quality standards
2. **Model Development**: Build, train, and validate AI models
3. **Integration**: Connect AI systems with core banking platforms
4. **Monitoring**: Continuous model performance tracking
5. **Optimization**: Regular model updates and improvements

## Regulatory Considerations and Compliance

### Global Regulatory Framework
- **MiFID II (EU)**: Algorithmic trading transparency requirements
- **GDPR**: Data privacy and customer consent management
- **PCI DSS**: Payment card data security standards
- **Basel III**: Capital adequacy and risk management

### Best Practices for Compliance
- Implement explainable AI for transparent decision-making
- Maintain comprehensive audit trails for all AI-driven decisions
- Regular bias testing and model fairness assessments
- Continuous monitoring of model performance and drift

## Challenges and Risk Mitigation

### Technical Challenges
- **Data Quality**: Inconsistent or incomplete data sets
- **Model Interpretability**: Black-box algorithms in regulated environments
- **Integration Complexity**: Legacy system compatibility issues
- **Scalability**: Managing increasing data volumes and user demands

### Mitigation Strategies
- Invest in data governance and quality management systems
- Adopt hybrid human-AI decision making for critical processes
- Develop comprehensive testing and validation frameworks
- Create fail-safe mechanisms and human override capabilities

## Future Outlook and Emerging Trends

### Next-Generation Technologies
- **Quantum Machine Learning**: Enhanced optimization for portfolio management
- **Federated Learning**: Privacy-preserving collaborative model training
- **Conversational AI**: Advanced natural language processing for customer interactions
- **Behavioral Analytics**: Deeper insights into customer financial habits

### Market Predictions (2024-2027)
- 95% of financial transactions will involve AI processing
- $40 billion market size for AI in financial services by 2027
- 50% of customer service interactions handled by AI
- 30% improvement in fraud detection accuracy

### Industry Transformation
- **Open Banking**: API-driven ecosystem enabling fintech innovation
- **Embedded Finance**: AI-powered financial services integrated into non-financial platforms
- **Sustainable Finance**: AI-driven ESG analysis and green investment optimization
- **Digital Currencies**: AI-powered risk management for cryptocurrency trading

## Actionable Implementation Roadmap

### Phase 1: Foundation (Months 1-6)
- Assess current data infrastructure and quality
- Identify high-impact use cases for AI implementation
- Establish AI governance and ethics framework
- Build internal AI literacy and capabilities

### Phase 2: Pilot Programs (Months 7-12)
- Launch 2-3 pilot AI projects in low-risk areas
- Develop model validation and testing procedures
- Create feedback loops for continuous improvement
- Measure and document ROI and performance metrics

### Phase 3: Scale and Optimize (Months 13-24)
- Expand successful pilots to full production
- Integrate AI systems with core banking operations
- Implement advanced analytics and reporting dashboards
- Establish center of excellence for AI innovation

## Success Metrics and KPIs

### Financial Impact
- Cost reduction: 25-40% in operational expenses
- Revenue increase: 15-30% from personalized products
- Risk reduction: 50-70% decrease in fraud losses
- Efficiency gains: 60-80% improvement in processing speed

### Customer Experience
- Net Promoter Score (NPS) improvement
- Customer acquisition cost reduction
- Support ticket resolution time decrease
- Digital engagement rate increase

## Conclusion and Strategic Recommendations

The integration of AI in financial services is not optional but essential for remaining competitive. Organizations should focus on:

1. **Strategic Alignment**: Ensure AI initiatives support overall business objectives
2. **Phased Approach**: Start with low-risk, high-impact applications
3. **Cultural Change**: Foster an AI-ready organizational culture
4. **Continuous Learning**: Stay updated with emerging technologies and regulations
5. **Customer-Centricity**: Prioritize customer value over technological sophistication

Success in AI implementation requires balancing innovation with risk management, ensuring that technological advancement enhances rather than compromises customer trust and regulatory compliance. The financial institutions that master this balance will lead the industry's digital transformation.`,
  metadata: {
    model: 'gpt-4-turbo-2024-04-09',
    tokensUsed: 3891,
    cost: 0.0312,
    processingTime: 14250,
    finishReason: 'stop'
  },
  timestamp: new Date(),
  status: 'completed'
};

export const mockResearchSession: ResearchSession = {
  id: 'session_mock_demo_001',
  config: {
    topic: 'Analyze the current and future applications of artificial intelligence in financial services, including trading algorithms, fraud detection, customer service automation, risk assessment, and regulatory compliance. Examine both opportunities and challenges.',
    optimizedPrompt: 'Analyze the current and future applications of artificial intelligence in financial services, including trading algorithms, fraud detection, customer service automation, risk assessment, and regulatory compliance. Examine both opportunities and challenges.\n\nProvide a comprehensive analysis including:\n1. Current market overview and adoption rates\n2. Key use cases and implementation strategies\n3. Technology infrastructure requirements\n4. Regulatory considerations and compliance\n5. Implementation challenges and risk mitigation\n6. Future outlook and emerging trends\n7. Actionable recommendations and ROI analysis\n\nPlease ensure the response is well-structured with clear sections and data-driven insights.',
    maxTokens: 4000,
    temperature: 0.7,
    providers: ['claude', 'openai']
  },
  status: 'completed',
  createdAt: new Date(Date.now() - 900000), // 15 minutes ago
  updatedAt: new Date(),
  results: {
    claude: mockClaudeResult,
    openai: mockOpenAIResult
  },
  totalCost: 0.0601,
  processingTime: 14250
};

export const getCategoryTopics = (category: TopicCategory): SampleTopic[] => {
  return sampleTopics.filter(topic => topic.category === category);
};

export const getRandomTopic = (): SampleTopic => {
  return sampleTopics[Math.floor(Math.random() * sampleTopics.length)];
};

export const generateMockSession = (topic: string): ResearchSession => {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    config: {
      topic,
      maxTokens: 4000,
      temperature: 0.7,
      providers: ['claude', 'openai']
    },
    status: 'setup',
    createdAt: new Date(),
    updatedAt: new Date(),
    totalCost: 0
  };
};

export const estimateCost = (topic: string, providers: ('claude' | 'openai')[]): number => {
  // Simple cost estimation based on topic length and number of providers
  const baseLength = 100;
  const lengthFactor = Math.max(1, topic.length / baseLength);
  const baseCostPerProvider = 0.025;
  
  return Math.round(providers.length * baseCostPerProvider * lengthFactor * 1000) / 1000;
};