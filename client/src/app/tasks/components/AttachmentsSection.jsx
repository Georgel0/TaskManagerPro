'use client';
import { useRef, useState } from 'react';
import { useAttachments } from '../hooks/useAttachments';
import { RemovalModal } from '@/components/ui';

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
  if (fileType === 'application/zip') return 'zip';
  return 'file';
};

export function AttachmentsSection({ taskId, currentUserId, isProjectOwner, onAttachmentCountChange }) {
  const { attachments, loading, isUploading, uploadAttachment, deleteAttachment } = useAttachments(taskId, onAttachmentCountChange);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  const pendingAttachment = attachments.find((a) => a.id === pendingDeleteId);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAttachment(file);
      e.target.value = ''; // reset so same file can be re-uploaded
    }
  };

  const canDelete = (attachment) =>
    isProjectOwner || attachment.user_id === currentUserId;

  return (
    <>
      <div className="attachments-section">
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
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {loading ? (
          <p>Loading attachments...</p>
        ) : attachments.length === 0 ? (
          <p className="attachments-empty">No files attached yet.</p>
        ) : (
          <ul className="attachments-list">
            {attachments.map((a) => (
              <li key={a.id} className="attachment-item">
                <div className={`attachment-icon-wrap type-${getIconType(a.file_type)}`}>
                  <i className={`fas ${getFileIcon(a.file_type)}`}></i>
                </div>
                <div className="attachment-info">
                  <a href={a.file_path} target="_blank" rel="noopener noreferrer" className="attachment-name">
                    {a.original_name}
                  </a>
                  <span className="attachment-meta" title={`Uploaded by: ${a.uploader_name}`}>
                    {formatSize(a.file_size)} · {a.uploader_name}
                  </span>
                </div>
                {canDelete(a) && (
                  <button className="attachment-delete-btn" onClick={() => setPendingDeleteId(a.id)} title="Remove">
                    <i className="fas fa-trash" style={{ fontSize: 13 }}></i>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="attachments-footer">
          <i className="fas fa-info-circle" style={{ fontSize: 12 }}></i>
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