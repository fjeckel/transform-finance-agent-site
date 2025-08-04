import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface FeatureFlags {
  richTextEditor: boolean
  richTextEditorInsights: boolean
  richTextEditorEpisodes: boolean
  simplifiedForms: boolean
  contentMigration: boolean
}

const DEFAULT_FLAGS: FeatureFlags = {
  richTextEditor: false,
  richTextEditorInsights: false,
  richTextEditorEpisodes: false,
  simplifiedForms: false,
  contentMigration: false
}

// Admin emails that have access to all feature flags
const ADMIN_EMAILS = ['fjeckel@me.com']

/**
 * Hook to manage feature flags
 */
export const useFeatureFlags = () => {
  const { user } = useAuth()
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeatureFlags()
  }, [user])

  const loadFeatureFlags = async () => {
    try {
      // Load from localStorage first (for development/testing)
      const localFlags = localStorage.getItem('feature-flags')
      if (localFlags) {
        const parsedFlags = JSON.parse(localFlags)
        setFlags({ ...DEFAULT_FLAGS, ...parsedFlags })
      }

      // Admin users get all features enabled by default
      // Rich text editor disabled by default until loading issues are resolved
      if (user?.email && ADMIN_EMAILS.includes(user.email)) {
        setFlags(prev => ({
          ...prev,
          // richTextEditor: true,  // Disabled until loading issues fixed
          // richTextEditorInsights: true,
          // richTextEditorEpisodes: true,
          simplifiedForms: true,
          contentMigration: true
        }))
      }

      // In the future, you could load flags from Supabase or a feature flag service
      // const { data } = await supabase.from('feature_flags').select('*').eq('user_id', user?.id)
      
    } catch (error) {
      console.error('Failed to load feature flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFlag = (flag: keyof FeatureFlags, value: boolean) => {
    const newFlags = { ...flags, [flag]: value }
    setFlags(newFlags)
    
    // Save to localStorage for persistence
    localStorage.setItem('feature-flags', JSON.stringify(newFlags))
  }

  const resetFlags = () => {
    setFlags(DEFAULT_FLAGS)
    localStorage.removeItem('feature-flags')
  }

  const enableAllFlags = () => {
    const allEnabled = Object.keys(DEFAULT_FLAGS).reduce((acc, key) => {
      acc[key as keyof FeatureFlags] = true
      return acc
    }, {} as FeatureFlags)
    
    setFlags(allEnabled)
    localStorage.setItem('feature-flags', JSON.stringify(allEnabled))
  }

  return {
    flags,
    loading,
    updateFlag,
    resetFlags,
    enableAllFlags,
    isAdmin: user?.email && ADMIN_EMAILS.includes(user.email)
  }
}

/**
 * Hook to check if rich text editor should be used for a specific content type
 */
export const useRichTextEditor = (contentType: 'insights' | 'episodes') => {
  const { flags } = useFeatureFlags()
  
  if (!flags.richTextEditor) return false
  
  switch (contentType) {
    case 'insights':
      return flags.richTextEditorInsights
    case 'episodes':
      return flags.richTextEditorEpisodes
    default:
      return false
  }
}

/**
 * Hook to check if simplified forms should be used
 */
export const useSimplifiedForms = () => {
  const { flags } = useFeatureFlags()
  return flags.simplifiedForms
}

/**
 * Development-only component to toggle feature flags
 */
export const FeatureFlagDebugPanel: React.FC = () => {
  const { flags, updateFlag, resetFlags, enableAllFlags, isAdmin } = useFeatureFlags()

  // Only show in development or for admin users
  if (process.env.NODE_ENV !== 'development' && !isAdmin) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Feature Flags</h3>
        <div className="flex gap-1">
          <button
            onClick={enableAllFlags}
            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
          >
            All On
          </button>
          <button
            onClick={resetFlags}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {Object.entries(flags).map(([key, value]) => (
          <label key={key} className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => updateFlag(key as keyof FeatureFlags, e.target.checked)}
              className="w-3 h-3"
            />
            <span className="flex-1 truncate">{key}</span>
            {key.includes('richText') && (
              <span className="text-red-500 text-xs">⚠️</span>
            )}
          </label>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        ⚠️ Rich text editor may cause loading issues. Test carefully.
      </div>
    </div>
  )
}