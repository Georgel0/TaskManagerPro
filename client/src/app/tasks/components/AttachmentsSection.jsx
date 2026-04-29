'use client';
import { useRef, useState, useCallback } from 'react';
import { useAttachments } from '../hooks/useAttachments';
import { RemovalModal } from '@/components/ui';
import toast from 'react-hot-toast';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ['image/', 'text/'];
const ALLOWED_MIME_EXACT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
];

const FILE_ICONS = {
  'image/': 'fa-image',
  'application/pdf': 'fa-file-pdf',
  'application/msword': 'fa-file-word',
  'application/vnd.openxmlformats': 'fa-file-word',
  'text/': 'fa-file-alt',
  'application/zip': 'fa-file-archive',
};

const getFileIcon = (fileType) => {
  if (!fileType) return 'fa-file';
  const match = Object.keys(FILE_ICONS).find((k) => fileType.startsWith(k));
  return match ? FILE_ICONS[match] : 'fa-file';
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getIconType = (fileType) => {
  if (!fileType) return 'file';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType.includes('word')) return 'word';
  if (fileType.startsWith('text/')) return 'text';
  if (fileType === 'application/zip' || fileType === 'application/x-zip-compressed') return 'zip';
  return 'file';
};

const validateFile = (file) => {
  if (file.size > MAX_SIZE_BYTES) {
    return `"${file.name}" exceeds the 10 MB limit (${formatSize(file.size)}).`;
  }
  const allowed =
    ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p)) ||
    ALLOWED_MIME_EXACT.includes(file.type);
  if (!allowed) {
    return `"${file.name}" has an unsupported file type.`;
  }
  return null;
};

const getDownloadUrl = (filePath) => {
  // Inject fl_attachment into Cloudinary URL to force download
  return filePath.replace('/upload/', '/upload/fl_attachment/');
};

export function AttachmentsSection({ taskId, currentUserId, isProjectOwner, onAttachmentCountChange }) {
  const { attachments, loading, isUploading, uploadFiles, deleteAttachment } = useAttachments(taskId, onAttachmentCountChange);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const pendingAttachment = attachments.find((a) => a.id === pendingDeleteId);

  const processFiles = useCallback((files) => {
    const validFiles = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
      } else {
        validFiles.push(file);
      }
    }
    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  }, [uploadFiles]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
    e.target.value = '';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) processFiles(files);
  };

  const canDelete = (attachment) =>
    isProjectOwner || attachment.user_id === currentUserId;

  return (
    <>
      <div
        className={`attachments-section${isDragging ? ' attachments-dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="attachments-drag-overlay">
            <i className="fas fa-cloud-upload-alt attachments-drag-icon"></i>
            <p className="attachments-drag-text">Drop files to upload</p>
          </div>
        )}

        <div className="attachments-header">
          <h4><i className="fas fa-paperclip"></i> Attachments</h4>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading
              ? <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
              : <><i className="fas fa-upload"></i> Attach File</>
            }
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="attachments-hidden-input"
            onChange={handleFileChange}
          />
        </div>

        {loading ? (
          <div className="attachments-skeleton-wrap">
            <div className="skeleton attachments-skeleton"></div>
          </div>
        ) : attachments.length === 0 ? (
          <button
            className="attachments-empty-state"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <i className="fas fa-folder-open attachments-empty-icon"></i>
            <p className="attachments-empty-title">No files attached yet</p>
            <p className="attachments-empty-sub">Click or drag &amp; drop files here to upload</p>
          </button>
        ) : (
          <ul className="attachments-list">
            {attachments.map((a) => (
              <li key={a.id} className="attachment-item">
                <div className={`attachment-icon-wrap type-${getIconType(a.file_type)}`}>
                  {a.file_type?.startsWith('image/') ? (
                    <img
                      src={a.file_path}
                      alt={a.original_name}
                      className="attachment-thumbnail"
                    />
                  ) : (
                    <i className={`fas ${getFileIcon(a.file_type)}`}></i>
                  )}
                </div>
                <div className="attachment-info">
                  <a href={a.file_path} target="_blank" rel="noopener noreferrer" className="attachment-name">
                    {a.original_name}
                  </a>
                  <span className="attachment-meta" title={`Uploaded by: ${a.uploader_name}`}>
                    {formatSize(a.file_size)} · {a.uploader_name}
                  </span>
                </div>
                <div className="attachment-actions">
                  <a
                    href={getDownloadUrl(a.file_path)}
                    download={a.original_name}
                    className="attachment-action-btn attachment-download-btn"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fas fa-download"></i>
                  </a>
                  {canDelete(a) && (
                    <button
                      className="attachment-action-btn attachment-delete-btn"
                      onClick={() => setPendingDeleteId(a.id)}
                      title="Remove"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="attachments-footer">
          <i className="fas fa-info-circle"></i>
          Max 10 MB · Images, PDFs, Word, text, zip
        </div>
      </div>

      <RemovalModal
        isOpen={!!pendingDeleteId}
        item={pendingAttachment}
        title="Remove Attachment"
        message={<>Remove <strong>{pendingAttachment?.original_name}</strong>? This will permanently delete the file.</>}
        onConfirm={() => { deleteAttachment(pendingDeleteId); setPendingDeleteId(null); }}
        onClose={() => setPendingDeleteId(null)}
        isSubmitting={false}
      />
    </>
  );
}