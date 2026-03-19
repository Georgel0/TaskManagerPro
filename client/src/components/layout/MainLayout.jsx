'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp, useTheme } from '@/context';
import Link from 'next/link';
import Sidebar from './Sidebar';

export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user } = useApp();
  const { currentTheme } = useTheme();

  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="app-wrapper">

      {!isLandingPage && (
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      )}

      <main className="main-content">
       <header className="topbar">
          {!isLandingPage && (<button className='sidebar-toggle' onClick={toggleSidebar} title='Toggle Sidebar'>☰</button>)}
          <h3>Task Manager Pro</h3>
          
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