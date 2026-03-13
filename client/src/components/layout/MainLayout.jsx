import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      
      <Sidebar />

      <div className="content-area">
        <header className="topbar">
          <h3>Task Manager</h3>
        </header>

        <main className="page-content">
          {children}
        </main>

        <footer className="landing-footer">
          <p>&copy; 2026 Task Manager Pro. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
