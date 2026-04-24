"use client";

import { useState } from 'react';
import { useApp } from '@/context';
import { generateIdenticonBase64 } from '@/lib';
import { validate } from '@/lib/validators';
import toast from 'react-hot-toast';
import { UsernameForm, AvatarForm, EmailForm, PasswordForm, BioForm } from './ProfileForms';
import { ProfileStatsExpanded, DangerZone, ProfileSkeleton } from './components';
import './profile.css';

export default function ProfilePage() {
  const { user, setUser, loading } = useApp();

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const getNewIdenticon = (seed) => {
    return generateIdenticonBase64(seed);
  };

  const useProfileForm = (endpoint, schema, successMessage, onUpdate, customToastLoader = null) => {
    const [errors, setErrors] = useState({});

    const handleSubmit = async (payload) => {
      setErrors({});
      const validationErrors = validate(schema, payload);

      if (validationErrors) {
        setErrors(validationErrors);
        return false;
      }

      let toastId;
      if (customToastLoader) {
        toastId = toast.loading(customToastLoader);
      }

      try {
        await fetchWithAuth(endpoint, payload);

        if (toastId) toast.success(successMessage, { id: toastId });
        else toast.success(successMessage);

        if (onUpdate) onUpdate(payload);
        return true;
      } catch (err) {
        if (toastId) toast.error(err.message, { id: toastId });
        else toast.error(err.message);
        return false;
      }
    };

    return { errors, setErrors, handleSubmit };
  };

  if (loading || !user) {
    return <ProfileSkeleton />
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header-content">
        <h1>Account</h1>
        <p>Manage your profile details, security preferences, and account data.</p>
      </div>

      <div className="profile-layout page-content">
        <div className="profile-sidebar">
          {user && (
            <>
              <div className="card profile-overview">
                <div className="profile-avatar-wrapper">
                  <img className="profile-avatar-large" src={user.avatar} alt={`${user.name}'s avatar`} />
                </div>
                <h2 className="profile-name-large" title={`Name: ${user.name}`}>{user.name}</h2>
                <p className="profile-email-badge" title={`Email: ${user.email}`}>{user.email}</p>
                <p className="profile-bio-text" title="Bio">{user.bio}</p>
                <p className="profile-join-date" title={`Joined at: ${new Date(user.created_at).toLocaleDateString()}`}>
                  <i className="fas fa-calendar-alt"></i> Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
                <button onClick={handleLogout} className="btn btn-secondary btn-logout" title="Log Out">Log Out</button>
              </div>

              <div className="card profile-stats-card">
                <div className="profile-stats-header">
                  <h3 className="profile-stats-title">
                    <i className="fas fa-chart-bar"></i> Stats
                  </h3>
                  <div className="profile-score-badge" title="Productivity score: tasks completed / total">
                    <i className="fas fa-bolt"></i>
                    {user.stats?.performance?.score ?? 0}%
                  </div>
                </div>

                <div className="profile-stats-grid">
                  <div className="profile-stat-item" title="Total Projects">
                    <span className="profile-stat-value">{user.stats?.projects ?? 0}</span>
                    <span className="profile-stat-label">Projects</span>
                  </div>
                  <div className="profile-stat-item" title="Total Tasks">
                    <span className="profile-stat-value">{user.stats?.tasks ?? 0}</span>
                    <span className="profile-stat-label">Tasks</span>
                  </div>
                  <div className="profile-stat-item" title="Task Completed">
                    <span className="profile-stat-value">{user.stats?.completed ?? 0}</span>
                    <span className="profile-stat-label">Done</span>
                  </div>
                  <div className="profile-stat-item" title="Total Comments">
                    <span className="profile-stat-value">{user.stats?.engagement ?? 0}</span>
                    <span className="profile-stat-label">Comments</span>
                  </div>
                </div>

                <ProfileStatsExpanded stats={user.stats} />
              </div>
            </>
          )}

          <DangerZone handleLogout={handleLogout} />
        </div>

        <div className="profile-settings-grid">
          <div className="card settings-card">
            <div className="settings-header">
              <h3>Public Profile</h3>
              <p>Update your identifying information visible to others.</p>
            </div>

            <UsernameForm
              user={user}
              setUser={setUser}
              useProfileForm={useProfileForm}
            />

            <BioForm
              user={user}
              setUser={setUser}
              useProfileForm={useProfileForm}
            />

            <AvatarForm
              user={user}
              setUser={setUser}
              useProfileForm={useProfileForm}
              getNewIdenticon={getNewIdenticon}
            />
          </div>

          <div className="card settings-card">
            <div className="settings-header">
              <h3>Account Security</h3>
              <p>Manage your email address and password credentials.</p>
            </div>

            <EmailForm
              user={user}
              setUser={setUser}
              useProfileForm={useProfileForm}
            />
            <PasswordForm
              useProfileForm={useProfileForm}
            />
          </div>
        </div>
      </div>
    </div>
  );
}