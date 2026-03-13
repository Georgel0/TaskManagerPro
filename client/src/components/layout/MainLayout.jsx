'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export function MainLayout({ children }) {

  const pathname = usePathname();
  const isLandigPage = pathname === '/';

  return (
    <div className="main-layout">

      {!isLandigPage &&  (<Sidebar />)}

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
