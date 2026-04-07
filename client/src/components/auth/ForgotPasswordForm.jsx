'use client';
import { useState } from 'react';
import { forgotPasswordSchema, validate } from '@/lib/validators';

export function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validate(forgotPasswordSchema, { email });
    if (errors?.email) {
      setEmailError(errors.email);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Server error');
      setSubmitted(true);
    } catch (err) {
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <div className="auth-success-icon">
            <i className="fas fa-envelope-open-text"></i>
          </div>
          <h2>Check your email</h2>
          <p>
            If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            The link expires in 15 minutes.
          </p>
          <button onClick={onBack} className="btn btn-secondary">
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2>Reset your password</h2>
        <p>Enter your email and we'll send you a reset link.</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${emailError ? 'has-error' : ''}`}>
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            />
            {emailError && (
              <span className="field-error">
                <i className="fas fa-exclamation-circle"></i> {emailError}
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer-nav">
          <button onClick={onBack} className="back-to-login text-btn">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}