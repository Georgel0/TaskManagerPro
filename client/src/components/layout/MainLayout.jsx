'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp, useTheme } from '@/context';
import Link from 'next/link';
import Sidebar from './Sidebar';

export function MainLayout({ children }) {
  const { user } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="app-wrapper">

      {!isLandingPage && (
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleCollapse={toggleSidebarCollapse}
          isCollapsed={sidebarCollapsed}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          {!isLandingPage && (<button className='sidebar-toggle mobile-only' onClick={toggleSidebar} title='Toggle Sidebar'>☰</button>)}
          <div className="logo-group">
            <div className="logo-image"></div>
            <h3>Task Manager Pro</h3>
          </div>
          {!isLandingPage && (
            <Link href='/profile' className='topbar-profile-link' title='Profile'>
              {user?.avatar ? (
                <img src={user.avatar} alt="User Avatar" className="topbar-avatar" />
              ) : (
                <i className="fas fa-user"></i>
              )}
            </Link>
          )}
        </header>

        {children}
      </main>
    </div>
  );
}