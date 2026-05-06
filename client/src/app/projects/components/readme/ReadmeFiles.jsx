'use client';
import { useState, useRef } from "react";
import { RemovalModal } from "@/components/ui";
import { formatSize } from "@/lib";

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