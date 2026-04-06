'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import '@/styles/notifications.css';

export function NotificationsModal() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getToken = () => localStorage.getItem('token');
  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchNotifications();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setNotifications(data);

      const unreadCount = data.filter(n => !n.read_status).length;
      if (unreadCount > 0) {
        toast(`You have ${unreadCount} unread notifications.`, { icon: <i className="fas fa-bell" style={{ color: 'var(--pri-text-color' }}></i> });
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id, currentStatus) => {
    if (currentStatus) return;
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read_status: true } : n)
      );
    } catch (err) {
      toast.error('Could not mark as read');
      console.error(err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Could not delete notification');
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    } catch (err) {
      toast.error('Failed to mark all as read');
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button 
        className="bell-icon-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
      >
        <i className="far fa-bell"></i>
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn-mark-all" title="Mark all as read">
                <i className="fas fa-check-double"></i>
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="empty-notifications">No notifications yet.</p>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id, n.read_status)}
                  className={`notification-item ${!n.read_status ? 'unread' : ''}`}
                >
                  <i className={n.read_status ? 'fas fa-envelope-open' : 'fas fa-envelope'}></i> 
                  <p className="notification-text">{n.message}</p>
                  <button 
                    onClick={(e) => deleteNotification(n.id, e)}
                    className="btn-delete-notif"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}