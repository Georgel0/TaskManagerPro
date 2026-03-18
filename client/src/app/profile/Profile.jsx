"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './profile.css';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      try {
        const response = await fetch(`${apiUrl}/profile`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

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

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action is permanent and will delete all your projects and tasks.");

    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${apiUrl}/profile`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete account');

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err) {
      alert(err.message);
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
      <h1 style={{ marginBottom: '24px' }}>Settings</h1>

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
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange} className='password-change-form'>
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
          <p className='password-message' style={{ color: passwordMessage.type === 'error' ? 'var(--error-color)' : 'var(--success-color)'}}>
            {passwordMessage.text}
          </p>
        )}
      </div>

      <div className="profile-card danger-zone">
        <h2 style={{ color: 'var(--error-color)' }}>Danger Zone</h2>
        <p style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
          Once you delete your account, there is no going back. All projects and tasks will be removed.
        </p>
        <div className='profile-acctions'>
          <button className='delete-acc-btn' onClick={handleDeleteAccount}>
            Delete Account
          </button>
          <button onClick={handleLogout} className='btn-logout'>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}