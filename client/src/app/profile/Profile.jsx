"use client";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '@/context';
import {
  changeUsernameSchema, changeEmailSchema,
  changeAvatarSchema, changePasswordSchema,
  deleteAccountSchema, validate
} from '@/lib/validators';
import './profile.css';

export default function ProfilePage() {
  const { user, setUser, loading } = useApp();

  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [emailPassword, setEmailPassword] = useState('');
  const [emailPasswordError, setEmailPasswordError] = useState('');

  const fetchWithAuth = async (endpoint, payload) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Failed to update ${endpoint}.`);
    return data;
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUsernameError('');

    const errors = validate(changeUsernameSchema, { newUsername });
    if (errors) return setUsernameError(errors.newUsername);

    try {
      await fetchWithAuth('username', { newUsername });

      toast.success('Username updated successfully!');
      setUser((prev) => ({ ...prev, name: newUsername }));
      setNewUsername('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailPasswordError('');

    const errors = validate(changeEmailSchema, { newEmail, password: emailPassword });
    if (errors) {
      if (errors.newEmail) setEmailError(errors.newEmail);
      if (errors.password) setEmailPasswordError(errors.password);
      return;
    }

    try {
      await fetchWithAuth('email', { newEmail, password: emailPassword });
      toast.success('Email updated successfully!');
      setUser((prev) => ({ ...prev, email: newEmail }));
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAvatarChange = async (e) => {
    e.preventDefault();
    setAvatarError('');

    const errors = validate(changeAvatarSchema, { newAvatarUrl });
    if (errors) return setAvatarError(errors.newAvatarUrl);

    const loader = toast.loading('Validating image...');

    try {
      await fetchWithAuth('avatar', { newAvatarUrl });

      toast.success('Avatar updated successfully!', { id: loader });
      setUser((prev) => ({ ...prev, avatar: newAvatarUrl }));
      setNewAvatarUrl('');
    } catch (err) {
      toast.error(err.message, { id: loader });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    const errors = validate(changePasswordSchema, { currentPassword, newPassword });
    if (errors) return setPasswordErrors(errors);

    try {
      await fetchWithAuth('password', { currentPassword, newPassword });

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
    if (errors) return setDeleteError(errors.password);

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

      handleLogout();
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
    <div className='loading-state profile-loading'>
      <div className="pulse-ring"></div>
      <p>Loading Profile...</p>
    </div>
  );

  return (
    <div className="profile-page-container">
      <div className="profile-header-banner">
        <div className="profile-header-content">
          <h1>Account Settings</h1>
          <p>Manage your profile details, security preferences, and account data.</p>
        </div>
      </div>

      <div className="profile-layout page-content">
        <div className="profile-sidebar">
          {user && (
            <div className="card profile-overview">
              <div className="profile-avatar-wrapper">
                <img className="profile-avatar-large" src={user.avatar} alt={`${user.name}'s avatar`} />
              </div>
              <h2 className="profile-name-large" title={`Name: ${user.name}`}>{user.name}</h2>
              <p className="profile-email-badge" title={`Email: ${user.email}`}>{user.email}</p>
              <p className="profile-join-date" title={`Joined at: ${new Date(user.created_at).toLocaleDateString()}`}>
                <i className="fas fa-calendar-alt"></i> Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
              <button onClick={handleLogout} className="btn btn-secondary btn-logout" title="Log Out">Log Out</button>
            </div>
          )}

          <div className="card danger-zone">
            <div className="danger-icon-wrapper">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="danger-text">
              <h3 className="profile-danger-title">Danger Zone</h3>
              <p className="profile-danger-desc">
                Permanently remove your account and all related data. This action is irreversible.
              </p>
            </div>
            <button
              className="btn btn-danger btn-full"
              title="Delete Account"
              onClick={() => { setIsDeleteModalOpen(true); setDeletePassword(''); setDeleteError(''); }}
            >
              Delete Account
            </button>
          </div>
        </div>

        <div className="profile-settings-grid">
          <div className="card settings-card">
            <div className="settings-header">
              <h3>Public Profile</h3>
              <p>Update your identifying information visible to others.</p>
            </div>

            <form onSubmit={handleUsernameChange} className="settings-form" noValidate>
              <div className="form-group">
                <label>Username</label>
                <div className="input-with-button">
                  <input
                    className={`form-control ${usernameError ? 'input-error' : ''}`}
                    type="text"
                    placeholder={user?.name || "New Username"}
                    value={newUsername}
                    onChange={(e) => { setNewUsername(e.target.value); setUsernameError(''); }}
                  />
                  <button type="submit" className="btn btn-primary" title="Save">Save</button>
                </div>
                {usernameError && <span className="field-error">{usernameError}</span>}
              </div>
            </form>

            <form onSubmit={handleAvatarChange} className="settings-form" noValidate>
              <div className="form-group">
                <label>Avatar URL</label>
                <div className="input-with-button">
                  <input
                    className={`form-control ${avatarError ? 'input-error' : ''}`}
                    type="url"
                    placeholder="https://example.com/my-image.jpg"
                    value={newAvatarUrl}
                    onChange={(e) => { setNewAvatarUrl(e.target.value); setAvatarError(''); }}
                  />
                  <button type="submit" className="btn btn-primary" title="Update">Update</button>
                </div>
                {avatarError && <span className="field-error">{avatarError}</span>}
              </div>
            </form>
          </div>

          <div className="card settings-card">
            <div className="settings-header">
              <h3>Account Security</h3>
              <p>Manage your email address and password credentials.</p>
            </div>

            <form onSubmit={handleEmailChange} className="settings-form" noValidate>
              <div className="form-group">
                <label>New Email Address</label>
                <input
                  className={`form-control ${emailError ? 'input-error' : ''}`}
                  type="email"
                  placeholder={user?.email || 'New Email Address'}
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }}
                />
                {emailError && <span className="field-error">{emailError}</span>}
              </div>

              <div className="form-group mt-4">
                <label>Confirm with your password</label>
                <div className="input-with-button">
                  <input
                    className={`form-control ${emailPasswordError ? 'input-error' : ''}`}
                    type="password"
                    placeholder="Enter your password to confirm"
                    value={emailPassword}
                    onChange={(e) => { setEmailPassword(e.target.value); setEmailPasswordError(''); }}
                  />
                  <button type="submit" className="btn btn-primary" title="Update">Update</button>
                </div>
                {emailPasswordError && <span className="field-error">{emailPasswordError}</span>}
              </div>
            </form>

            <form onSubmit={handlePasswordChange} className="settings-form" noValidate>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  className={`form-control ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordErrors(p => ({ ...p, currentPassword: '' }));
                  }}
                />
                {passwordErrors.currentPassword && <span className="field-error">{passwordErrors.currentPassword}</span>}
              </div>

              <div className="form-group mt-4">
                <label>New Password</label>
                <div className="input-with-button">
                  <input
                    className={`form-control ${passwordErrors.newPassword ? 'input-error' : ''}`}
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordErrors(p => ({ ...p, newPassword: '' }));
                    }}
                  />
                  <button type="submit" className="btn btn-primary" title="Update">Update</button>
                </div>
                {passwordErrors.newPassword && <span className="field-error">{passwordErrors.newPassword}</span>}
              </div>
            </form>
          </div>
        </div>

        {isDeleteModalOpen && (
          <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
            <div className="modal-content danger-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="profile-danger-title">Confirm Deletion</h2>
                <button className="btn-icon" onClick={() => setIsDeleteModalOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={confirmDeleteAccount} noValidate>
                <div className="modal-body">
                  <p className="profile-modal-desc">
                    This action is permanent. All your projects, tasks, and data will be completely wiped from our servers. <strong>You cannot undo this.</strong>
                  </p>
                  <div className="form-group">
                    <label>Confirm your password</label>
                    <input
                      className={`form-control ${deleteError ? 'input-error' : ''}`}
                      type="password"
                      placeholder="Enter your password to confirm"
                      value={deletePassword}
                      onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                      autoFocus
                    />
                    {deleteError && <span className="field-error">{deleteError}</span>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)} title="Close">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger" title="Delete">
                    Permanently Delete
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}