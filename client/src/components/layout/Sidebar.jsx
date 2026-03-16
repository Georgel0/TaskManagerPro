'use client'

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import '@/styles/sidebar.css';

export default function Sidebar({ isOpen, toggleSidebar }) {

  const sidebarRef = useRef(null);

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
        <Link href="/dashboard" className="nav-link">Dashboard</Link>
        <Link href="/profile" className="nav-link">Profile</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
        <Link href="/" className="nav-link logout">Log Out</Link>
      </nav>
    </aside>
  );
}