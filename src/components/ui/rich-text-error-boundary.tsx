import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface RichTextErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface RichTextErrorBoundaryProps {
  children: React.ReactNode
  fallbackComponent?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class RichTextErrorBoundary extends React.Component<
  RichTextErrorBoundaryProps,
  RichTextErrorBoundaryState
> {
  constructor(props: RichTextErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): RichTextErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Rich text editor error:', error, errorInfo)
    }
    
    // In production, you might want to send this to an error reporting service
    // reportError(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      // Default fallback UI
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div className="font-medium">Rich text editor failed to load</div>
              <div className="text-sm text-muted-foreground mt-1">
                {this.state.error?.message || 'An unexpected error occurred'}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={this.resetError}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle rich text editor errors
export const useRichTextErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    console.error('Rich text editor error:', error)
  }, [])

  return { error, resetError, handleError }
}

// Simple fallback component for textarea
export const TextareaFallback: React.FC<{
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeight?: string
}> = ({ value, onChange, placeholder, disabled, className = '', minHeight = '200px' }) => {
  return (
    <div className="space-y-2">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Rich text editor unavailable. Using plain text editor with markdown support.
        </AlertDescription>
      </Alert>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-transparent ${className}`}
        style={{ minHeight }}
      />
      <div className="text-xs text-muted-foreground">
        Tip: You can use markdown syntax like **bold**, *italic*, # headings, and - lists
      </div>
    </div>
  )
}