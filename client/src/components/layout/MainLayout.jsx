import Sidebar from './Sidebar';
import '@/styles/mainLayout.css';

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
      </div>
    </div>
  );
}
