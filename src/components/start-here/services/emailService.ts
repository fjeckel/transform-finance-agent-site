import { supabase } from '@/integrations/supabase/client';

export interface EmailSubscriptionData {
  email: string;
  pathId: string;
  source: 'start_here' | 'journey_completion' | 'path_selection';
  preferences?: {
    selectedPath?: string;
    role?: string;
    companySize?: string;
    experienceLevel?: string;
    goals?: string[];
    primaryChallenges?: string[];
  };
  sessionId: string;
  timestamp: string;
}

export interface EmailSubscriptionResult {
  success: boolean;
  message: string;
  subscriptionId?: string;
  error?: string;
}

class StartHereEmailService {
  /**
   * Subscribe user to newsletter with Start Here context
   */
  async subscribeToNewsletter(data: EmailSubscriptionData): Promise<EmailSubscriptionResult> {
    try {
      // 1. Store email subscription in database
      const { data: subscriptionRecord, error: dbError } = await supabase
        .from('start_here_user_preferences')
        .upsert({
          session_id: data.sessionId,
          selected_path: data.pathId,
          role: data.preferences?.role,
          company_size: data.preferences?.companySize as any,
          experience_level: data.preferences?.experienceLevel as any,
          goals: data.preferences?.goals || [],
          primary_challenges: data.preferences?.primaryChallenges || [],
          email_captured: true,
          newsletter_subscribed: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database subscription error:', dbError);
        return {
          success: false,
          message: 'Fehler beim Speichern der Anmeldung',
          error: dbError.message
        };
      }

      // 2. TODO: Integrate with actual email service (Mailchimp, ConvertKit, etc.)
      // For now, we'll simulate the API call and store locally
      const emailServiceResult = await this.simulateEmailServiceIntegration(data);

      if (!emailServiceResult.success) {
        return emailServiceResult;
      }

      // 3. Log analytics event
      await supabase.from('start_here_analytics').insert({
        event_type: 'email_captured',
        event_data: {
          email_captured: true,
          source: data.source,
          path_id: data.pathId,
          subscription_type: 'newsletter',
          user_preferences: data.preferences
        },
        path_id: data.pathId,
        session_id: data.sessionId,
        page_url: window.location.href,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Erfolgreich angemeldet! Du erhältst personalisierte Empfehlungen per Email.',
        subscriptionId: subscriptionRecord.id
      };

    } catch (error) {
      console.error('Email subscription error:', error);
      return {
        success: false,
        message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simulate email service integration
   * Replace this with actual email service integration
   */
  private async simulateEmailServiceIntegration(data: EmailSubscriptionData): Promise<EmailSubscriptionResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) { // 10% failure rate for testing
      return {
        success: false,
        message: 'Email-Service vorübergehend nicht verfügbar',
        error: 'Service temporarily unavailable'
      };
    }

    // Log for development purposes
    console.log('Email subscription (simulated):', {
      email: data.email,
      pathId: data.pathId,
      source: data.source,
      preferences: data.preferences,
      timestamp: data.timestamp
    });

    return {
      success: true,
      message: 'Email successfully added to newsletter',
      subscriptionId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Send personalized welcome email based on selected path
   */
  async sendWelcomeEmail(email: string, pathId: string, preferences: any): Promise<void> {
    // TODO: Implement welcome email with personalized content recommendations
    console.log('Welcome email would be sent:', { email, pathId, preferences });
  }

  /**
   * Update subscription preferences
   */
  async updatePreferences(sessionId: string, preferences: Partial<EmailSubscriptionData['preferences']>): Promise<EmailSubscriptionResult> {
    try {
      const { error } = await supabase
        .from('start_here_user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        return {
          success: false,
          message: 'Fehler beim Aktualisieren der Einstellungen',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Einstellungen erfolgreich aktualisiert'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Unerwarteter Fehler beim Aktualisieren',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get subscription status by session ID
   */
  async getSubscriptionStatus(sessionId: string) {
    const { data, error } = await supabase
      .from('start_here_user_preferences')
      .select('email_captured, newsletter_subscribed, selected_path, updated_at')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }
}

// Export singleton instance
export const startHereEmailService = new StartHereEmailService();