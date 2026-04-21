'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context';
import { useComments } from '../hooks/useComments';
import { commentSchema, validate } from '@/lib/validators';
import { formatDate, formatTime, getInitials, autoResize } from '@/lib';
import { AttachmentsSection } from '.';

export function TaskDetailModal({ isOpen, onClose, onEdit, task, isProjectOwner, onCommentAdded, onCommentDeleted }) {
  const { user } = useApp();

  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);
  const commentsEndRef = useRef(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const {
    comments, loading, isSubmitting,
    editingId, editText, setEditText,
    createComment, startEdit, cancelEdit, saveEdit, deleteComment,
  } = useComments(task?.id);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate(commentSchema, { comment: commentText });
    if (errors?.comment) {
      setCommentError(errors.comment);
      return;
    }

    setCommentError(null);
    await createComment(commentText.trim());
    onCommentAdded();
    setCommentText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasEditRights =
    Number(user?.id) === Number(task.project_owner_id) ||
    Number(user?.id) === Number(task.assigned_user_id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3>{task.title}</h3>
          {hasEditRights && (<button
            className="btn-icon edit-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            title="Edit Task"
          >
            <i className="fas fa-pencil-alt"></i>
          </button>)}
        </div>

        <div className="modal-body task-detail-body modal-body-scroll">

          <div className="task-detail-badges">
            <span className={`badge priority-${task.priority?.toLowerCase() || 'medium'}`} title="Priority">
              {task.priority || 'Medium'}
            </span>
            <span className="badge status-badge" title="Status">{task.status || 'To Do'}</span>
          </div>

          <div className="task-detail-row" title="Deadline">
            <i className="fas fa-calendar-alt task-detail-icon"></i>
            <span className="task-detail-inline-label">Deadline:</span>
            <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline set'}</span>
          </div>

          <div className="task-detail-section">
            <p className="task-detail-label">Description</p>
            <p className="task-detail-description">
              {task.description || <span className="task-detail-empty-text">No description provided.</span>}
            </p>
          </div>
<hr />
          <AttachmentsSection
            taskId={task.id}
            currentUserId={user.id}
            isProjectOwner={isProjectOwner}
          />

          <div className="task-detail-section">
            <hr />
            <div className="comments-collapsible">
              <button
                className="comments-toggle"
                onClick={() => setCommentsOpen((prev) => !prev)}
              >
                <i className={`fas fa-chevron-right comments-toggle-icon ${commentsOpen ? 'comments-toggle-icon-open' : ''}`}></i>
                <p className="task-detail-label">
                  Comments
                  {comments.length > 0 && (
                    <span className="comment-count">{comments.length}</span>
                  )}
                </p>
              </button>

              <div className={`comments-section-content ${commentsOpen ? 'comments-section-open' : ''}`}>
                <div className="comments-section-inner">
                  <div className="comments-list">
                    {loading ? (
                      <p className="comments-loading-text">Loading comments...</p>
                    ) : comments.length === 0 ? (
                      <p className="comments-empty">No comments yet. Be the first to comment.</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className={`comment-item ${c.user_id === user?.id ? 'comment-own' : ''}`}>
                          <div className="comment-avatar">
                            {c.user_avatar ? (
                              <img src={c.user_avatar} alt={c.user_name} />
                            ) : (
                              <span>{getInitials(c.user_name)}</span>
                            )}
                          </div>

                          <div className="comment-body">
                            <div className="comment-meta">
                              <span className="comment-author">{c.user_name}</span>
                              <span className="comment-time" title={formatTime(c.created_at)}>
                                {formatDate(c.created_at)}
                              </span>
                              {c.updated_at && (
                                <span className="comment-edited">edited</span>
                              )}
                            </div>

                            {editingId === c.id ? (
                              <div className="comment-edit-area">
                                <textarea
                                  className="form-control comment-edit-input"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onInput={autoResize}
                                  rows={1}
                                  autoFocus
                                />
                                <div className="comment-edit-actions">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => saveEdit(c.id)}
                                    disabled={isSubmitting || !editText.trim()}
                                  >
                                    Save
                                  </button>
                                  <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="comment-text">{c.comment}</p>
                            )}
                          </div>

                          {(c.user_id === user?.id || isProjectOwner) && editingId !== c.id && (
                            <div className="comment-actions">
                              {c.user_id === user?.id && (
                                <button
                                  className="btn-icon edit-btn"
                                  title="Edit comment"
                                  onClick={() => startEdit(c)}
                                >
                                  <i className="fas fa-pencil-alt"></i>
                                </button>
                              )}
                              <button
                                className="btn-icon delete-btn"
                                title="Delete comment"
                                onClick={() => { deleteComment(c.id); onCommentDeleted() }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  <form className="comment-form" onSubmit={handleSubmit} noValidate>
                    <div className="comment-input-row">
                      <div className="comment-avatar comment-avatar-sm">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} />
                        ) : (
                          <span>{getInitials(user?.name)}</span>
                        )}
                      </div>
                      <div className={`comment-input-wrapper ${commentError ? 'has-error' : ''}`}>
                        <textarea
                          className="form-control comment-input"
                          placeholder="Write a comment..."
                          value={commentText}
                          rows={1}
                          onChange={(e) => {
                            setCommentText(e.target.value);
                            if (commentError) setCommentError(null);
                          }}
                          onInput={autoResize}
                          onKeyDown={handleKeyDown}
                        />
                        {commentError && (
                          <span className="field-error">
                            <i className="fas fa-exclamation-circle"></i> {commentError}
                          </span>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm comment-submit-btn"
                        disabled={isSubmitting || !commentText.trim()}
                        title="Submit"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} title="CLose">Close</button>
        </div>
      </div>
    </div>
  );
}