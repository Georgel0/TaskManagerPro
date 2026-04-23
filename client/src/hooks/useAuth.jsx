import { useState } from 'react';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, validate } from '@/lib/validators';
import { generateIdenticonBase64 } from '@/lib';

export function useAuth() {
  const API = process.env.NEXT_PUBLIC_API_URL;


  const [isLogin, setIsLogin] = useState(true);
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });
  const [authErrors, setAuthErrors] = useState({});
  const [authServerError, setAuthServerError] = useState('');
  const [loginFailed, setLoginFailed] = useState(false);

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthData({ ...authData, [name]: value });
    if (authErrors[name]) setAuthErrors({ ...authErrors, [name]: '' });
  };

  const switchAuthMode = () => {
    setIsLogin(!isLogin);
    setAuthErrors({});
    setAuthServerError('');
    setAuthData({ name: '', email: '', password: '' });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthServerError('');

    const schema = isLogin ? loginSchema : registerSchema;
    const fieldErrors = validate(schema, authData);
    if (fieldErrors) {
      setAuthErrors(fieldErrors);
      return;
    }
    setAuthErrors({});

    const userEmail = authData.email.trim().toLowerCase();
    let avatar = null;
    if (!isLogin) {
      avatar = generateIdenticonBase64(userEmail, 32);
    }

    const endpoint = isLogin ? `${API}/login` : `${API}/register`;
    const payload = isLogin
      ? { email: userEmail, password: authData.password }
      : { ...authData, email: userEmail, avatar };

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
        setAuthServerError(data.error || 'Authentication failed.');
        setLoginFailed(true);
      }
    } catch {
      setAuthServerError('Network error. Please try again.');
      setLoginFailed(true);
    }
  };


  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotIsLoading, setForgotIsLoading] = useState(false);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    const errors = validate(forgotPasswordSchema, { email: forgotEmail });
    if (errors?.email) {
      setForgotEmailError(errors.email);
      return;
    }

    setForgotIsLoading(true);
    try {
      const res = await fetch(`${API}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (!res.ok) throw new Error('Server error');
      setForgotSubmitted(true);
    } catch (err) {
      setForgotEmailError('Something went wrong. Please try again.');
    } finally {
      setForgotIsLoading(false);
    }
  };


  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetFieldErrors, setResetFieldErrors] = useState({});
  const [resetIsLoading, setResetIsLoading] = useState(false);
  const [resetServerError, setResetServerError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetSubmit = async (e, { token, userId, onSuccess }) => {
    e.preventDefault();
    setResetServerError('');

    const errors = validate(resetPasswordSchema, {
      newPassword: resetNewPassword,
      confirmPassword: resetConfirmPassword
    });
    if (errors) {
      setResetFieldErrors(errors);
      return;
    }

    setResetIsLoading(true);
    try {
      const res = await fetch(`${API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId, newPassword: resetNewPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResetSuccess(true);
      setTimeout(() => { if (onSuccess) onSuccess(); }, 2500);
    } catch (err) {
      setResetServerError(err.message);
    } finally {
      setResetIsLoading(false);
    }
  };

  return {
    loginReg: {
      isLogin, authData, authErrors, authServerError, loginFailed,
      handleAuthInputChange, handleAuthSubmit, switchAuthMode,
    },
    forgotPwd: {
      forgotEmail, setForgotEmail, forgotEmailError, setForgotEmailError,
      forgotSubmitted, forgotIsLoading, handleForgotSubmit,
    },
    resetPwd: {
      resetNewPassword, setResetNewPassword, resetConfirmPassword, setResetConfirmPassword,
      resetFieldErrors, setResetFieldErrors, resetIsLoading, resetServerError, resetSuccess,
      handleResetSubmit,
    }
  };
}