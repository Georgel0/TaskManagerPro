import Link from 'next/link';
import '@/styles/sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Task Pro</h2>
      </div>
      <nav className="sidebar-nav">
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
        <Link href="/profile" className="nav-link">Profile</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
        <Link href="/" className="nav-link logout">Log Out</Link>
      </nav>
    </aside>
  );
}
