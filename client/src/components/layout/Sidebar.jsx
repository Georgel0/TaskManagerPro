'use client'

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import '@/styles/sidebar.css';

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon:'fas fa-chart-simple', path: '/dashboard' },
  { id: 'profile', label: 'Profile', icon:'fas fa-user', path: '/profile' },
  { id: 'settings', label: 'Settings', icon:'fas fa-gear', path: '/settings' },
];

export default function Sidebar({ isOpen, toggleSidebar }) {

  const sidebarRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isOpen && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('.sidebar-toggle')
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

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} ref={sidebarRef} >
      <div className="sidebar-logo">
        <h2>Task Pro</h2>
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
            {p.label}
          </Link> 
        ))}
        <Link href='/' className='nav-link logout'>Log Out</Link>
      </nav>
    </aside>
  );
}