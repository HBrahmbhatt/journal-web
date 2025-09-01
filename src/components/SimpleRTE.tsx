import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Strike from '@tiptap/extension-strike'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold, Italic, Underline as UnderlineIcon, Highlighter,
  Link as LinkIcon, Strikethrough, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Code2, List, ListOrdered, Undo, Redo
} from 'lucide-react'
import { useEffect } from 'react'

type Props = { value: string; onChange: (html: string) => void }



export default function TiptapSimple({ value, onChange }: Props) {
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({ placeholder: 'Write your daily entry here…' }),
      Underline,
      Highlight,
      Strike,
      Link.configure({
        openOnClick: true,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const normalizedCurrent = current === '<p></p>' ? '' : current
    const incoming = value || ''

    if (incoming !== normalizedCurrent) {
      // false = don't emit onUpdate (prevents loops)
      editor.commands.setContent(incoming || '<p></p>', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const cx = (active: boolean) => `editor-btn ${active ? 'editor-btn--active' : ''}`
  const currentHeading =
    editor.isActive('heading', { level: 1 }) ? 'h1' :
    editor.isActive('heading', { level: 2 }) ? 'h2' :
    editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'

  return (
    <div className="grid gap-3">
      <div className="editor-toolbar editor-toolbar--soft editor-toolbar--nowrap">
        <div className="editor-group">
          <button className={cx(editor.isActive('bold'))} type="button" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={12} /></button>
          <button className={cx(editor.isActive('italic'))} type="button" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={12} /></button>
          <button className={cx(editor.isActive('underline'))} type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={12} /></button>
          <button className={cx(editor.isActive('highlight'))} type="button" onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter size={12} /></button>
          <button className={cx(editor.isActive('strike'))} type="button" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={12} /></button>
        </div>

        <div className="editor-sep" />

        <select
          className="editor-select"
          value={currentHeading}
          onChange={(e) => {
            const v = e.target.value as 'p' | 'h1' | 'h2' | 'h3'
            const chain = editor.chain().focus()
            if (v === 'p') chain.setParagraph().run()
            else chain.toggleHeading({ level: (v === 'h1' ? 1 : v === 'h2' ? 2 : 3) }).run()
          }}
          aria-label="Heading level"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>

        </select>

        <div className="editor-sep" />

        <div className="editor-group">
          <button className={cx(editor.isActive('bulletList'))} type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={12} /></button>
          <button className={cx(editor.isActive('orderedList'))} type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={12} /></button>
          <button className={cx(editor.isActive('blockquote'))} type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={12} /></button>
          <button className={cx(editor.isActive('codeBlock'))} type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 size={12} /></button>
        </div>

        <div className="editor-sep" />

        <button
          className={cx(editor.isActive('link'))}
          type="button"
          onClick={() => {
            const prev = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('Enter URL', prev || 'https://')
            if (url === null) return
            if (!url) editor.chain().focus().unsetLink().run()
            else editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
          }}
        >
          <LinkIcon size={12} />
        </button>

        <div className="editor-sep" />

        <button className={cx(editor.isActive({ textAlign: 'left' }))}    type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={12} /></button>
        <button className={cx(editor.isActive({ textAlign: 'center' }))}  type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={12} /></button>
        <button className={cx(editor.isActive({ textAlign: 'right' }))}   type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={12} /></button>
        <button className={cx(editor.isActive({ textAlign: 'justify' }))} type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify size={12} /></button>

        <div className="editor-sep" />

        <button className="editor-btn" type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={12} /></button>

        <div className="editor-group">
          <button className="editor-btn" type="button" onClick={() => editor.chain().focus().undo().run()}><Undo size={12} /></button>
          <button className="editor-btn" type="button" onClick={() => editor.chain().focus().redo().run()}><Redo size={12} /></button>
        </div>
      </div>

      <div className="rte-area">
        {/* fix: typo 'rte-pose' -> 'rte-prose', and use .tiptap to pick up defaults */}
        <EditorContent editor={editor} className="tiptap rte-prose" />
      </div>
    </div>
  )
}
