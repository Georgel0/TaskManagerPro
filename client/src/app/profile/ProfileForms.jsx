"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { changeUsernameSchema, changeEmailSchema, changeAvatarSchema, 
  changePasswordSchema, deleteAccountSchema, validate } from '@/lib/validators';

export function UsernameForm({ user, setUser, useProfileForm }) {
  const [newUsername, setNewUsername] = useState('');

  const { errors, setErrors, handleSubmit } = useProfileForm(
    'username',
    changeUsernameSchema,
    'Username updated successfully!',
    (payload) => {
      setUser((prev) => ({ ...prev, name: payload.newUsername }));
      setNewUsername('');
    }
  );

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit({ newUsername });
  };

  return (
    <form onSubmit={onSubmit} className="settings-form" noValidate>
      <div className="form-group">
        <label>Username</label>
        <div className="input-with-button">
          <input
            className={`form-control ${errors.newUsername ? 'input-error' : ''}`}
            type="text"
            placeholder={user?.name || "New Username"}
            value={newUsername}
            onChange={(e) => { setNewUsername(e.target.value); setErrors(p => ({ ...p, newUsername: '' })); }}
          />
          <button type="submit" className="btn btn-primary" title="Save">Save</button>
        </div>
        {errors.newUsername && <span className="field-error">{errors.newUsername}</span>}
      </div>
    </form>
  );
}

export function AvatarForm({ user, setUser, useProfileForm, getNewIdenticon }) {
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  const { errors, setErrors, handleSubmit } = useProfileForm(
    'avatar',
    changeAvatarSchema,
    'Avatar updated successfully!',
    (payload) => {
      setUser((prev) => ({ ...prev, avatar: payload.newAvatarUrl }));
      setNewAvatarUrl('');
    },
    'Validating image...'
  );

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit({ newAvatarUrl });
  };

  const handleNewIdenticon = async (seed) => {
    const newIdenticon = getNewIdenticon(seed);

    setNewAvatarUrl(newIdenticon);
    setErrors({});

    await handleSubmit({ newAvatarUrl: newIdenticon });
  };

  return (
    <form onSubmit={onSubmit} className="settings-form" noValidate>
      <div className="form-group">
        <label>Avatar URL</label>
        <div className="input-with-button">
          <input
            className={`form-control ${errors.newAvatarUrl ? 'input-error' : ''}`}
            type="url"
            placeholder="https://example.com/my-image.jpg"
            value={newAvatarUrl}
            onChange={(e) => { setNewAvatarUrl(e.target.value); setErrors(p => ({ ...p, newAvatarUrl: '' })); }}
          />
          <button className="btn btn-primary" title="Update">Update</button>
        </div>
        {errors.newAvatarUrl && <span className="field-error">{errors.newAvatarUrl}</span>}
      </div>

      <button 
        type="button" 
        className="new-identicon-btn" 
        onClick={() => handleNewIdenticon(Math.random().toString(36))} 
        title="Generate a new identicon"
      >
        Generate a new identicon <i className="fas fa-wand-magic-sparkles"></i>
      </button>
      <button 
        type="button" 
        className="new-identicon-btn" 
        onClick={() => handleNewIdenticon(user?.email || '')} 
        title="Get your original identicon back"
      >
        Get your original identicon back <i className="fas fa-arrow-rotate-left"></i>
      </button>
    </form>
  );
}

export function EmailForm({ user, setUser, useProfileForm }) {
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const { errors, setErrors, handleSubmit } = useProfileForm(
    'email',
    changeEmailSchema,
    'Email updated successfully!',
    (payload) => {
      setUser((prev) => ({ ...prev, email: payload.newEmail }));
      setNewEmail('');
      setEmailPassword('');
    }
  );

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit({ newEmail, password: emailPassword });
  };

  return (
    <form onSubmit={onSubmit} className="settings-form" noValidate>
      <div className="form-group">
        <label>New Email Address</label>
        <input
          className={`form-control ${errors.newEmail ? 'input-error' : ''}`}
          type="email"
          placeholder={user?.email || 'New Email Address'}
          value={newEmail}
          onChange={(e) => { setNewEmail(e.target.value); setErrors(p => ({ ...p, newEmail: '' })); }}
        />
        {errors.newEmail && <span className="field-error">{errors.newEmail}</span>}
      </div>

      <div className="form-group mt-4">
        <label>Confirm with your password</label>
        <div className="input-with-button">
          <input
            className={`form-control ${errors.password ? 'input-error' : ''}`}
            type="password"
            placeholder="Enter your password to confirm"
            value={emailPassword}
            onChange={(e) => { setEmailPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
          />
          <button type="submit" className="btn btn-primary" title="Update">Update</button>
        </div>
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>
    </form>
  );
}

export function PasswordForm({ useProfileForm }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { errors, setErrors, handleSubmit } = useProfileForm(
    'password',
    changePasswordSchema,
    'Password updated successfully!',
    () => {
      setCurrentPassword('');
      setNewPassword('');
    }
  );

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit({ currentPassword, newPassword });
  };

  return (
    <form onSubmit={onSubmit} className="settings-form" noValidate>
      <div className="form-group">
        <label>Current Password</label>
        <input
          className={`form-control ${errors.currentPassword ? 'input-error' : ''}`}
          type="password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setErrors(p => ({ ...p, currentPassword: '' }));
          }}
        />
        {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
      </div>

      <div className="form-group mt-4">
        <label>New Password</label>
        <div className="input-with-button">
          <input
            className={`form-control ${errors.newPassword ? 'input-error' : ''}`}
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setErrors(p => ({ ...p, newPassword: '' }));
            }}
          />
          <button type="submit" className="btn btn-primary" title="Update">Update</button>
        </div>
        {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
      </div>
    </form>
  );
}

export function DangerZone({ handleLogout }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

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

  return (
    <>
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
    </>
  );
}