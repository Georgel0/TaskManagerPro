'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="main-layout">

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div className="content-area">
        <header className="topbar">
          <button className='sidebar-toggle' onClick={toggleSidebar}>☰</button>
          <h3>Task Manager</h3>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}