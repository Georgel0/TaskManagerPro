'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useApp } from '@/context';
import Link from 'next/link';
import Sidebar from './Sidebar';
import { NotificationsModal } from '../ui/NotificationsModal';

import '@/styles/export.css';
import '@/styles/sidebar.css';
import '@/styles/notifications.css';

export function MainLayout({ children }) {
  const { user, loading } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isAboutPage = pathname === '/about';

  const collapsedRef = useRef(sidebarCollapsed);
  useEffect(() => { collapsedRef.current = sidebarCollapsed; }, [sidebarCollapsed]);

  const prevCollapsedRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail.active) {
        if (prevCollapsedRef.current === null) {
          prevCollapsedRef.current = collapsedRef.current;
          setSidebarCollapsed(true);
          localStorage.setItem('sidebar_collapsed', 'true');
        }
      } else {
        if (prevCollapsedRef.current !== null) {
          const prev = prevCollapsedRef.current;
          prevCollapsedRef.current = null;
          setSidebarCollapsed(prev);
          localStorage.setItem('sidebar_collapsed', String(prev));
        }
      }
    };

    window.addEventListener('wm-workspace', handler);
    return () => window.removeEventListener('wm-workspace', handler);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem('sidebar_collapsed', String(newValue));
      if (prevCollapsedRef.current !== null) {
        prevCollapsedRef.current = newValue;
      }
      return newValue;
    });
  };

  useEffect(() => {
    if (!loading && !user && !isLandingPage && !isAboutPage) {
      router.push('/');
    }
  }, [user, loading, isLandingPage, router, isAboutPage]);

  if (!isMounted && !isLandingPage) return null;

  return (
    <div className="app-wrapper">
      <Toaster position="bottom-right" />

      {(!isLandingPage && user) && (
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleCollapse={toggleSidebarCollapse}
          isCollapsed={sidebarCollapsed}
        />
      )}

      <main className="main-content">
        {!isLandingPage && (
          <header className="topbar">
            <button className='sidebar-toggle mobile-only' onClick={toggleSidebar} title='Toggle Sidebar'>☰</button>
            <div className="logo-group">
              <div className="logo-image"></div>
              <h3>Task Manager Pro</h3>
            </div>
            <div className="topbar-actions">
              {user && <NotificationsModal />}
              <Link
                href={isAboutPage && !user ? '/' : '/profile'}
                className='topbar-profile-link'
                title={user ? `TMP Account \n ${user?.name || ''} \n ${user?.email || ''}` : 'Log in'}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="User Avatar" className="topbar-avatar" />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </Link>
            </div>
          </header>
        )}

        {children}
      </main>
    </div>
  );
}