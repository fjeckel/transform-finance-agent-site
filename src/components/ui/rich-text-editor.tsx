import React, { useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { sanitizeContent, validateRichTextContent } from '@/lib/content-security'
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Quote
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
  minHeight?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing...",
  disabled = false,
  maxLength = 50000,
  className = '',
  minHeight = '200px'
}) => {
  const { toast } = useToast()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { 
          levels: [2, 3] // Only allow H2 and H3 for better content structure
        },
        codeBlock: false, // Disable code blocks for security
        code: {
          HTMLAttributes: {
            class: 'inline-code bg-muted px-1 py-0.5 rounded text-sm'
          }
        }
      }),
      Image.configure({
        allowBase64: false, // Security: prevent base64 images
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
          class: 'text-primary hover:underline underline-offset-2'
        },
        validate: href => /^https?:\/\//.test(href) // Only allow http/https
      }),
      Placeholder.configure({ 
        placeholder 
      }),
      CharacterCount.configure({
        limit: maxLength
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      
      // Validate content
      const validation = validateRichTextContent(html)
      if (!validation.isValid) {
        toast({
          title: 'Content Validation Error',
          description: validation.errors[0],
          variant: 'destructive'
        })
        return
      }
      
      // Sanitize and update
      const sanitized = sanitizeContent(html)
      onChange(sanitized)
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-4 py-3`,
        style: `min-height: ${minHeight}`
      }
    }
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false)
    }
  }, [editor, content])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL (https only):')
    if (url && /^https:\/\//.test(url)) {
      editor?.chain().focus().setImage({ src: url }).run()
    } else if (url) {
      toast({
        title: 'Invalid Image URL',
        description: 'Please enter a valid HTTPS URL',
        variant: 'destructive'
      })
    }
  }, [editor, toast])

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('Enter link URL (https only):', previousUrl)

    if (url === null) return
    
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    if (/^https?:\/\//.test(url)) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      toast({
        title: 'Invalid Link URL',
        description: 'Please enter a valid HTTP/HTTPS URL',
        variant: 'destructive'
      })
    }
  }, [editor, toast])

  if (!editor) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="h-10 bg-muted/50 border-b animate-pulse" />
        <div className={`p-4 animate-pulse bg-muted/20`} style={{ minHeight }} />
      </div>
    )
  }

  const characterCount = editor.storage.characterCount.characters()
  const isNearLimit = characterCount > maxLength * 0.8

  return (
    <div className={`border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
        {/* Text Formatting */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={disabled}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={disabled}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Quote */}
        <Button
          size="sm"
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Media */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={addLink}
            disabled={disabled}
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={addImage}
            disabled={disabled}
            title="Add Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Character Count */}
        <div className="ml-auto text-xs text-muted-foreground">
          <span className={isNearLimit ? 'text-destructive font-medium' : ''}>
            {characterCount.toLocaleString()}
          </span>
          <span className="text-muted-foreground/60">
            /{maxLength.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor