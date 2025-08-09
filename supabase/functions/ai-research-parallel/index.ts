import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  getSecretWithRetry, 
  createSecretMissingResponse, 
  markSecretsInitialized,
  ALTERNATIVE_SECRET_NAMES 
} from '../_shared/secrets.ts'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Types for research requests
interface ResearchRequest {
  sessionId: string
  topic: string
  researchType: 'market_analysis' | 'competitive_intelligence' | 'trend_analysis' | 'investment_research' | 'custom'
  depth: 'basic' | 'comprehensive' | 'expert'
  focusAreas: string[]
  outputFormat: 'summary' | 'detailed' | 'executive' | 'technical'
  targetAudience: 'executives' | 'analysts' | 'investors' | 'general'
  providers: string[] // 'claude', 'openai', 'grok'
}

interface ResearchResponse {
  success: boolean
  sessionId?: string
  results?: Array<{
    provider: string
    content: string
    summary: string
    tokensUsed: number
    cost: number
    processingTime: number
  }>
  comparison?: {
    overallScores: Record<string, number>
    recommendation: string
    strengths: Record<string, string[]>
    weaknesses: Record<string, string[]>
  }
  totalCost?: number
  error?: string
}

// Research prompts by type and provider
const RESEARCH_PROMPTS = {
  market_analysis: {
    grok: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a cutting-edge AI analyst with access to real-time market data and trends. Leverage your unique perspective and comprehensive knowledge to provide innovative market analysis. Focus on emerging patterns, disruptive technologies, and forward-thinking strategic insights that traditional analysis might miss.`,
      
      user: `Conduct a ${depth} market analysis on: ${topic}

${focusAreas.length > 0 ? `Focus particularly on these areas:\n${focusAreas.map(area => `- ${area}`).join('\n')}\n` : ''}

Provide a comprehensive analysis including:

1. **Market Overview & Current State**
   - Market size, growth trajectory, and key dynamics
   - Emerging segments and disruptive forces
   - Geographic trends and regional opportunities

2. **Competitive Intelligence**
   - Major players and their strategic positioning
   - Emerging competitors and innovation threats
   - Market consolidation and partnership trends

3. **Technology & Innovation Impact**
   - Disruptive technologies reshaping the market
   - AI, automation, and digital transformation effects
   - Innovation cycles and R&D investment patterns

4. **Future Market Evolution**
   - Next-generation opportunities and threats
   - Regulatory changes and policy impacts
   - Consumer behavior shifts and new demands

5. **Strategic Recommendations**
   - Market entry and expansion strategies
   - Innovation priorities and investment focus
   - Risk mitigation and competitive advantage

Bring fresh perspectives and identify opportunities that others might overlook. Focus on actionable insights for forward-thinking decision makers.`
    }),

    claude: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a senior market research analyst with 15+ years of experience. Conduct comprehensive market analysis with the following expertise areas:

- Market sizing and segmentation
- Competitive landscape analysis  
- Trend identification and impact assessment
- Growth opportunity evaluation
- Risk factor analysis
- Consumer behavior insights
- Industry dynamics and regulatory environment

Provide structured, data-driven analysis that would be valuable for business executives and strategic decision-making.`,
      
      user: `Conduct a ${depth} market analysis on: ${topic}

${focusAreas.length > 0 ? `Focus particularly on these areas:\n${focusAreas.map(area => `- ${area}`).join('\n')}\n` : ''}

Please provide a comprehensive analysis including:

1. **Market Overview & Size**
   - Current market size and growth trajectory
   - Key market segments and their dynamics
   - Geographic distribution and regional variations

2. **Competitive Landscape**
   - Major players and market share analysis
   - Competitive positioning and differentiation strategies
   - Emerging competitors and disruptors

3. **Market Trends & Drivers**
   - Current trends shaping the market
   - Key growth drivers and inhibitors
   - Technology impacts and innovation patterns

4. **Opportunities & Challenges**
   - Market gaps and unmet needs
   - Growth opportunities for new entrants
   - Regulatory and operational challenges

5. **Future Outlook**
   - 3-5 year market projections
   - Scenario analysis and potential disruptions
   - Strategic recommendations

Structure your response with clear headings and provide specific, actionable insights throughout.`
    }),
    
    openai: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are an expert market research consultant specializing in business intelligence and strategic market analysis. Your analysis should be thorough, data-driven, and actionable for business leaders.`,
      
      user: `Please conduct a ${depth} market research analysis on: ${topic}

${focusAreas.length > 0 ? `Key focus areas: ${focusAreas.join(', ')}\n` : ''}

Provide a comprehensive analysis covering:

**Market Fundamentals:**
- Market definition, scope, and boundaries
- Current market size, growth rates, and projections
- Value chain analysis and key stakeholders

**Industry Structure:**
- Competitive intensity and market concentration
- Barriers to entry and exit
- Supplier and buyer power dynamics

**Strategic Analysis:**
- SWOT analysis for the overall market
- Porter's Five Forces assessment
- Market positioning opportunities

**Innovation & Technology:**
- Technology trends and their market impact
- Digital transformation implications
- R&D investment patterns and innovation cycles

**Financial & Investment Perspective:**
- Market valuation trends and multiples
- Investment flows and funding patterns
- M&A activity and consolidation trends

**Actionable Recommendations:**
- Strategic recommendations for market participants
- Entry strategies for new players
- Risk mitigation approaches

Provide detailed insights with logical reasoning and clear structure throughout your analysis.`
    })
  },

  competitive_intelligence: {
    grok: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are an advanced competitive intelligence specialist with real-time data access and pattern recognition capabilities. Provide cutting-edge competitive analysis that identifies emerging threats, hidden opportunities, and strategic blind spots that traditional analysis often misses.`,
      
      user: `Conduct ${depth} competitive intelligence research on: ${topic}

${focusAreas.length > 0 ? `Focus on these competitive aspects:\n${focusAreas.map(area => `- ${area}`).join('\n')}\n` : ''}

Deliver comprehensive competitive intelligence including:

1. **Next-Generation Competitive Landscape**
   - Emerging disruptors and stealth competitors
   - Cross-industry competitive threats
   - Platform and ecosystem competition dynamics

2. **Advanced Competitor Profiling**
   - AI-driven competitive capabilities analysis
   - Innovation pipelines and R&D investments
   - Strategic partnerships and ecosystem positioning

3. **Competitive Technology Intelligence**
   - Technology moats and competitive advantages
   - AI/ML competitive capabilities
   - Digital transformation competitive positioning

4. **Future Competitive Scenarios**
   - Emerging competitive battlegrounds
   - Disruption scenarios and defensive strategies
   - New business model threats and opportunities

5. **Strategic Intelligence Insights**
   - Competitive gaps and whitespace opportunities
   - Early warning signals for competitive threats
   - Next-generation competitive advantage strategies

Focus on forward-looking intelligence that anticipates competitive moves before they happen.`
    }),

    claude: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a competitive intelligence specialist with expertise in strategic analysis, business intelligence, and competitive positioning. Provide thorough competitive assessments that help companies understand their competitive landscape and develop strategic advantages.`,
      
      user: `Conduct ${depth} competitive intelligence research on: ${topic}

${focusAreas.length > 0 ? `Focus on these competitive aspects:\n${focusAreas.map(area => `- ${area}`).join('\n')}\n` : ''}

Deliver comprehensive competitive intelligence including:

1. **Competitive Landscape Mapping**
   - Direct and indirect competitors identification
   - Market positioning matrix
   - Competitive hierarchy and tier analysis

2. **Competitor Profiling**
   - Key player profiles (strengths, weaknesses, strategies)
   - Financial performance and market share
   - Leadership teams and organizational capabilities

3. **Strategic Analysis**
   - Competitive strategies and business models
   - Product/service differentiation approaches
   - Pricing strategies and value propositions

4. **Market Dynamics**
   - Competitive intensity assessment
   - Market concentration and fragmentation
   - New entrant threats and substitute products

5. **Intelligence Insights**
   - Competitive gaps and opportunities
   - Strategic recommendations for competitive advantage
   - Early warning indicators for competitive threats

Focus on actionable intelligence that can inform strategic decision-making.`
    }),
    
    openai: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a strategic analyst specializing in competitive intelligence and business strategy. Provide comprehensive competitive analysis that enables informed strategic decision-making.`,
      
      user: `Generate ${depth} competitive intelligence on: ${topic}

${focusAreas.length > 0 ? `Priority focus areas: ${focusAreas.join(', ')}\n` : ''}

Structure your competitive intelligence analysis as follows:

**Competitor Identification & Mapping:**
- Primary, secondary, and tertiary competitors
- Competitive grouping and strategic clusters
- Market share distribution and dynamics

**Strategic Positioning Analysis:**
- Competitive positioning map
- Value proposition differentiation
- Target customer segments and positioning strategies

**Operational Intelligence:**
- Business model analysis and revenue streams
- Operational capabilities and core competencies
- Supply chain and partnership strategies

**Financial & Performance Metrics:**
- Revenue, profitability, and growth trends
- Investment priorities and capital allocation
- Financial health and competitive sustainability

**Strategic Behavior Patterns:**
- Historical strategic moves and patterns
- Innovation approaches and R&D focus
- Market expansion and acquisition strategies

**Competitive Threats & Opportunities:**
- Emerging competitive threats
- Market gaps and competitive blind spots
- Strategic recommendations for competitive advantage

Provide specific, evidence-based insights that can guide strategic planning and competitive responses.`
    })
  },

  investment_research: {
    grok: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a next-generation investment analyst with access to real-time market data, alternative data sources, and advanced analytical capabilities. Provide cutting-edge investment research that identifies emerging opportunities and risks before they become mainstream consensus.`,
      
      user: `Conduct ${depth} investment research analysis on: ${topic}

${focusAreas.length > 0 ? `Key investment focus areas:\n${focusAreas.map(area => `- ${area}`).join('\n')}\n` : ''}

Provide comprehensive investment research covering:

1. **Next-Generation Investment Thesis**
   - Disruptive value creation opportunities
   - AI/technology-driven competitive advantages
   - Platform economics and network effects analysis

2. **Advanced Financial Intelligence**
   - Alternative data insights and signals
   - Real-time financial health indicators
   - Cash flow predictability and sustainability

3. **Forward-Looking Valuation Framework**
   - Dynamic valuation models incorporating technology disruption
   - Option value and asymmetric return potential
   - Scenario-based valuation with AI/automation impacts

4. **Emerging Risk Assessment**
   - Technology disruption and obsolescence risks
   - ESG and regulatory transformation risks
   - Cyber security and operational resilience risks

5. **Strategic Investment Conclusion**
   - Investment recommendation with conviction levels
   - Catalyst timeline and value inflection points
   - Portfolio construction and position sizing insights

Focus on uncovering investment opportunities and risks that traditional analysis might miss. Emphasize forward-looking insights and asymmetric risk-return profiles.`
    }),

    claude: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a senior investment analyst with expertise in equity research, valuation, and investment strategy. Provide thorough investment analysis that helps investors make informed decisions based on fundamental and strategic analysis.`,
      
      user: `Conduct ${depth} investment research analysis on: ${topic}

${focusAreas.length > 0 ? `Key investment focus areas:\n${focusAreas.map(area => `- ${area}`).join('\n')}\n` : ''}

Provide comprehensive investment research covering:

1. **Investment Overview**
   - Investment thesis and key value drivers
   - Business model and competitive advantages
   - Market position and growth prospects

2. **Financial Analysis**
   - Revenue growth drivers and sustainability
   - Profitability trends and margin analysis
   - Balance sheet strength and capital structure

3. **Valuation Assessment**
   - Multiple valuation approaches (DCF, comparable companies, precedent transactions)
   - Key valuation metrics and multiples
   - Price targets and valuation sensitivity

4. **Risk Analysis**
   - Business and operational risks
   - Market and competitive risks
   - Financial and regulatory risks

5. **Investment Recommendation**
   - Buy/Hold/Sell recommendation with rationale
   - Key catalysts and value inflection points
   - Monitoring metrics and key performance indicators

Focus on providing actionable investment insights with clear risk-return analysis.`
    }),
    
    openai: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are an experienced investment research analyst providing comprehensive investment analysis and recommendations for institutional and individual investors.`,
      
      user: `Prepare ${depth} investment research on: ${topic}

${focusAreas.length > 0 ? `Investment focus priorities: ${focusAreas.join(', ')}\n` : ''}

Structure your investment research as follows:

**Investment Thesis:**
- Core investment proposition and value creation story
- Key competitive advantages and moat analysis
- Long-term growth prospects and sustainability

**Business Fundamentals:**
- Business model analysis and revenue quality
- Management team assessment and track record
- Corporate governance and capital allocation

**Financial Analysis:**
- Historical financial performance trends
- Profitability metrics and efficiency ratios
- Cash flow generation and capital requirements

**Valuation Framework:**
- Intrinsic value assessment using multiple methodologies
- Peer group comparison and relative valuation
- Scenario analysis and sensitivity testing

**Risk Assessment:**
- Key business and execution risks
- Market, regulatory, and macro-economic risks
- Downside scenarios and risk mitigation factors

**Investment Conclusion:**
- Clear investment recommendation and price target
- Key catalysts and timeline for value realization
- Portfolio fit and position sizing considerations

Provide detailed analysis with quantitative support and clear investment rationale.`
    })
  },

  trend_analysis: {
    grok: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a cutting-edge trend analyst and futurist with access to real-time data streams, social signals, and emerging patterns. Identify trends before they become obvious, with special focus on AI, technology, and societal shifts that will shape the future.`,
      
      user: `Conduct ${depth} trend analysis on: ${topic}

${focusAreas.length > 0 ? `Focus on these trend dimensions:\n${focusAreas.map(area => `- ${area}`).join('\n')}\n` : ''}

Provide comprehensive trend analysis including:

1. **Emerging Trend Detection**
   - Early-stage trends and weak signals
   - AI and technology trend intersections
   - Cultural and behavioral pattern shifts

2. **Trend Acceleration Factors**
   - Technology enablers and catalysts
   - Generational adoption patterns
   - Platform effects and viral spread dynamics

3. **Cross-Trend Synthesis**
   - Mega-trend convergence and amplification
   - Countertrend forces and resistance points
   - Unexpected trend combinations and outcomes

4. **Future Impact Modeling**
   - Exponential change scenarios and inflection points
   - Disruption timelines and adoption curves
   - Societal and economic transformation patterns

5. **Strategic Future Positioning**
   - Next-generation opportunity identification
   - Trend-based innovation strategies
   - Future-proofing and adaptation frameworks

Focus on trends that others are missing and provide actionable intelligence for staying ahead of change. Emphasize non-linear and exponential trend dynamics.`
    }),

    claude: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a trend analyst and futurist with expertise in identifying, analyzing, and projecting market trends, technological developments, and societal changes. Provide insightful trend analysis that helps organizations understand and prepare for future developments.`,
      
      user: `Conduct ${depth} trend analysis on: ${topic}

${focusAreas.length > 0 ? `Focus on these trend dimensions:\n${focusAreas.map(area => `- ${area}`).join('\n')}\n` : ''}

Provide comprehensive trend analysis including:

1. **Current Trend Landscape**
   - Major trends currently shaping the space
   - Trend maturity stages and adoption curves
   - Interconnections between related trends

2. **Trend Drivers & Enablers**
   - Key forces driving trend development
   - Technology enablers and infrastructure
   - Social, economic, and regulatory catalysts

3. **Impact Analysis**
   - Short-term implications (1-2 years)
   - Medium-term transformations (3-5 years)
   - Long-term structural changes (5+ years)

4. **Stakeholder Implications**
   - Impact on different industry players
   - Consumer behavior changes
   - Regulatory and policy implications

5. **Future Projections**
   - Trend evolution scenarios
   - Potential disruptions and inflection points
   - Strategic recommendations for trend adaptation

Focus on providing forward-looking insights that enable proactive strategic planning.`
    }),
    
    openai: (topic: string, depth: string, focusAreas: string[]) => ({
      system: `You are a strategic trend researcher specializing in identifying emerging patterns, analyzing their implications, and providing actionable insights for future planning.`,
      
      user: `Analyze ${depth} trends related to: ${topic}

${focusAreas.length > 0 ? `Trend focus areas: ${focusAreas.join(', ')}\n` : ''}

Structure your trend analysis as follows:

**Trend Identification & Classification:**
- Emerging, developing, and mature trends
- Trend categorization (technology, social, economic, environmental)
- Trend significance and potential impact scoring

**Trend Dynamics:**
- Trend lifecycle stage and momentum
- Key drivers and accelerating factors
- Barriers and resistance points

**Cross-Trend Analysis:**
- Trend intersections and synergies
- Compound effects and trend amplification
- Conflicting trends and resolution paths

**Impact Modeling:**
- Industry transformation scenarios
- Consumer and market behavior changes
- Economic and business model implications

**Strategic Implications:**
- Opportunities and threats identification
- Strategic response options and timing
- Innovation and investment priorities

**Future Scenarios:**
- Best case, base case, and worst case projections
- Uncertainty factors and wild card events
- Monitoring indicators and early warning signals

Provide actionable trend intelligence that supports strategic decision-making and future preparedness.`
    })
  }
}

// Helper function to call individual research functions
async function callResearchFunction(provider: string, prompt: any): Promise<any> {
  try {
    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-research-${provider}`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt: prompt.system,
        userPrompt: prompt.user,
        maxTokens: 4000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`${provider} research failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    throw new Error(`Failed to call ${provider} research: ${error.message}`)
  }
}

// Generate comparison analysis using Claude
async function generateComparison(results: any[], topic: string): Promise<any> {
  if (results.length < 2) {
    return null
  }

  const claudeApiKey = await getSecretWithRetry('CLAUDE_API_KEY')
  if (!claudeApiKey) {
    throw new Error('Claude API key not available for comparison')
  }

  const comparisonPrompt = {
    system: `You are an expert research analyst specializing in comparative analysis. Your task is to objectively compare and evaluate research outputs from different AI systems, identifying their relative strengths and weaknesses.`,
    
    user: `Please analyze and compare the following research outputs on "${topic}":

**Research Output A (Claude):**
${results.find(r => r.provider === 'claude')?.content || 'Not available'}

**Research Output B (OpenAI):**
${results.find(r => r.provider === 'openai')?.content || 'Not available'}

Provide a structured comparison including:

1. **Quality Assessment (rate 1-10 for each)**
   - Accuracy and factual correctness
   - Depth and comprehensiveness
   - Relevance and focus
   - Clarity and readability
   - Innovation and unique insights

2. **Strengths Analysis**
   - What each analysis does exceptionally well
   - Unique perspectives or insights provided
   - Superior analysis in specific areas

3. **Weaknesses Analysis**
   - Areas where each analysis could be stronger
   - Missing elements or gaps
   - Less effective sections or approaches

4. **Overall Recommendation**
   - Which analysis is more valuable overall and why
   - Best use cases for each analysis
   - How to combine insights from both for optimal value

Respond in JSON format with clear numerical scores and detailed explanations.`
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${claudeApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': claudeApiKey
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.2,
      system: comparisonPrompt.system,
      messages: [{ role: 'user', content: comparisonPrompt.user }]
    }),
  })

  if (!response.ok) {
    throw new Error('Comparison generation failed')
  }

  const data = await response.json()
  try {
    const comparisonText = data.content[0].text.trim()
    const jsonMatch = comparisonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return { raw_comparison: comparisonText }
  } catch (error) {
    return { raw_comparison: data.content[0].text }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestBody: ResearchRequest = await req.json()
    const { sessionId, topic, researchType, depth, focusAreas, providers } = requestBody

    // Validate request
    if (!sessionId || !topic || !researchType || !providers || providers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId, topic, researchType, providers' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate providers
    const validProviders = ['claude', 'openai', 'grok']
    const invalidProviders = providers.filter(p => !validProviders.includes(p))
    if (invalidProviders.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid providers: ${invalidProviders.join(', ')}` }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get research prompts for the specified type
    const promptTemplate = RESEARCH_PROMPTS[researchType]
    if (!promptTemplate) {
      return new Response(
        JSON.stringify({ error: `Unsupported research type: ${researchType}` }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Execute research concurrently
    const startTime = Date.now()
    const researchPromises = providers.map(async (provider) => {
      try {
        const prompt = promptTemplate[provider](topic, depth, focusAreas || [])
        const result = await callResearchFunction(provider, prompt)
        
        return {
          provider,
          content: result.content || result.data?.content || '',
          summary: result.summary || result.data?.summary || '',
          tokensUsed: result.tokensUsed || result.data?.tokensUsed || 0,
          cost: result.cost || result.data?.cost || 0,
          processingTime: result.processingTime || 0
        }
      } catch (error) {
        console.error(`${provider} research error:`, error)
        return {
          provider,
          content: '',
          summary: '',
          tokensUsed: 0,
          cost: 0,
          processingTime: 0,
          error: error.message
        }
      }
    })

    const results = await Promise.all(researchPromises)
    const processingTime = Date.now() - startTime

    // Generate comparison if we have multiple successful results
    const successfulResults = results.filter(r => r.content && !r.error)
    let comparison = null
    
    if (successfulResults.length >= 2) {
      try {
        comparison = await generateComparison(successfulResults, topic)
      } catch (error) {
        console.error('Comparison generation error:', error)
      }
    }

    // Calculate total cost
    const totalCost = results.reduce((sum, result) => sum + (result.cost || 0), 0)

    // Save results to database
    try {
      for (const result of results) {
        await supabaseAdmin
          .from('research_results')
          .insert({
            session_id: sessionId,
            provider_name: result.provider,
            content: result.content,
            summary: result.summary,
            tokens_used: result.tokensUsed,
            cost_usd: result.cost,
            processing_time_ms: result.processingTime,
            error_message: result.error || null,
            created_at: new Date().toISOString(),
            user_id: user.id
          })
      }

      // Update session status
      await supabaseAdmin
        .from('research_sessions')
        .update({
          status: successfulResults.length > 0 ? 'completed' : 'error',
          total_cost_usd: totalCost,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

    } catch (dbError) {
      console.error('Database save error:', dbError)
      // Continue with response even if DB save fails
    }

    // Mark secrets as initialized
    markSecretsInitialized()

    // Return response
    const response: ResearchResponse = {
      success: true,
      sessionId,
      results: results.map(r => ({
        provider: r.provider,
        content: r.content,
        summary: r.summary,
        tokensUsed: r.tokensUsed,
        cost: r.cost,
        processingTime: r.processingTime
      })),
      comparison,
      totalCost
    }

    return new Response(
      JSON.stringify(response), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Parallel research function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})