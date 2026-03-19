"use client";
import { useState, useEffect } from 'react';
import { useApp } from '@/context';

import './profile.css';

export default function ProfilePage() {
  const { user, setUser, loading } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const [newUsername, setNewUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState({ type: '', text: '' });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });


  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUsernameMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/profile/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },

        body: JSON.stringify({ newUsername })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update username.');
      }

      setUsernameMessage({ type: 'success', text: 'Username updated successfully!' });
      setNewUsername('');

      setUser(prevUser => ({ ...prevUser, name: newUsername }));

    } catch (err) {
      setUsernameMessage({ type: 'error', text: err.message });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteAccountClick = () => {
    setIsDeleteModalOpen(true);
    setDeleteMessage({ type: '', text: '' });
    setDeletePassword('');
  };

  const confirmDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/profile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to delete account');

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err) {
      setDeleteMessage({ type: 'error', text: err.message });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="profile-container">
      <h1 style={{ marginBottom: '24px' }}>Profile</h1>

      {user && (
        <div className="profile-card profile-header">
          <img className="profile-avatar" src={user.avatar} alt="Avatar" />
          <div className="info-group">
            <p><strong>{user.name}</strong></p>
            <p>{user.email}</p>
            <p style={{ fontSize: '0.85rem' }}>Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      <div className="profile-card form-section">
        <h2>Change Username</h2>
        <form onSubmit={handleUsernameChange} className='password-change-form'>
          <input
            className="input-field"
            type="text"
            placeholder="New Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Update Username</button>
        </form>
        {usernameMessage.text && (
          <p className='password-message' style={{ color: usernameMessage.type === 'error' ? 'var(--error-color)' : 'var(--success-color)' }}>
            {usernameMessage.text}
          </p>
        )}

        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange} className='username-change-form'>
          <input
            className="input-field"
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            className="input-field"
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Update Password</button>
        </form>
        {passwordMessage.text && (
          <p className='password-message' style={{ color: passwordMessage.type === 'error' ? 'var(--error-color)' : 'var(--success-color)' }}>
            {passwordMessage.text}
          </p>
        )}
      </div>

      <div className="profile-card danger-zone">
        <h2>Danger Zone</h2>
        <p>Once you delete your account, there is no going back. All projects and tasks will be removed.</p>
        <div className='profile-acctions'>
          <button className='delete-acc-btn' onClick={handleDeleteAccountClick}>
            Delete Account
          </button>
          <button onClick={handleLogout} className='logout'>
            Log Out
          </button>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Deletion</h2>
            <p>This action is permanent. All your projects and tasks will be permanently removed.</p>

            <form onSubmit={confirmDeleteAccount} className="delete-modal-form">
              <input
                className="input-field"
                type="password"
                placeholder="Enter your password to confirm"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
              {deleteMessage.text && (
                <p className='password-message' style={{ color: 'var(--error-color)', margin: '10px 0' }}>
                  {deleteMessage.text}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="delete-acc-btn">
                  Permanently Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}