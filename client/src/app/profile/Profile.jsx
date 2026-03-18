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
      <h1>My Profile</h1>
      
      {user && (
        <div style={{ marginBottom: '40px' }}>
          <img src={user.avatar} alt="Avatar" />
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      )}

      <hr/>

      <section style={{ marginBottom: '40px' }}>
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange} className='password-change-form'>
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Update Password</button>
        </form>
        {passwordMessage.text && (
          <p style={{ color: passwordMessage.type === 'error' ? 'red' : 'green', marginTop: '10px' }}>
            {passwordMessage.text}
          </p>
        )}
      </section>

      <hr/>

      <section>
        <h2 style={{ color: 'red' }}>Danger Zone</h2>
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        <button className='delete-acc-btn' onClick={handleDeleteAccount}>
          Delete Account
        </button>

        <button onClick={handleLogout} className='nav-link logout'>
          Log Out
        </button>
      </section>
    </div>
  );
}