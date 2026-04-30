'use client';

import { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usePushNotifications } from '@/hooks';

const getToken = () => localStorage.getItem('token');
const API = process.env.NEXT_PUBLIC_API_URL;

const fetchNotifications = async () => {
  const res = await fetch(`${API}/notifications`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Unauthorized or Server Error');
  return res.json();
};

export function NotificationsModal() {
  const { permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();
  const isFirstLoad = useRef(true);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    onSuccess: (data) => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        const unreadCount = data.filter((n) => !n.read_status).length;
        if (unreadCount > 0) {
          toast(`You have ${unreadCount} unread notifications.`, {
            icon: <i className="fas fa-bell" style={{ color: 'var(--pri-text-color)' }}></i>,
          });
        }
      }
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await fetch(`${API}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: (_, id) => {
      // Update cache
      queryClient.setQueryData(['notifications'], (prev) =>
        prev.map((n) => n.id === id ? { ...n, read_status: true } : n)
      );
    },
    onError: () => toast.error('Could not mark as read'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await fetch(`${API}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications'], (prev) =>
        prev.filter((n) => n.id !== id)
      );
      toast.success('Notification deleted');
    },
    onError: () => toast.error('Could not delete notification'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${API}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (prev) =>
        prev.map((n) => ({ ...n, read_status: true }))
      );
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button
        className="bell-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
      >
        <i className="far fa-bell"></i>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div className="notif-header-actions">
              <div className="push-toggle">
                {'Notification' in window && (
                  <button
                    className="btn-mark-all"
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    title={isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
                  >
                    <i className={`fas ${isSubscribed ? 'fa-bell-slash' : 'fa-bell'}`}></i>
                  </button>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="btn-mark-all"
                  title="Mark all as read"
                >
                  <i className="fas fa-check-double"></i>
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="empty-notifications">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read_status && markAsReadMutation.mutate(n.id)}
                  className={`notification-item ${!n.read_status ? 'unread' : ''}`}
                >
                  <i className={n.read_status ? 'fas fa-envelope-open' : 'fas fa-envelope'}></i>
                  <p className="notification-text">{n.message}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
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