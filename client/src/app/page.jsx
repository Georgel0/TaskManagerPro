'use client';

import { useState } from 'react';
import { generateIdenticonBase64 } from '@/lib';
import '@/styles/landingpage.css';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const userEmail = formData.email.trim().toLowerCase();

    // Generate avatar only if we are registering
    let avatar = null;
    if (!isLogin) {
      avatar = generateIdenticonBase64(userEmail, 32);
    }

    const endpoint = isLogin ? 'http://localhost:5000/api/login' : 'http://localhost:5000/api/register';

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { ...formData, avatar };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      } else {
        setErrorMsg(data.error || 'Authentication failed');
      }
    } catch (error) {
      setErrorMsg('Network error. Please try again.');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <section className="info-column">
          <div className="info-content">
            <h1>Productivity & Team Task Manager</h1>
            <p>Welcome to the ultimate solution for organizing personal and team activities.</p>

            <h2>Features</h2>
            <p>Create and manage complex projects efficiently.</p>
            <p>Track tasks with priorities and deadlines.</p>
            <p>Real-time team collaboration via comments.</p>

            <h2>About</h2>
            <p>This application is built using Next.js, Node.js, Express, and PostgreSQL.</p>
            <p>It supports file uploads, real-time notifications, and full authentication.</p>

            <br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
            <p>More features coming soon...</p>
          </div>

          <footer className="landing-footer">
            <p>&copy; 2026 Task Manager Pro. All rights reserved.</p>
          </footer>
        </section>

        <section className="auth-column">
          <div className="auth-card">
            <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
            <p>{isLogin ? 'Log in to access your dashboard.' : 'Sign up to get started.'}</p>

            {errorMsg && <p className="error-message" style={{ color: '#ff4d4d', fontSize: '14px', marginBottom: '10px' }}>{errorMsg}</p>}

            <form className="dummy-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button type="submit" className="login-btn">
                {isLogin ? 'Log In' : 'Register'}
              </button>
            </form>

            <p className="toggle-auth">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="text-btn"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Register here' : 'Log in here'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}