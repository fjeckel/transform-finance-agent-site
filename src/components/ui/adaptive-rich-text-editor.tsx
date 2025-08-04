import React, { lazy, Suspense, useState, useEffect } from 'react'
import { RichTextErrorBoundary, TextareaFallback } from './rich-text-error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'

// Lazy load editors for better performance
const RichTextEditor = lazy(() => import('./rich-text-editor'))
const MobileRichTextEditor = lazy(() => import('./mobile-rich-text-editor'))

export interface AdaptiveRichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
  minHeight?: string
  forceTextarea?: boolean // Force fallback to textarea
}

export const AdaptiveRichTextEditor: React.FC<AdaptiveRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  disabled = false,
  maxLength = 50000,
  className = '',
  minHeight = '200px',
  forceTextarea = false
}) => {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show skeleton during SSR and initial load
  if (!mounted) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <Skeleton className="h-10 border-b" />
        <div className="p-4">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  // Force textarea fallback if requested
  if (forceTextarea) {
    return (
      <TextareaFallback
        value={content}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        minHeight={minHeight}
      />
    )
  }

  // Choose appropriate editor component
  const EditorComponent = isMobile ? MobileRichTextEditor : RichTextEditor

  return (
    <RichTextErrorBoundary
      fallbackComponent={({ resetError }) => (
        <div className="space-y-4">
          <TextareaFallback
            value={content}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            minHeight={minHeight}
          />
        </div>
      )}
    >
      <Suspense 
        fallback={
          <div className={`border rounded-lg ${className}`}>
            <Skeleton className="h-10 border-b" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        }
      >
        <EditorComponent
          content={content}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={className}
          minHeight={minHeight}
        />
      </Suspense>
    </RichTextErrorBoundary>
  )
}

export default AdaptiveRichTextEditor