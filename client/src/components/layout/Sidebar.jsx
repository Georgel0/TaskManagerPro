'use client'

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import '@/styles/sidebar.css';

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-simple', path: '/dashboard' },
  { id: 'projects', label: 'Projects', icon: 'fas fa-folder', path: '/projects' },
  { id: 'tasks', label: 'Tasks', icon: 'fas fa-list-check', path: '/tasks' },
  { id: 'profile', label: 'Profile', icon: 'fas fa-user', path: '/profile' },
  { id: 'settings', label: 'Settings', icon: 'fas fa-gear', path: '/settings' },
];

export default function Sidebar({ isOpen, toggleSidebar, toggleCollapse, isCollapsed }) {

  const sidebarRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('.sidebar-toggle') &&
        window.innerWidth < 768
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    }
  }, [isOpen, toggleSidebar]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`} ref={sidebarRef} >
      <div className="sidebar-logo">
        {!isCollapsed && <h3>Menu</h3>}
        <div className="sidebar-close-collapse-btns">
          <button className="header-icon-btn mobile-only" onClick={toggleSidebar} title='Close Menu'>
            <i className="fas fa-times"></i>
          </button>
          <button className="header-icon-btn desktop-only" onClick={toggleCollapse} title={isCollapsed ? 'Expand' : 'Collapse'}>
            <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>
      </div>
      <nav className="sidebar-nav">
        {pages.map(p => (
          <Link
            key={p.id}
            href={p.path}
            className={`nav-link ${pathname === p.path ? 'active' : ''}`}
            title={p.label}
            onClick={() => {
              if (window.innerHeight > 768) toggleSidebar();
            }}
          >
            <i className={p.icon}></i>
            <span className="nav-text" style={{ display: isCollapsed ? 'none' : 'block' }}>
              {p.label}
            </span>
          </Link>
        ))}
        <button onClick={handleLogout} className='nav-link logout'>
          {isCollapsed ? '' : 'Log Out'} <i className="fa fa-right-from-bracket"></i>
        </button>
      </nav>
    </aside>
  );
}