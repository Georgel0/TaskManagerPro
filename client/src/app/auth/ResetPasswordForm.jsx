'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPasswordSchema, validate } from '@/lib/validators';

export function ResetPasswordForm({ onSuccess, onBack }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !userId) onBack;
  }, [token, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validate(resetPasswordSchema, { newPassword, confirmPassword });
    if (errors) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
      setTimeout(() => router.push('/'), 2500);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <div className="auth-success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Password reset!</h2>
          <p className="text-secondary">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <h2>Choose a new password</h2>
        <p className="text-secondary">Please enter your new security credentials below.</p>

        {serverError && (
          <div className="error-message auth-form">
            <i className="fas fa-exclamation-circle"></i> {serverError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${fieldErrors.newPassword ? 'has-error' : ''}`}>
            <label>New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="At least 4 characters"
              value={newPassword}
              onChange={(e) => { 
                setNewPassword(e.target.value); 
                setFieldErrors((p) => ({ ...p, newPassword: undefined })); 
              }}
            />
            {fieldErrors.newPassword && (
              <span className="field-error">{fieldErrors.newPassword}</span>
            )}
          </div>

          <div className={`form-group ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
            <label>Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => { 
                setConfirmPassword(e.target.value); 
                setFieldErrors((p) => ({ ...p, confirmPassword: undefined })); 
              }}
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer-nav">
          <button onClick={onBack} className="text-secondary text-sm text-btn">← Back to Login</button>
        </div>
      </div>
    </div>
  );
}