// Security service for AI Research Comparator system

import { supabase } from '@/integrations/supabase/client';

export interface SecurityPolicy {
  maxTokensPerRequest: number;
  maxRequestsPerHour: number;
  maxCostPerRequest: number;
  maxCostPerMonth: number;
  allowedResearchTypes: string[];
  requiresApproval: boolean;
  ipWhitelist?: string[];
  userRoleRequired?: string;
}

export interface SecurityViolation {
  type: 'quota_exceeded' | 'suspicious_activity' | 'unauthorized_access' | 'content_violation' | 'rate_limit_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserSecurityProfile {
  userId: string;
  riskScore: number; // 0-100
  violations: SecurityViolation[];
  isBlocked: boolean;
  blockReason?: string;
  blockExpiresAt?: string;
  trustedUser: boolean;
  premiumUser: boolean;
  lastActivity: string;
}

export interface ContentSecurityCheck {
  isAllowed: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high';
  flaggedTerms?: string[];
  recommendations?: string[];
}

class ResearchSecurityService {
  // Default security policies by user role
  private securityPolicies: Record<string, SecurityPolicy> = {
    guest: {
      maxTokensPerRequest: 4000,
      maxRequestsPerHour: 10,
      maxCostPerRequest: 0.20,
      maxCostPerMonth: 10.00,
      allowedResearchTypes: ['custom', 'trend_analysis'],
      requiresApproval: false
    },
    member: {
      maxTokensPerRequest: 8000,
      maxRequestsPerHour: 50,
      maxCostPerRequest: 1.00,
      maxCostPerMonth: 50.00,
      allowedResearchTypes: ['custom', 'trend_analysis', 'market_research', 'competitive_analysis'],
      requiresApproval: false
    },
    premium: {
      maxTokensPerRequest: 16000,
      maxRequestsPerHour: 200,
      maxCostPerRequest: 5.00,
      maxCostPerMonth: 200.00,
      allowedResearchTypes: [
        'custom', 'trend_analysis', 'market_research', 'competitive_analysis',
        'investment_analysis', 'risk_assessment', 'comparative_analysis'
      ],
      requiresApproval: false
    },
    admin: {
      maxTokensPerRequest: 32000,
      maxRequestsPerHour: 1000,
      maxCostPerRequest: 20.00,
      maxCostPerMonth: 1000.00,
      allowedResearchTypes: [
        'custom', 'trend_analysis', 'market_research', 'competitive_analysis',
        'investment_analysis', 'risk_assessment', 'comparative_analysis'
      ],
      requiresApproval: false
    }
  };

  // Content security patterns
  private restrictedPatterns = [
    // Personal identification patterns
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card
    /\b[\w\.-]+@[\w\.-]+\.\w+\b/g, // Email addresses
    
    // Financial patterns that might be sensitive
    /\b(account\s+number|routing\s+number|pin\s+code)\b/gi,
    
    // Potentially harmful content
    /\b(hack|exploit|manipulate\s+market|insider\s+trading)\b/gi,
    
    // API keys or secrets
    /\b[A-Za-z0-9]{20,}\b/g
  ];

  private suspiciousPatterns = [
    /\b(pump\s+and\s+dump|short\s+squeeze|market\s+manipulation)\b/gi,
    /\b(bypass|circumvent|evade)\b/gi,
    /\b(unlimited|infinite|maximum|exploit)\b/gi
  ];

  /**
   * Get security policy for user
   */
  async getUserSecurityPolicy(userId?: string): Promise<SecurityPolicy> {
    if (!userId) {
      return this.securityPolicies.guest;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!profile) {
        return this.securityPolicies.guest;
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const { data: quota } = await supabase
        .from('user_research_quotas')
        .select('is_premium')
        .eq('user_id', userId)
        .single();

      // Determine policy based on role and premium status
      if (userRole?.role === 'admin') {
        return this.securityPolicies.admin;
      } else if (quota?.is_premium) {
        return this.securityPolicies.premium;
      } else if (userRole?.role === 'member') {
        return this.securityPolicies.member;
      } else {
        return this.securityPolicies.guest;
      }

    } catch (error) {
      console.error('Error getting user security policy:', error);
      return this.securityPolicies.guest;
    }
  }

  /**
   * Validate research request against security policies
   */
  async validateResearchRequest(
    userId: string,
    request: {
      maxTokens: number;
      researchType: string;
      prompt: string;
      estimatedCost: number;
    }
  ): Promise<{
    isAllowed: boolean;
    violations: string[];
    warnings: string[];
  }> {
    const policy = await this.getUserSecurityPolicy(userId);
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check token limits
    if (request.maxTokens > policy.maxTokensPerRequest) {
      violations.push(`Token limit exceeded: ${request.maxTokens} > ${policy.maxTokensPerRequest}`);
    }

    // Check cost limits
    if (request.estimatedCost > policy.maxCostPerRequest) {
      violations.push(`Cost limit exceeded: $${request.estimatedCost} > $${policy.maxCostPerRequest}`);
    }

    // Check research type permissions
    if (!policy.allowedResearchTypes.includes(request.researchType)) {
      violations.push(`Research type '${request.researchType}' not allowed for your account level`);
    }

    // Check hourly request limits
    const hourlyUsage = await this.getHourlyRequestCount(userId);
    if (hourlyUsage >= policy.maxRequestsPerHour) {
      violations.push(`Hourly request limit exceeded: ${hourlyUsage} >= ${policy.maxRequestsPerHour}`);
    }

    // Check monthly cost limits
    const monthlyCost = await this.getMonthlySpending(userId);
    if (monthlyCost + request.estimatedCost > policy.maxCostPerMonth) {
      violations.push(`Monthly cost limit would be exceeded: $${(monthlyCost + request.estimatedCost).toFixed(2)} > $${policy.maxCostPerMonth}`);
    }

    // Content security check
    const contentCheck = this.checkContentSecurity(request.prompt);
    if (!contentCheck.isAllowed) {
      violations.push(`Content security violation: ${contentCheck.reason}`);
    }

    if (contentCheck.riskLevel === 'medium') {
      warnings.push('Content contains potentially sensitive information');
    }

    return {
      isAllowed: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Check content for security violations
   */
  checkContentSecurity(content: string): ContentSecurityCheck {
    const flaggedTerms: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const recommendations: string[] = [];

    // Check for restricted patterns
    for (const pattern of this.restrictedPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        flaggedTerms.push(...matches);
        riskLevel = 'high';
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        flaggedTerms.push(...matches);
        if (riskLevel !== 'high') {
          riskLevel = 'medium';
        }
      }
    }

    // Check content length for potential abuse
    if (content.length > 50000) {
      recommendations.push('Consider breaking down very long prompts into smaller requests');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Check for excessive special characters (potential encoding attacks)
    const specialCharCount = (content.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const specialCharRatio = specialCharCount / content.length;
    if (specialCharRatio > 0.3) {
      recommendations.push('Content contains high ratio of special characters');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    return {
      isAllowed: riskLevel !== 'high',
      reason: flaggedTerms.length > 0 ? `Flagged terms detected: ${flaggedTerms.slice(0, 3).join(', ')}` : undefined,
      riskLevel,
      flaggedTerms: flaggedTerms.slice(0, 10), // Limit to first 10
      recommendations
    };
  }

  /**
   * Log security violation
   */
  async logSecurityViolation(violation: Omit<SecurityViolation, 'timestamp'>): Promise<void> {
    const fullViolation: SecurityViolation = {
      ...violation,
      timestamp: new Date().toISOString()
    };

    try {
      // In a real implementation, you'd log this to a security events table
      console.warn('Security violation detected:', fullViolation);
      
      // Update user security profile
      if (violation.userId) {
        await this.updateUserSecurityProfile(violation.userId, fullViolation);
      }

      // For critical violations, consider immediate action
      if (violation.severity === 'critical' && violation.userId) {
        await this.blockUser(violation.userId, violation.description, '24h');
      }

    } catch (error) {
      console.error('Failed to log security violation:', error);
    }
  }

  /**
   * Get user security profile
   */
  async getUserSecurityProfile(userId: string): Promise<UserSecurityProfile> {
    // In a real implementation, this would fetch from a security profiles table
    return {
      userId,
      riskScore: 0,
      violations: [],
      isBlocked: false,
      trustedUser: false,
      premiumUser: false,
      lastActivity: new Date().toISOString()
    };
  }

  /**
   * Update user security profile
   */
  private async updateUserSecurityProfile(userId: string, violation: SecurityViolation): Promise<void> {
    // In a real implementation, this would update the user's security profile
    // For now, we'll just log the violation
    console.log(`Updating security profile for user ${userId}:`, violation);
  }

  /**
   * Block user temporarily or permanently
   */
  async blockUser(userId: string, reason: string, duration?: string): Promise<void> {
    const expiresAt = duration ? this.calculateBlockExpiry(duration) : undefined;
    
    // In a real implementation, this would update the user's block status
    console.warn(`Blocking user ${userId}: ${reason}. Expires: ${expiresAt || 'permanent'}`);
    
    await this.logSecurityViolation({
      type: 'unauthorized_access',
      severity: 'critical',
      description: `User blocked: ${reason}`,
      userId
    });
  }

  /**
   * Check if user is currently blocked
   */
  async isUserBlocked(userId: string): Promise<{
    isBlocked: boolean;
    reason?: string;
    expiresAt?: string;
  }> {
    // In a real implementation, this would check the user's block status
    return { isBlocked: false };
  }

  /**
   * Get hourly request count for user
   */
  private async getHourlyRequestCount(userId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('research_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);

    return count || 0;
  }

  /**
   * Get monthly spending for user
   */
  private async getMonthlySpending(userId: string): Promise<number> {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    
    const { data: costs } = await supabase
      .from('research_costs')
      .select('cost_usd')
      .eq('user_id', userId)
      .gte('created_at', monthStart);

    return costs?.reduce((sum, cost) => sum + Number(cost.cost_usd || 0), 0) || 0;
  }

  /**
   * Calculate block expiry time
   */
  private calculateBlockExpiry(duration: string): string {
    const now = new Date();
    const match = duration.match(/^(\d+)([hdwm])$/);
    
    if (!match) {
      throw new Error('Invalid duration format. Use format like "24h", "7d", "1w", "1m"');
    }

    const amount = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h':
        now.setHours(now.getHours() + amount);
        break;
      case 'd':
        now.setDate(now.getDate() + amount);
        break;
      case 'w':
        now.setDate(now.getDate() + amount * 7);
        break;
      case 'm':
        now.setMonth(now.getMonth() + amount);
        break;
    }

    return now.toISOString();
  }

  /**
   * Sanitize prompt content
   */
  sanitizePrompt(prompt: string): string {
    // Remove potential PII
    let sanitized = prompt;
    
    // Replace email addresses with placeholder
    sanitized = sanitized.replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL_REDACTED]');
    
    // Replace SSN patterns
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
    
    // Replace credit card patterns
    sanitized = sanitized.replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD_REDACTED]');
    
    // Replace potential API keys
    sanitized = sanitized.replace(/\b[A-Za-z0-9]{20,}\b/g, '[TOKEN_REDACTED]');
    
    return sanitized;
  }

  /**
   * Generate security audit report
   */
  async generateSecurityAudit(userId?: string): Promise<{
    totalViolations: number;
    violationsByType: Record<string, number>;
    riskScore: number;
    recommendations: string[];
    recentActivity: any[];
  }> {
    // In a real implementation, this would generate a comprehensive security audit
    return {
      totalViolations: 0,
      violationsByType: {},
      riskScore: 0,
      recommendations: [
        'Enable two-factor authentication',
        'Review and update your research quotas regularly',
        'Monitor your monthly spending to avoid unexpected charges'
      ],
      recentActivity: []
    };
  }

  /**
   * Validate API access patterns
   */
  async validateAPIUsagePattern(userId: string): Promise<{
    isNormalPattern: boolean;
    anomalies: string[];
    suspiciousActivity: boolean;
  }> {
    // In a real implementation, this would analyze usage patterns for anomalies
    return {
      isNormalPattern: true,
      anomalies: [],
      suspiciousActivity: false
    };
  }
}

// Singleton instance
export const researchSecurityService = new ResearchSecurityService();