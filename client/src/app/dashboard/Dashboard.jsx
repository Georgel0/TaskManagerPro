'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if token exists in storage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken) {
      // If no token, kick them back to the login page
      window.location.href = '/';
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: '40px' }}>
      <h1>Welcome, {user.name}!</h1>
      <p>Your session is active and secure.</p>
      <button onClick={handleLogout} className="logout-btn">Log Out</button>
    </div>
  );
}