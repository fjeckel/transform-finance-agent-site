// Feature flag system for Start Here section gradual rollout
// This allows for A/B testing and gradual user rollout

interface FeatureFlag {
  enabled: boolean;
  rolloutPercentage: number;
  variant?: 'default' | 'compact' | 'featured';
  enabledForUsers?: string[];
  disabledForUsers?: string[];
  description?: string;
}

interface StartHereFeatureFlags {
  startHereSection: FeatureFlag;
  userJourneyModal: FeatureFlag;
  emailCapture: FeatureFlag;
  analyticsTracking: FeatureFlag;
  contentRecommendations: FeatureFlag;
}

// Default feature flags configuration
const defaultFeatureFlags: StartHereFeatureFlags = {
  startHereSection: {
    enabled: true,
    rolloutPercentage: 100, // Start with 100% for development, reduce for production rollout
    variant: 'default',
    description: 'Main Start Here section visibility'
  },
  userJourneyModal: {
    enabled: true,
    rolloutPercentage: 100,
    description: 'User onboarding journey modal'
  },
  emailCapture: {
    enabled: true,
    rolloutPercentage: 100,
    description: 'Email capture and newsletter signup'
  },
  analyticsTracking: {
    enabled: true,
    rolloutPercentage: 100,
    description: 'Analytics event tracking'
  },
  contentRecommendations: {
    enabled: true,
    rolloutPercentage: 100,
    description: 'Dynamic content recommendations'
  }
};

class StartHereFeatureManager {
  private flags: StartHereFeatureFlags;
  private userHash: number;

  constructor() {
    this.flags = this.loadFeatureFlags();
    this.userHash = this.generateUserHash();
  }

  /**
   * Check if a feature is enabled for the current user
   */
  isEnabled(feature: keyof StartHereFeatureFlags): boolean {
    const flag = this.flags[feature];
    
    if (!flag.enabled) {
      return false;
    }

    // Check if user is explicitly disabled
    if (flag.disabledForUsers && flag.disabledForUsers.includes(this.getUserId())) {
      return false;
    }

    // Check if user is explicitly enabled
    if (flag.enabledForUsers && flag.enabledForUsers.includes(this.getUserId())) {
      return true;
    }

    // Check rollout percentage
    return this.userHash <= flag.rolloutPercentage;
  }

  /**
   * Get feature variant if applicable
   */
  getVariant(feature: keyof StartHereFeatureFlags): string {
    if (!this.isEnabled(feature)) {
      return 'disabled';
    }

    return this.flags[feature].variant || 'default';
  }

  /**
   * Get all enabled features for debugging
   */
  getEnabledFeatures(): Partial<StartHereFeatureFlags> {
    const enabled: Partial<StartHereFeatureFlags> = {};
    
    Object.keys(this.flags).forEach(key => {
      const featureKey = key as keyof StartHereFeatureFlags;
      if (this.isEnabled(featureKey)) {
        enabled[featureKey] = this.flags[featureKey];
      }
    });

    return enabled;
  }

  /**
   * Update feature flags (for admin control)
   */
  updateFlags(newFlags: Partial<StartHereFeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
    this.saveFeatureFlags();
  }

  /**
   * Reset to default flags
   */
  resetToDefaults(): void {
    this.flags = { ...defaultFeatureFlags };
    this.saveFeatureFlags();
  }

  /**
   * Load feature flags from localStorage or environment
   */
  private loadFeatureFlags(): StartHereFeatureFlags {
    // Try to load from localStorage for admin overrides
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('startHere_featureFlags');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { ...defaultFeatureFlags, ...parsed };
        } catch (e) {
          console.warn('Failed to parse stored feature flags:', e);
        }
      }
    }

    // Load from environment variables in production
    if (typeof process !== 'undefined' && process.env) {
      const envFlags: Partial<StartHereFeatureFlags> = {};
      
      // Example: REACT_APP_START_HERE_SECTION_ENABLED=false
      if (process.env.REACT_APP_START_HERE_SECTION_ENABLED !== undefined) {
        envFlags.startHereSection = {
          ...defaultFeatureFlags.startHereSection,
          enabled: process.env.REACT_APP_START_HERE_SECTION_ENABLED === 'true'
        };
      }

      // Example: REACT_APP_START_HERE_ROLLOUT_PERCENTAGE=50
      if (process.env.REACT_APP_START_HERE_ROLLOUT_PERCENTAGE !== undefined) {
        const percentage = parseInt(process.env.REACT_APP_START_HERE_ROLLOUT_PERCENTAGE, 10);
        if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
          envFlags.startHereSection = {
            ...defaultFeatureFlags.startHereSection,
            rolloutPercentage: percentage
          };
        }
      }

      return { ...defaultFeatureFlags, ...envFlags };
    }

    return defaultFeatureFlags;
  }

  /**
   * Save feature flags to localStorage
   */
  private saveFeatureFlags(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('startHere_featureFlags', JSON.stringify(this.flags));
    }
  }

  /**
   * Generate a consistent hash for the user for rollout percentage
   */
  private generateUserHash(): number {
    const userId = this.getUserId();
    
    // Simple hash function for consistent rollout
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to percentage (0-100)
    return Math.abs(hash) % 100 + 1;
  }

  /**
   * Get user identifier (session ID, user ID, or fallback)
   */
  private getUserId(): string {
    // Try session storage first
    if (typeof window !== 'undefined') {
      let userId = sessionStorage.getItem('ft_session_id');
      
      if (!userId) {
        // Generate a session ID if none exists
        userId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('ft_session_id', userId);
      }
      
      return userId;
    }

    // Fallback for server-side rendering
    return 'anonymous_user';
  }

  /**
   * Log feature flag status for debugging
   */
  logStatus(): void {
    console.log('🏁 Start Here Feature Flags Status:');
    Object.entries(this.flags).forEach(([key, flag]) => {
      const enabled = this.isEnabled(key as keyof StartHereFeatureFlags);
      console.log(`  ${key}: ${enabled ? '✅' : '❌'} (rollout: ${flag.rolloutPercentage}%)`);
    });
  }
}

// Export singleton instance
export const startHereFeatureManager = new StartHereFeatureManager();

// Convenience hook for React components
export const useStartHereFeatures = () => {
  return {
    isEnabled: (feature: keyof StartHereFeatureFlags) => startHereFeatureManager.isEnabled(feature),
    getVariant: (feature: keyof StartHereFeatureFlags) => startHereFeatureManager.getVariant(feature),
    getEnabledFeatures: () => startHereFeatureManager.getEnabledFeatures()
  };
};

// Admin functions for testing/debugging
if (typeof window !== 'undefined') {
  (window as any).startHereFeatureManager = startHereFeatureManager;
  console.log('💡 Access feature manager via window.startHereFeatureManager');
}