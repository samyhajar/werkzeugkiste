'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

const RichTextEditor = ({ content, onChange, placeholder, className }: RichTextEditorProps) => {
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h1:mb-4 prose-h2:mb-3 prose-h3:mb-2 prose-p:mb-2',
      },
    },
  })

  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setIsLinkDialogOpen(false)
    }
  }

  const addImage = () => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setIsImageDialogOpen(false)
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className={`border border-gray-300 rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 flex flex-wrap gap-1">
        {/* Text Format Dropdown */}
        <Select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' :
            'paragraph'
          }
          onValueChange={(value) => {
            if (value === 'paragraph') {
              editor.chain().focus().setParagraph().run()
            } else if (value === 'h1') {
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            } else if (value === 'h2') {
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            } else if (value === 'h3') {
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text formatting */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 2h6a4 4 0 014 4c0 1.1-.45 2.1-1.17 2.83A4 4 0 0114 13v1H4V2zm2 2v4h4a2 2 0 100-4H6zm0 6v4h6a2 2 0 100-4H6z"/>
          </svg>
        </Button>

        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 2h8v2h-2.4l-1.2 12H10l1.2-12H8V2z"/>
          </svg>
        </Button>

        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 18h14v1H3v-1zm2-16h2v8a3 3 0 006 0V2h2v8a5 5 0 01-10 0V2z"/>
          </svg>
        </Button>

        <Button
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2h2v4.5h4v2h-4v1a1.5 1.5 0 003 0v-.5h2V9a3.5 3.5 0 01-7 0v-1H5V6h4V2z"/>
          </svg>
        </Button>



        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm0 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V9zm0 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-1zM7 4a1 1 0 000 2h11a1 1 0 100-2H7zM7 9a1 1 0 100 2h11a1 1 0 100-2H7zM7 14a1 1 0 100 2h11a1 1 0 100-2H7z"/>
          </svg>
        </Button>

        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm0 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V9zm0 5a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-1zM7 4a1 1 0 000 2h11a1 1 0 100-2H7zM7 9a1 1 0 100 2h11a1 1 0 100-2H7zM7 14a1 1 0 100 2h11a1 1 0 100-2H7z"/>
          </svg>
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Code and Quote */}
        <Button
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"/>
          </svg>
        </Button>



        {/* Link */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant={editor.isActive('link') ? 'default' : 'ghost'}
              size="sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
              </svg>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
              <DialogDescription>
                Add a hyperlink to your content
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addLink}>Add Link</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
              </svg>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Image</DialogTitle>
              <DialogDescription>
                Add an image to your content
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addImage}>Add Image</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 000 2h1.4l.7 4.5a1 1 0 00.98.75h7.84a1 1 0 00.98-.75L15.6 6H17a1 1 0 100-2H3zM6 8h8v8H6V8z"/>
          </svg>
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0L17.414 7l-3.707 3.707a1 1 0 01-1.414-1.414L14.586 7H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </Button>
      </div>

      {/* Editor Content */}
      <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        <EditorContent
          editor={editor}
          placeholder={placeholder}
          className="focus:outline-none [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-2 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-2 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-2 [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
        />
      </div>
    </div>
  )
}

export default RichTextEditor