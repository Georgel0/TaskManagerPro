'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ForgotPasswordForm } from './(auth)/ForgotPasswordForm';
import { ResetPasswordForm } from './(auth)/ResetPasswordForm';
import { LoginRegisterForm } from './(auth)/LoginRegisterForm';
import '@/styles/landingpage.css';

export default function LandingPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState('login');

  useEffect(() => {
    if (searchParams.get('token')) {
      setView('reset');
    }
  }, [searchParams]);

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
            {view === 'login' && (
              <LoginRegisterForm onForgotClick={() => setView('forgot')} />
            )}

            {view === 'forgot' && (
              <ForgotPasswordForm onBack={() => setView('login')} />
            )}

            {view === 'reset' && (
              <ResetPasswordForm onSuccess={() => setView('login')} onBack={() => setView('login')} />
            )}
        </section>

      </div>
    </div>
  );
}