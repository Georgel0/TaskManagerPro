import '@/styles/landingpage.css';
import Link from 'next/link';

export default function LandingPage() {
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
            
            <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
            <p>More features coming soon...</p>
          </div>
        </section>

        <section className="auth-column">
          <div className="auth-card">
            <h2>Welcome Back</h2>
            <p>Log in to access your dashboard.</p>
            <form className="dummy-form">
              <input type="email" placeholder="Email" />
              <input type="password" placeholder="Password" />
              <Link href="/dashboard" className="login-btn">
                Log In
              </Link>
            </form>
          </div>
        </section>
      </div>
      
      <footer className="landing-footer">
        <p>&copy; 2026 Task Manager Pro. All rights reserved.</p>
      </footer>
    </div>
  );
}