'use client';
import { useState } from 'react';

export function ToolbarBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      className={`readme-toolbar-btn ${active ? 'readme-toolbar-btn-active' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

export function ToolbarDivider() {
  return <span className="readme-toolbar-divider"></span>;
}

export function EditorToolbar({ editor }) {
  const [linkInput, setLinkInput] = useState('');
  const [showLinkPop, setShowLinkPop] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    if (!linkInput.trim()) { editor.chain().focus().unsetLink().run(); }
    else { editor.chain().focus().setLink({ href: linkInput.trim(), target: '_blank' }).run(); }
    setLinkInput('');
    setShowLinkPop(false);
  };

  return (
    <div className="readme-toolbar">
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <i className="fas fa-undo"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <i className="fas fa-redo"></i>
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        H1
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        H2
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        H3
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Inline marks */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <i className="fas fa-bold"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <i className="fas fa-italic"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
        <i className="fas fa-underline"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <i className="fas fa-strikethrough"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
        <i className="fas fa-highlighter"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
        <i className="fas fa-code"></i>
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Alignment */}
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
        <i className="fas fa-align-left"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
        <i className="fas fa-align-center"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
        <i className="fas fa-align-right"></i>
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
        <i className="fas fa-list-ul"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
        <i className="fas fa-list-ol"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <i className="fas fa-quote-right"></i>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
        <i className="fas fa-terminal"></i>
      </ToolbarBtn>

      <ToolbarDivider />

      {/* Link */}
      <div className="readme-link-popover-wrap">
        <ToolbarBtn onClick={() => setShowLinkPop((v) => !v)} active={editor.isActive('link')} title="Insert Link">
          <i className="fas fa-link"></i>
        </ToolbarBtn>
        {showLinkPop && (
          <div className="readme-link-popover">
            <input
              type="url"
              className="form-control readme-link-input"
              placeholder="https://..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setLink()}
              autoFocus
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={setLink}>
              {editor.isActive('link') ? 'Update' : 'Set'}
            </button>
            {editor.isActive('link') && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkPop(false); }}>
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <i className="fas fa-minus"></i>
      </ToolbarBtn>
    </div>
  );
}