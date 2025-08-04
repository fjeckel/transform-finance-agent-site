import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { sanitizeContent, validateRichTextContent } from '@/lib/content-security'
import { useToast } from '@/hooks/use-toast'
import { 
  Bold, 
  Italic, 
  Heading2,
  List, 
  Link as LinkIcon,
  MoreHorizontal,
  X
} from 'lucide-react'

interface MobileRichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeight?: string
}

export const MobileRichTextEditor: React.FC<MobileRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  disabled = false,
  className = '',
  minHeight = '200px'
}) => {
  const [showAdvancedTools, setShowAdvancedTools] = useState(false)
  const { toast } = useToast()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] }, // Only H2 for mobile simplicity
        codeBlock: false,
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
          loading: 'lazy'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-primary hover:underline'
        },
        validate: href => /^https?:\/\//.test(href)
      }),
      Placeholder.configure({ placeholder })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const validation = validateRichTextContent(html)
      
      if (!validation.isValid) {
        toast({
          title: 'Content Error',
          description: validation.errors[0],
          variant: 'destructive'
        })
        return
      }
      
      onChange(sanitizeContent(html))
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-3 py-3 touch-manipulation`,
        style: `min-height: ${minHeight}`
      }
    }
  })

  const addLink = () => {
    const url = window.prompt('Enter link URL:')
    if (url && /^https?:\/\//.test(url)) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  if (!editor) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="h-12 bg-muted/50 border-b animate-pulse" />
        <div className={`p-3 animate-pulse bg-muted/20`} style={{ minHeight }} />
      </div>
    )
  }

  // Essential tools always visible
  const essentialTools = [
    {
      icon: Bold,
      isActive: editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run(),
      title: 'Bold'
    },
    {
      icon: Italic,
      isActive: editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run(),
      title: 'Italic'
    },
    {
      icon: List,
      isActive: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
      title: 'List'
    }
  ]

  // Advanced tools shown on demand
  const advancedTools = [
    {
      icon: Heading2,
      isActive: editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      title: 'Heading'
    },
    {
      icon: LinkIcon,
      isActive: editor.isActive('link'),
      action: addLink,
      title: 'Link'
    }
  ]

  return (
    <div className={`border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring ${className}`}>
      {/* Mobile-optimized toolbar */}
      <div className="border-b bg-muted/30 p-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Essential tools */}
          {essentialTools.map((tool, index) => {
            const Icon = tool.icon
            return (
              <Button
                key={index}
                size="sm"
                variant={tool.isActive ? 'default' : 'ghost'}
                onClick={tool.action}
                disabled={disabled}
                title={tool.title}
                className="min-w-[44px] h-[44px] touch-manipulation" // Touch-friendly size
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}

          {/* Toggle for advanced tools */}
          <Button
            size="sm"
            variant={showAdvancedTools ? 'default' : 'ghost'}
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            disabled={disabled}
            title={showAdvancedTools ? 'Hide more tools' : 'Show more tools'}
            className="min-w-[44px] h-[44px] touch-manipulation"
          >
            {showAdvancedTools ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>

          {/* Advanced tools (shown when expanded) */}
          {showAdvancedTools && advancedTools.map((tool, index) => {
            const Icon = tool.icon
            return (
              <Button
                key={`advanced-${index}`}
                size="sm"
                variant={tool.isActive ? 'default' : 'ghost'}
                onClick={tool.action}
                disabled={disabled}
                title={tool.title}
                className="min-w-[44px] h-[44px] touch-manipulation"
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  )
}

export default MobileRichTextEditor