"use client";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '@/context';
import { changeUsernameSchema, changePasswordSchema, deleteAccountSchema, validate } from '@/lib';
import './profile.css';

export default function ProfilePage() {
  const { user, setUser, loading } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUsernameError('');

    const errors = validate(changeUsernameSchema, { newUsername });
    if (errors) {
      setUsernameError(errors.newUsername);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newUsername }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update username.');

      toast.success('Username updated successfully!');
      setNewUsername('');
      setUser((prev) => ({ ...prev, name: newUsername }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    const errors = validate(changePasswordSchema, { currentPassword, newPassword });
    if (errors) {
      setPasswordErrors(errors);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update password.');

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    const errors = validate(deleteAccountSchema, { password: deletePassword });
    if (errors) {
      setDeleteError(errors.password);
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete account.');

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) return (
    <div className='loading-state'>
      <div className="pulse-ring"></div>
      <p>Loading...</p>
    </div>
  );

  return (
    <div className="profile-container page-content">
      <h1 className="mb-4">Profile</h1>

      {user && (
        <div className="card profile-card profile-header">
          <img className="profile-avatar" src={user.avatar} alt="Avatar" />
          <div className="profile-info-group">
            <p className="profile-name">{user.name}</p>
            <p className="text-secondary">{user.email}</p>
            <p className="text-sm text-secondary mt-2">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <div className="card profile-card">
        <h2 className="mb-3">Change Username</h2>
        <form onSubmit={handleUsernameChange} className="form-group mb-4 d-flex flex-col gap-sm" noValidate>
          <input
            className={`form-control ${usernameError ? 'input-error' : ''}`}
            type="text"
            placeholder="New Username"
            value={newUsername}
            onChange={(e) => {
              setNewUsername(e.target.value);
              if (usernameError) setUsernameError('');
            }}
          />
          {usernameError && <span className="field-error">{usernameError}</span>}
          <button type="submit" className="btn btn-primary">Update Username</button>
        </form>

        <h2 className="mb-3 mt-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="form-group d-flex flex-col gap-sm" noValidate>
          <input
            className={`form-control ${passwordErrors.currentPassword ? 'input-error' : ''}`}
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (passwordErrors.currentPassword) setPasswordErrors((p) => ({ ...p, currentPassword: '' }));
            }}
          />
          {passwordErrors.currentPassword && (
            <span className="field-error">{passwordErrors.currentPassword}</span>
          )}

          <input
            className={`form-control ${passwordErrors.newPassword ? 'input-error' : ''}`}
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (passwordErrors.newPassword) setPasswordErrors((p) => ({ ...p, newPassword: '' }));
            }}
          />
          {passwordErrors.newPassword && (
            <span className="field-error">{passwordErrors.newPassword}</span>
          )}

          <button type="submit" className="btn btn-primary">Update Password</button>
        </form>
      </div>

      <div className="card profile-card danger-zone">
        <h2 className="text-error mb-2">Danger Zone</h2>
        <p className="mb-4 text-sm">
          Once you delete your account, there is no going back. All projects and tasks will be removed.
        </p>
        <div className="profile-actions">
          <button
            className="btn btn-danger"
            onClick={() => { setIsDeleteModalOpen(true); setDeletePassword(''); setDeleteError(''); }}
          >
            Delete Account
          </button>
          <button onClick={handleLogout} className="btn-logout">Log Out</button>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-error">Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setIsDeleteModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={confirmDeleteAccount} noValidate>
              <div className="modal-body">
                <p className="mb-3 text-secondary">
                  This action is permanent. All your projects and tasks will be permanently removed.
                </p>
                <div className="form-group">
                  <input
                    className={`form-control ${deleteError ? 'input-error' : ''}`}
                    type="password"
                    placeholder="Enter your password to confirm"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deleteError) setDeleteError('');
                    }}
                    autoFocus
                  />
                  {deleteError && <span className="field-error">{deleteError}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">Permanently Delete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}