'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks';


export function LoginRegisterForm({ onForgotClick }) {
  const { loginReg } = useAuth();
  const {
    isLogin, authData, authErrors, authServerError, loginFailed,
    handleAuthInputChange, handleAuthSubmit, switchAuthMode
  } = loginReg;

  return (
    <div className="card auth-card">
      <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
      <p className="login-signup-text">
        {isLogin ? 'Log in to access your dashboard.' : 'Sign up to get started.'}
      </p>

      <form className="auth-form" onSubmit={handleAuthSubmit} noValidate>
        {!isLogin && (
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={authData.name}
              onChange={handleAuthInputChange}
              className={`form-control ${authErrors.name ? 'input-error' : ''}`}
            />
            {authErrors.name && <span className="field-error">{authErrors.name}</span>}
          </div>
        )}

        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={authData.email}
            onChange={handleAuthInputChange}
            className={`form-control ${authErrors.email ? 'input-error' : ''}`}
          />
          {authErrors.email && <span className="field-error">{authErrors.email}</span>}
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={authData.password}
            onChange={handleAuthInputChange}
            className={`form-control ${authErrors.password ? 'input-error' : ''}`}
          />
          {authErrors.password && <span className="field-error">{authErrors.password}</span>}
        </div>

        <button type="submit" className="btn btn-primary">
          {isLogin ? 'Log In' : 'Register'}
        </button>
      </form>

      {authServerError && (
        <p className="error-message text-sm">
          <i className="fas fa-exclamation-triangle"></i> {authServerError}
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
        <button type="button" className="text-btn" onClick={switchAuthMode}>
          {isLogin ? 'Register here' : 'Log in here'}
        </button>
      </p>
    </div>
  );
}


export function ForgotPasswordForm({ onBack }) {
  const { forgotPwd } = useAuth();
  const {
    forgotEmail, setForgotEmail, forgotEmailError, setForgotEmailError,
    forgotSubmitted, forgotIsLoading, handleForgotSubmit
  } = forgotPwd;

  if (forgotSubmitted) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <div className="auth-success-icon">
            <i className="fas fa-envelope-open-text"></i>
          </div>
          <h2>Check your email</h2>
          <p>
            If an account exists for <strong>{forgotEmail}</strong>, we've sent a password reset link.
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

        <form className="auth-form" onSubmit={handleForgotSubmit} noValidate>
          <div className={`form-group ${forgotEmailError ? 'has-error' : ''}`}>
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); setForgotEmailError(''); }}
            />
            {forgotEmailError && (
              <span className="field-error">
                <i className="fas fa-exclamation-circle"></i> {forgotEmailError}
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={forgotIsLoading}>
            {forgotIsLoading ? 'Sending...' : 'Send Reset Link'}
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


export function ResetPasswordForm({ onSuccess, onBack }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const { resetPwd } = useAuth();
  const {
    resetNewPassword, setResetNewPassword, resetConfirmPassword, setResetConfirmPassword,
    resetFieldErrors, setResetFieldErrors, resetIsLoading, resetServerError, resetSuccess,
    handleResetSubmit
  } = resetPwd;

  useEffect(() => {
    if (!token || !userId) onBack();
  }, [token, userId, onBack]);

  const onSubmit = (e) => handleResetSubmit(e, { token, userId, onSuccess });

  if (resetSuccess) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <div className="auth-success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Password reset!</h2>
          <p>Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2>Choose a new password</h2>
        <p>Please enter your new security credentials below.</p>

        {resetServerError && (
          <div className="error-message auth-form">
            <i className="fas fa-exclamation-circle"></i> {resetServerError}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className={`form-group ${resetFieldErrors.newPassword ? 'has-error' : ''}`}>
            <label>New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="At least 4 characters"
              value={resetNewPassword}
              onChange={(e) => { 
                setResetNewPassword(e.target.value); 
                setResetFieldErrors((p) => ({ ...p, newPassword: undefined })); 
              }}
            />
            {resetFieldErrors.newPassword && (
              <span className="field-error">{resetFieldErrors.newPassword}</span>
            )}
          </div>

          <div className={`form-group ${resetFieldErrors.confirmPassword ? 'has-error' : ''}`}>
            <label>Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Repeat your password"
              value={resetConfirmPassword}
              onChange={(e) => { 
                setResetConfirmPassword(e.target.value); 
                setResetFieldErrors((p) => ({ ...p, confirmPassword: undefined })); 
              }}
            />
            {resetFieldErrors.confirmPassword && (
              <span className="field-error">{resetFieldErrors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={resetIsLoading}>
            {resetIsLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer-nav">
          <button onClick={onBack} className="back-to-login text-btn">← Back to Login</button>
        </div>
      </div>
    </div>
  );
}