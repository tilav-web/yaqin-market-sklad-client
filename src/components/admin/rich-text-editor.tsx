'use client';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
} from 'lucide-react';
import { useCallback } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, defaultProtocol: 'https' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Rasm URL kiriting:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Havola URL:', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const btn = (active: boolean, onClick: () => void, title: string, Icon: React.ElementType) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={!editor}
      className={`rounded p-1.5 transition-colors disabled:opacity-40 ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
      <Icon className="size-4" />
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
        {btn(editor?.isActive('bold') ?? false, () => editor?.chain().focus().toggleBold().run(), 'Qalin', Bold)}
        {btn(editor?.isActive('italic') ?? false, () => editor?.chain().focus().toggleItalic().run(), 'Kursiv', Italic)}
        {btn(editor?.isActive('strike') ?? false, () => editor?.chain().focus().toggleStrike().run(), 'Chizilgan', Strikethrough)}
        <div className="mx-1 w-px self-stretch bg-border" />
        {btn(
          editor?.isActive('heading', { level: 1 }) ?? false,
          () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
          'H1',
          Heading1,
        )}
        {btn(
          editor?.isActive('heading', { level: 2 }) ?? false,
          () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          'H2',
          Heading2,
        )}
        <div className="mx-1 w-px self-stretch bg-border" />
        {btn(editor?.isActive('bulletList') ?? false, () => editor?.chain().focus().toggleBulletList().run(), "Ro'yxat", List)}
        {btn(
          editor?.isActive('orderedList') ?? false,
          () => editor?.chain().focus().toggleOrderedList().run(),
          "Raqamli ro'yxat",
          ListOrdered,
        )}
        <div className="mx-1 w-px self-stretch bg-border" />
        {btn(editor?.isActive('link') ?? false, addLink, 'Havola', LinkIcon)}
        {btn(false, addImage, 'Rasm', ImageIcon)}
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="rich-editor min-h-[180px] cursor-text px-3 py-2 text-sm"
      />
    </div>
  );
}
