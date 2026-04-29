'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
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
import { RemovalModal, EditorToolbar } from '@/components/ui';
import { formatDate, formatSize } from '@/lib';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const canPreview = (fileType) =>
  fileType?.startsWith('image/') || fileType === 'application/pdf';

const getFileIcon = (fileType) => {
  if (!fileType) return 'fa-file';
  if (fileType.startsWith('image/')) return 'fa-image';
  if (fileType === 'application/pdf') return 'fa-file-pdf';
  if (fileType.includes('word')) return 'fa-file-word';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'fa-file-excel';
  if (fileType.includes('zip') || fileType.includes('archive')) return 'fa-file-archive';
  if (fileType.startsWith('video/')) return 'fa-file-video';
  if (fileType.startsWith('text/')) return 'fa-file-alt';
  return 'fa-file';
};

const getIconType = (fileType) => {
  if (!fileType) return 'file';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType.includes('word')) return 'word';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'excel';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('text/')) return 'text';
  if (fileType.includes('zip')) return 'zip';
  return 'file';
};

const getDownloadUrl = (filePath) =>
  filePath.replace('/upload/', '/upload/fl_attachment/');

export function ReadmeFiles({ files, isOwner, isUploading, onUpload, onDelete }) {
  const fileInputRef = useRef(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = (rawFiles) => {
    for (const file of rawFiles) {
      if (file.size > MAX_FILE_SIZE) { alert(`"${file.name}" exceeds 25 MB.`); continue; }
      onUpload(file);
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; if (dragCounter.current === 1) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const pendingFile = files.find((f) => f.id === pendingDeleteId);

  return (
    <>
      <div
        className={`readme-files-section ${isDragging ? 'readme-files-dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="readme-drag-overlay">
            <i className="fas fa-cloud-upload-alt readme-drag-icon"></i>
            <p>Drop files to attach</p>
          </div>
        )}

        <div className="readme-files-header">
          <h4><i className="fas fa-paperclip"></i> Attached Files</h4>
          {isOwner && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading
                ? <><i className="fas fa-spinner fa-spin"></i> Uploading…</>
                : <><i className="fas fa-upload"></i> Upload</>
              }
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="readme-hidden-input"
            onChange={(e) => { handleFiles(Array.from(e.target.files)); e.target.value = ''; }}
          />
        </div>

        {files.length === 0 ? (
          isOwner ? (
            <button className="readme-files-empty" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <i className="fas fa-folder-open readme-files-empty-icon"></i>
              <p>No files yet — click or drag to upload</p>
            </button>
          ) : (
            <p className="readme-files-empty-text">No files attached.</p>
          )
        ) : (
          <ul className="readme-files-list">
            {files.map((f) => (
              <li key={f.id} className="readme-file-item">
                <div className={`readme-file-icon type-${getIconType(f.file_type)}`}>
                  <i className={`fas ${getFileIcon(f.file_type)}`}></i>
                </div>
                <div className="readme-file-info">
                  <span className="readme-file-name" title={f.original_name}>{f.original_name}</span>
                  <span className="readme-file-meta">{formatSize(f.file_size)}{f.uploader_name ? ` · ${f.uploader_name}` : ''}</span>
                </div>
                <div className="readme-file-actions">
                  {canPreview(f.file_type) && (
                    <button
                      className="readme-file-action-btn"
                      title="Preview"
                      onClick={() => setPreviewFile(previewFile?.id === f.id ? null : f)}
                    >
                      <i className={`fas ${previewFile?.id === f.id ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  )}
                  <a
                    href={getDownloadUrl(f.file_path)}
                    download={f.original_name}
                    className="readme-file-action-btn readme-file-download-btn"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fas fa-download"></i>
                  </a>
                  {isOwner && (
                    <button className="readme-file-action-btn readme-file-delete-btn" title="Remove" onClick={() => setPendingDeleteId(f.id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>

                {previewFile?.id === f.id && (
                  <div className="readme-file-preview">
                    {f.file_type?.startsWith('image/') ? (
                      <img src={f.file_path} alt={f.original_name} className="readme-preview-img" />
                    ) : (
                      <iframe src={f.file_path} className="readme-preview-iframe" title={f.original_name}></iframe>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="readme-files-footer">
          <i className="fas fa-info-circle"></i> Max 25 MB per file · All file types accepted
        </p>
      </div>

      <RemovalModal
        isOpen={!!pendingDeleteId}
        item={pendingFile}
        title="Remove File"
        message={<>Remove <strong>{pendingFile?.original_name}</strong>? This is permanent.</>}
        onConfirm={() => { onDelete(pendingDeleteId); setPendingDeleteId(null); }}
        onClose={() => setPendingDeleteId(null)}
        isSubmitting={false}
      />
    </>
  );
}

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