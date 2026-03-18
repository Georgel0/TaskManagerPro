'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';

export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="main-layout">

      {!isLandingPage && (
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      )}

      <div className="content-area">
        <header className="topbar">
          {!isLandingPage && (<button className='sidebar-toggle' onClick={toggleSidebar} title='Toggle Sidebar'>☰</button>)}
          <h3>Task Manager Pro</h3>
          {!isLandingPage && (<Link href='/profile' className='topbar-profile-icon' title='Profile Icon'><i className="fas fa-user"></i></Link>)}
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}