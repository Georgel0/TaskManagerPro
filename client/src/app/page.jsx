'use client';
import { useState, useEffect, Suspense } from 'react'; 
import { useSearchParams } from 'next/navigation';
import { LoginRegisterForm, ResetPasswordForm, ForgotPasswordForm } from '../components/auth';
import { ParticleBackground } from '@/components/effects';
import '@/styles/landingpage.css';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const [view, setView] = useState('login');

  useEffect(() => {
    if (searchParams.get('token')) setView('reset');
  }, [searchParams]);

  return (
    <div className="landing-container">
      <div className="landing-content">

        <section className="info-column">
          <div className="info-content">

            <div className="info-logo">
              <div className="info-logo-image"></div>
              <span className="info-logo-text">Task Manager Pro</span>
            </div>

            <div className="info-hero">
              <h1>Organize your work.<br />Ship faster.</h1>
              <p className="info-hero-sub">
                A productivity platform for individuals and teams.
                Manage projects, track tasks, and collaborate — all in one place.
              </p>
            </div>

            <div className="info-features">
              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <i className="fas fa-folder-open"></i>
                </div>
                <div>
                  <h3>Project Management</h3>
                  <p>Create projects, invite members by email, and control who can edit what with owner and member roles.</p>
                </div>
              </div>

              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <i className="fas fa-tasks"></i>
                </div>
                <div>
                  <h3>Task Tracking</h3>
                  <p>Assign tasks with priorities, deadlines, and statuses. Filter by project, member, or completion.</p>
                </div>
              </div>

              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <i className="fas fa-comments"></i>
                </div>
                <div>
                  <h3>Team Collaboration</h3>
                  <p>Discuss directly on tasks via comments. Edit or delete your own, with full moderation for project owners.</p>
                </div>
              </div>

              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <div>
                  <h3>Dashboard Overview</h3>
                  <p>See active tasks, upcoming deadlines, and team stats at a glance from your personal dashboard.</p>
                </div>
              </div>
            </div>

            <div className="info-stack">
              <span className="info-stack-label">Built with</span>
              <div className="info-stack-badges">
                {['Next.js', 'Node.js', 'Express', 'PostgreSQL'].map((tech) => (
                  <span key={tech} className="info-stack-badge">{tech}</span>
                ))}
              </div>
            </div>

          </div>

          <footer className="landing-footer">
            <p>&copy; 2026 Task Manager Pro. All rights reserved.</p>
          </footer>
        </section>

        <section className="auth-column">
          <ParticleBackground />

          {view === 'login' && <LoginRegisterForm onForgotClick={() => setView('forgot')} />}
          {view === 'forgot' && <ForgotPasswordForm onBack={() => setView('login')} />}
          {view === 'reset' && ( <ResetPasswordForm onSuccess={() => setView('login')} onBack={() => setView('login')} />)}
        </section>

      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="landing-container">Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}