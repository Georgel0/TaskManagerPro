"use client";

import { useState } from 'react';
import {
  changeUsernameSchema, changeEmailSchema, changeAvatarSchema,
  changePasswordSchema, changeBioSchema
} from '@/lib/validators';
import { autoResize } from '@/lib';

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

export function BioForm({ user, setUser, useProfileForm }) {
  const [newBio, setNewBio] = useState(user?.bio || '');

  const { errors, setErrors, handleSubmit } = useProfileForm(
    'bio',
    changeBioSchema,
    'Bio updated successfully!',
    (payload) => {
      setUser((prev) => ({ ...prev, bio: payload.newBio }));
    }
  );

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit({ newBio });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={onSubmit} className="settings-form" noValidate>
      <div className="form-group">
        <label>Bio</label>
        <div className="input-with-button">
          <textarea
            className={`form-control bio ${errors.newBio ? 'input-error' : ''}`}
            placeholder="Tell others a little about yourself..."
            value={newBio}
            onChange={(e) => { setNewBio(e.target.value); setErrors(p => ({ ...p, newBio: '' })); }}
            onInput={autoResize}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="btn btn-primary" title="Save">Save</button>
        </div>
        {errors.newBio && <span className="field-error">{errors.newBio}</span>}
      </div>
    </form>
  );
}