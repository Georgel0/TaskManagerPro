'use client';

import { useState } from 'react';
import { registerSchema, loginSchema, validate } from '@/lib/validators';
import { generateIdenticonBase64 } from '@/lib';

export function LoginRegisterForm({ onForgotClick }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loginFailed, setLoginFailed] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const schema = isLogin ? loginSchema : registerSchema;
    const fieldErrors = validate(schema, formData);
    if (fieldErrors) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const userEmail = formData.email.trim().toLowerCase();
    let avatar = null;
    if (!isLogin) {
      avatar = generateIdenticonBase64(userEmail, 32);
    }

    const API = process.env.NEXT_PUBLIC_API_URL;
    const endpoint = isLogin ? `${API}/login` : `${API}/register`;
    const payload = isLogin
      ? { email: userEmail, password: formData.password }
      : { ...formData, email: userEmail, avatar };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      } else {
        setServerError(data.error || 'Authentication failed.');
        setLoginFailed(true);
      }
    } catch {
      setServerError('Network error. Please try again.');
      setLoginFailed(true);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setServerError('');
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="auth-card">
      <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
      <p className="login-signup-text">
        {isLogin ? 'Log in to access your dashboard.' : 'Sign up to get started.'}
      </p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {!isLogin && (
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-control ${errors.name ? 'input-error' : ''}`}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
        )}

        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            className={`form-control ${errors.email ? 'input-error' : ''}`}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            className={`form-control ${errors.password ? 'input-error' : ''}`}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <button type="submit" className="btn btn-primary">
          {isLogin ? 'Log In' : 'Register'}
        </button>
      </form>

      {serverError && (
        <p className="error-message text-sm">
          <i className="fas fa-exclamation-triangle"></i> {serverError}
        </p>
      )}

      {loginFailed && (
        <div className="auth-footer-nav">
          <button onClick={onForgotClick}>
            Forgot your password?
          </button>
        </div>
      )}

      <p className="toggle-auth">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button type="button" className="text-btn" onClick={switchMode}>
          {isLogin ? 'Register here' : 'Log in here'}
        </button>
      </p>
    </div>
  );
}