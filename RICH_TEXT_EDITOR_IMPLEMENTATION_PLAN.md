# Rich Text Editor Implementation Plan for Finance Transformers

## Executive Summary

This document outlines a comprehensive plan to upgrade the content editing experience for insights and episodes from basic textarea fields to a modern rich text editor using TipTap.

### Key Benefits
- Enhanced content creation experience with formatting tools
- Consistent content structure across the platform
- Mobile-friendly editing interface
- Maintained markdown support for power users
- Improved security through proper content sanitization

## Current State Analysis

### Existing Implementation
- **Insights**: Basic textarea with markdown support, rendered with ReactMarkdown
- **Episodes**: Basic textarea with HTML content using dangerouslySetInnerHTML (security risk)
- **Forms**: Complex multi-tab forms with 20+ fields causing decision fatigue

### Critical Issues
1. **Security Vulnerability**: Unsafe HTML injection in episode rendering
2. **Poor UX**: Multiple content fields (description, summary, content) create confusion
3. **Limited Formatting**: No visual formatting tools available
4. **Mobile Experience**: Poor editing experience on mobile devices

## Proposed Solution: TipTap Rich Text Editor

### Why TipTap?
- Built on ProseMirror (battle-tested foundation)
- Excellent TypeScript support
- Modular architecture (use only what you need)
- Native markdown support
- Active development and community
- Good balance of features and performance

## Implementation Strategy

### Phase 1: Security & Infrastructure (Week 1)

#### 1.1 Fix Security Vulnerabilities
```bash
npm install dompurify @types/dompurify
```

Create content security service:
```typescript
// src/lib/content-security.ts
import DOMPurify from 'dompurify'

export const sanitizeContent = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'img', 'br'],
    ALLOWED_ATTR: {
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'loading']
    }
  })
}
```

#### 1.2 Database Schema Updates
```sql
-- supabase/migrations/20250804000002_add_content_format_tracking.sql
ALTER TABLE public.insights 
ADD COLUMN content_format TEXT DEFAULT 'markdown' 
CHECK (content_format IN ('markdown', 'html', 'hybrid'));

ALTER TABLE public.episodes
ADD COLUMN content_format TEXT DEFAULT 'plain' 
CHECK (content_format IN ('plain', 'html', 'hybrid'));
```

### Phase 2: Core Editor Component (Week 2)

#### 2.1 Install Dependencies
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder
```

#### 2.2 Create Rich Text Editor Component
```typescript
// src/components/ui/rich-text-editor.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Heading2, List, Link as LinkIcon } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  disabled = false
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
          loading: 'lazy'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-primary hover:underline'
        }
      }),
      Placeholder.configure({ placeholder })
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(sanitizeContent(html))
    },
    editable: !disabled
  })

  if (!editor) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="border-b bg-muted/50 p-2 flex gap-1 flex-wrap">
        <Button
          size="sm"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  )
}
```

### Phase 3: Form Simplification (Week 3)

#### 3.1 Consolidate Content Fields
Replace multiple textarea fields with single rich text editor:

```typescript
// src/pages/NewInsight.tsx (simplified)
const NewInsight = () => {
  const [content, setContent] = useState('')
  
  return (
    <form>
      {/* Basic Info */}
      <Input 
        label="Title" 
        value={title} 
        onChange={setTitle}
        required 
      />
      
      {/* Single Rich Editor replacing description + summary + content */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Content <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder="Start with a brief description, then add your main content..."
        />
      </div>
      
      {/* Status & Publishing */}
      <Select value={status} onChange={setStatus}>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </Select>
    </form>
  )
}
```

#### 3.2 Progressive Disclosure Pattern
Show only essential fields initially:

```typescript
const [showAdvanced, setShowAdvanced] = useState(false)

return (
  <>
    {/* Essential fields always visible */}
    <div className="space-y-4">
      <Input label="Title" required />
      <RichTextEditor />
      <Select label="Status" />
    </div>
    
    {/* Advanced options collapsed by default */}
    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
      <CollapsibleTrigger className="text-sm text-muted-foreground">
        Advanced options
      </CollapsibleTrigger>
      <CollapsibleContent>
        {/* Tags, SEO, etc. */}
      </CollapsibleContent>
    </Collapsible>
  </>
)
```

### Phase 4: Migration & Rollout (Week 4)

#### 4.1 Content Migration Strategy
```typescript
// src/lib/content-migration.ts
export const migrateContent = async (
  content: string, 
  currentFormat: 'markdown' | 'plain' | 'html'
): Promise<string> => {
  if (currentFormat === 'markdown') {
    // Convert markdown to HTML
    const { remark } = await import('remark')
    const { default: remarkHtml } = await import('remark-html')
    
    const processed = await remark()
      .use(remarkHtml)
      .process(content)
    
    return sanitizeContent(String(processed))
  }
  
  if (currentFormat === 'plain') {
    // Convert plain text to HTML
    return `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
  }
  
  // Already HTML, just sanitize
  return sanitizeContent(content)
}
```

#### 4.2 Feature Flag Implementation
```typescript
// src/hooks/useFeatureFlag.ts
export const useRichTextEditor = () => {
  const [enabled, setEnabled] = useState(false)
  
  useEffect(() => {
    // Check user preference or admin setting
    const flags = localStorage.getItem('feature-flags')
    const parsed = flags ? JSON.parse(flags) : {}
    setEnabled(parsed.richTextEditor || false)
  }, [])
  
  return enabled
}
```

## Mobile Optimization

### Responsive Toolbar
```typescript
const MobileToolbar = ({ editor }) => {
  const isMobile = useIsMobile() // Custom hook using media query
  
  if (isMobile) {
    return (
      <div className="flex gap-1 p-2 overflow-x-auto">
        {/* Only essential tools */}
        <ToolButton icon={Bold} action="bold" />
        <ToolButton icon={Italic} action="italic" />
        <ToolButton icon={List} action="bulletList" />
      </div>
    )
  }
  
  return <FullToolbar editor={editor} />
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('RichTextEditor', () => {
  it('sanitizes malicious content', () => {
    const onChange = jest.fn()
    render(<RichTextEditor content="" onChange={onChange} />)
    
    // Simulate paste with script tag
    fireEvent.paste(editor, {
      clipboardData: {
        getData: () => '<script>alert("xss")</script><p>Hello</p>'
      }
    })
    
    expect(onChange).toHaveBeenCalledWith('<p>Hello</p>')
  })
})
```

### Integration Tests
- Content migration from markdown to HTML
- Form submission with rich content
- Mobile editing experience
- Keyboard navigation

## Rollout Timeline

### Week 1: Foundation
- [ ] Fix security vulnerabilities
- [ ] Add content sanitization
- [ ] Update database schema
- [ ] Create content security service

### Week 2: Editor Development
- [ ] Install TipTap dependencies
- [ ] Build RichTextEditor component
- [ ] Add mobile-responsive toolbar
- [ ] Implement error boundaries

### Week 3: Integration
- [ ] Replace textarea in NewInsight
- [ ] Replace textarea in EditEpisode
- [ ] Simplify form layouts
- [ ] Add progressive disclosure

### Week 4: Migration & Launch
- [ ] Content migration utilities
- [ ] Feature flag system
- [ ] Beta testing with select users
- [ ] Full rollout

## Success Metrics

1. **Content Creation Time**: Measure time from "New" to "Publish"
2. **Mobile Usage**: Track admin mobile editing adoption
3. **Error Rates**: Monitor form validation failures
4. **Bundle Size Impact**: Track performance metrics
5. **User Satisfaction**: Survey content creators

## Risk Mitigation

### Performance Risks
- Lazy load editor components
- Monitor bundle size impact
- Optimize for mobile devices

### Security Risks
- Implement strict content sanitization
- Regular security audits
- CSP headers for additional protection

### Migration Risks
- Backup all content before migration
- Gradual rollout with feature flags
- Maintain backward compatibility

## Alternative Approach: Markdown-First

If rich text proves too complex, consider enhancing the markdown experience:

1. **Live Preview**: Split screen markdown editor with preview
2. **Markdown Toolbar**: Buttons that insert markdown syntax
3. **Better Mobile**: Markdown shortcuts for mobile keyboards
4. **Syntax Highlighting**: CodeMirror for better markdown editing

## Conclusion

This implementation plan provides a secure, performant, and user-friendly upgrade to your content editing experience. The phased approach ensures minimal disruption while delivering significant improvements to content creators.

Key benefits:
- 🔒 Enhanced security with proper sanitization
- 📱 Mobile-friendly editing experience
- 🎨 Visual formatting tools
- 📝 Maintained markdown support
- 🚀 Improved content creation workflow

Start with Phase 1 (security fixes) immediately, then proceed with the rich text editor implementation based on user feedback and requirements.