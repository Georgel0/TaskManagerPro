'use client';
import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useReadme } from '@/hooks';
import { EditorToolbar } from '@/components/ui';
import { formatDate } from '@/lib';
import { ReadmeFiles } from '..';

export function ReadmeModal({ project, isOwner, onClose }) {
  const {
    content, files, updatedAt, updatedByName,
    isLoading, isDirty, markDirty,
    save, isSaving,
    uploadFile, isUploading,
    deleteFile,
  } = useReadme(project.id);

  const [activeTab, setActiveTab] = useState('editor');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: isOwner ? 'Write your project README here…' : 'No content yet.' }),
    ],
    content: '',
    editable: isOwner,
    immediatelyRender: false,
    onUpdate: () => markDirty(),
  });

  // Populate editor once content loads
  useEffect(() => {
    if (editor && content !== undefined && editor.isEmpty) {
      editor.commands.setContent(content || '');
    }
  }, [editor, content]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    save(editor.getHTML());
  }, [editor, save]);

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isOwner) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave, isOwner]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content readme-modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header readme-modal-header">
          <div className="readme-modal-title">
            <i className="fas fa-book-open"></i>
            <div>
              <h3>README · {project.name}</h3>
              {updatedAt && (
                <p className="readme-last-saved">
                  Last saved {formatDate(updatedAt)}{updatedByName ? ` by ${updatedByName}` : ''}
                </p>
              )}
            </div>
          </div>
          <div className="readme-header-actions">
            {isOwner && (
              <button
                className={`btn btn-primary btn-sm readme-save-btn ${isDirty ? 'readme-save-btn-dirty' : ''}`}
                onClick={handleSave}
                disabled={isSaving || !isDirty}
              >
                {isSaving
                  ? <><i className="fas fa-spinner fa-spin"></i> Saving…</>
                  : isDirty
                    ? <><i className="fas fa-circle readme-dirty-dot"></i> Save</>
                    : <><i className="fas fa-check"></i> Saved</>
                }
              </button>
            )}
            <button className="btn-icon" onClick={onClose}><i className="fas fa-times"></i></button>
          </div>
        </div>

        <div className="readme-tabs">
          <button className={`readme-tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
            <i className="fas fa-pen"></i> {isOwner ? 'Editor' : 'Content'}
          </button>
          <button className={`readme-tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
            <i className="fas fa-paperclip"></i> Files
            {files.length > 0 && <span className="readme-tab-count">{files.length}</span>}
          </button>
          {!isOwner && (
            <button className={`readme-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
              <i className="fas fa-eye"></i> Preview
            </button>
          )}
        </div>

        <div className="readme-modal-body">
          {isLoading ? (
            <div className="readme-loading">
              <div className="pulse-ring"></div>
              <p>Loading README…</p>
            </div>
          ) : (
            <>
              {activeTab === 'editor' && (
                <div className="readme-editor-wrap">
                  {isOwner && <EditorToolbar editor={editor} />}
                  <div className={`readme-editor-content ${!isOwner ? 'readme-read-only' : ''}`}>
                    <EditorContent editor={editor} />
                  </div>
                  {isOwner && (
                    <p className="readme-editor-hint">
                      <i className="fas fa-keyboard"></i> {navigator?.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+S to save quickly
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'files' && (
                <ReadmeFiles
                  files={files}
                  isOwner={isOwner}
                  isUploading={isUploading}
                  onUpload={uploadFile}
                  onDelete={deleteFile}
                />
              )}

              {activeTab === 'preview' && !isOwner && (
                <div
                  className="readme-preview-content"
                  dangerouslySetInnerHTML={{ __html: content || '<p class="readme-empty-preview">No content written yet.</p>' }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}