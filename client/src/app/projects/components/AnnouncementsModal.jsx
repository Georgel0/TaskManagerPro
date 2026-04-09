'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { formatDate } from '@/lib';

export function AnnouncementsModal({ project, isOwner, onClose }) {
  const { announcements, loadingAnnouncements, handleCreateAnnouncement, handleAcknowledge } = useAnnouncements(project.id);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'update', isPinned: false });

  const onSubmit = async (e) => {
    e.preventDefault();
    const success = await handleCreateAnnouncement(formData);
    if (success) {
      setFormData({ title: '', content: '', type: 'update', isPinned: false });
      setShowForm(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large announcements-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-bullhorn"></i> Project Broadcasts: {project.name}</h2>
          <button className="btn-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

        <div className="modal-body">
          {isOwner && !showForm && (
            <button className="btn btn-primary pulse-create-btn" onClick={() => setShowForm(true)}>
              <i className="fas fa-plus"></i> New Broadcast
            </button>
          )}

          {showForm && (
            <form className="announcement-form" onSubmit={onSubmit}>
              <div className="form-group row-group">
                <div className="flex-1">
                  <label>Title</label>
                  <input type="text" className="form-control" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label>Type</label>
                  <select className="form-control" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="update">General Update</option>
                    <option value="milestone">Milestone</option>
                    <option value="urgent">Urgent Alert</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Message (Markdown supported)</label>
                <textarea className="form-control" rows="4" required value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})}></textarea>
              </div>
              <div className="form-group form-check">
                <input type="checkbox" id="isPinned" checked={formData.isPinned} onChange={(e) => setFormData({...formData, isPinned: e.target.checked})} />
                <label htmlFor="isPinned">Pin to top</label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Broadcast</button>
              </div>
            </form>
          )}

          {loadingAnnouncements ? (
            <div className="loading-state"><div className="pulse-ring"></div></div>
          ) : (
            <div className="announcements-feed">
              {announcements.length === 0 ? (
                <p className="empty-state">No broadcasts posted yet.</p>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className={`announcement-card type-${a.type} ${a.is_pinned ? 'is-pinned' : ''}`}>
                    {a.is_pinned && <div className="pinned-badge"><i className="fas fa-thumbtack"></i> Pinned</div>}
                    <div className="announcement-header">
                      <div className="announcement-meta">
                        <span className={`pulse-badge pulse-${a.type}`}>{a.type.toUpperCase()}</span>
                        <h4>{a.title}</h4>
                      </div>
                      <span className="announcement-date">{formatDate(a.created_at)}</span>
                    </div>
                    
                    <div className="announcement-content markdown-body">
                      <ReactMarkdown>{a.content}</ReactMarkdown>
                    </div>

                    <div className="announcement-footer">
                      <div className="announcement-author">
                        Posted by {a.author_name}
                      </div>
                      <div className="announcement-actions">
                         <div className="ack-stats">
                           <i className="fas fa-check-double"></i> {a.ack_count} / {a.total_members} Read
                         </div>
                         <button 
                           className={`btn btn-sm ${a.is_acknowledged ? 'btn-success' : 'btn-outline'}`}
                           onClick={() => handleAcknowledge(a.id)}
                         >
                           {a.is_acknowledged ? <><i className="fas fa-check"></i> Acknowledged</> : 'Acknowledge'}
                         </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}