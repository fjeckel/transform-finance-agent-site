import DOMPurify from 'dompurify'

export interface ContentSecurityConfig {
  allowedTags: string[]
  allowedAttributes: Record<string, string[]>
  maxLength: number
}

const DEFAULT_CONFIG: ContentSecurityConfig = {
  allowedTags: [
    'p', 'strong', 'em', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'a', 'img', 'br', 'blockquote'
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'loading', 'width', 'height'],
    '*': ['class']
  },
  maxLength: 50000
}

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting
 */
export const sanitizeContent = (
  html: string, 
  config: Partial<ContentSecurityConfig> = {}
): string => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  if (html.length > finalConfig.maxLength) {
    throw new Error(`Content exceeds maximum length of ${finalConfig.maxLength} characters`)
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: finalConfig.allowedTags,
    ALLOWED_ATTR: finalConfig.allowedAttributes,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    ADD_ATTR: {
      'a': { 'rel': 'noopener noreferrer' }
    }
  })
}

/**
 * Extracts plain text from HTML content
 */
export const extractPlainText = (html: string): string => {
  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
  return sanitized.trim()
}

/**
 * Validates HTML content for security and structure
 */
export const validateRichTextContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Check content length
  if (content.length > DEFAULT_CONFIG.maxLength) {
    errors.push(`Content exceeds maximum length of ${DEFAULT_CONFIG.maxLength} characters`)
  }
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /<input/i
  ]
  
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      errors.push('Content contains potentially unsafe elements')
    }
  })
  
  // Validate HTML structure
  try {
    if (typeof window !== 'undefined') {
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'text/html')
      const parseErrors = doc.querySelectorAll('parsererror')
      if (parseErrors.length > 0) {
        errors.push('Invalid HTML structure')
      }
    }
  } catch (e) {
    errors.push('Failed to parse HTML content')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Converts markdown to safe HTML
 */
export const markdownToSafeHtml = async (markdown: string): Promise<string> => {
  try {
    const { remark } = await import('remark')
    const { default: remarkHtml } = await import('remark-html')
    
    const processed = await remark()
      .use(remarkHtml, { sanitize: true })
      .process(markdown)
    
    return sanitizeContent(String(processed))
  } catch (error) {
    console.error('Error converting markdown to HTML:', error)
    // Fallback: just sanitize the markdown as-is
    return sanitizeContent(markdown.replace(/\n/g, '<br>'))
  }
}

/**
 * Safely render HTML content with proper sanitization
 */
export const SafeHtmlRenderer: React.FC<{ 
  content: string
  className?: string 
}> = ({ content, className = '' }) => {
  const sanitizedContent = sanitizeContent(content)
  
  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}