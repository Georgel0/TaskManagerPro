'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FloatingWindow, FWTaskbar, getSnapRect, cascadePos, loadSaved, persistWindows } from '@/components/ui';

const WMCtx = createContext(null);
export const useWindowManager = () => useContext(WMCtx);

let _zc = 200;
let _wid = 0;
const freshZ = () => Math.min(++_zc, 8990);
const freshId = () => `fw${++_wid}`;

export function WindowManagerProvider({ children, enabled, snapEnabled = false, snapPattern = 'grid', restorerRef }) {
  const [windows, setWindows] = useState([]);
  const [hasRestored, setHasRestored] = useState(false);
  const [portalEl, setPortalEl] = useState(null);
  const [sidebarW, setSidebarW] = useState(0);

  // Create the full-screen fixed overlay that hosts both windows and the taskbar.
  useEffect(() => {
    if (!enabled) return;
    const el = document.createElement('div');
    el.id = 'fw-portal-root';
    el.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:8000;overflow:hidden;';
    document.body.appendChild(el);
    setPortalEl(el);
    return () => { document.body.removeChild(el); setPortalEl(null); };
  }, [enabled]);

  // Watch the sidebar element with a ResizeObserver so sidebarW updates
  // instantly whenever the sidebar collapses, expands, or is hidden.
  useEffect(() => {
    if (!enabled) return;
    let ro = null;

    const attach = (sidebar) => {
      ro = new ResizeObserver(() => setSidebarW(sidebar.getBoundingClientRect().width));
      ro.observe(sidebar);
      setSidebarW(sidebar.getBoundingClientRect().width);
    };

    const existing = document.querySelector('.sidebar');
    if (existing) {
      attach(existing);
      return () => ro?.disconnect();
    }

    // Sidebar may not exist yet (landing/guest pages) — wait for it.
    const mo = new MutationObserver(() => {
      const s = document.querySelector('.sidebar');
      if (s) { mo.disconnect(); attach(s); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); ro?.disconnect(); };
  }, [enabled]);

  // Re-calculate snap rects for all windows when layout changes
  const reSnapAll = useCallback(() => {
    setWindows((ws) => {
      return ws.map((w, idx) => {
        const nextSnap = snapEnabled && snapPattern !== 'free'
          ? getSnapRect(snapPattern, idx, ws.length)
          : null;

        if (!snapEnabled) return { ...w, snapRect: null };
        return { ...w, snapRect: nextSnap };
      });
    });
  }, [snapEnabled, snapPattern]);

  // Re-run layout on count change, resize, or pattern change
  useEffect(() => {
    if (enabled) {
      reSnapAll();
      window.addEventListener('resize', reSnapAll);
      return () => window.removeEventListener('resize', reSnapAll);
    }
  }, [enabled, windows.length, snapEnabled, snapPattern, reSnapAll]);

  useEffect(() => {
    if (!enabled || hasRestored) return;
    const saved = loadSaved();
    setHasRestored(true);
    if (!saved.length) return;
    saved.forEach((w) => {
      const numId = parseInt(w.id.replace('fw', ''), 10);
      if (!isNaN(numId) && numId > _wid) _wid = numId;
      if (w.zIndex > _zc) _zc = w.zIndex;
    });
    setWindows(saved.map((w) => ({
      ...w,
      render: (close) => restorerRef?.current?.(w.type, w.meta, close),
    })));
  }, [enabled, hasRestored, restorerRef]);

  useEffect(() => {
    if (enabled && hasRestored) persistWindows(windows);
  }, [enabled, hasRestored, windows]);

  const openWindow = useCallback((type, title, render, meta = {}) => {
    setTimeout(() => {
      setWindows((ws) => {
        if (ws.filter((w) => w.type === type).length >= 3) return ws;
        const id = freshId();
        const z = freshZ();
        const position = cascadePos(type);
        return [...ws, { id, type, title, render, position, snapRect: null, size: null, zIndex: z, meta }];
      });
    }, 50);
  }, []);

  const closeWindow = useCallback((id) => setWindows((ws) => ws.filter((w) => w.id !== id)), []);

  const focusWindow = useCallback((id) => {
    const z = freshZ();
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, zIndex: z } : w)));
  }, []);

  const moveWindow = useCallback((id, x, y) => {
    setWindows((ws) =>
      ws.map((w) => w.id === id ? { ...w, position: { x, y }, snapRect: null } : w)
    );
  }, []);

  const resizeWindow = useCallback((id, width, height, x, y) => {
    setWindows((ws) =>
      ws.map((w) => w.id === id ? { ...w, size: { w: width, h: height }, position: { x, y }, snapRect: null } : w)
    );
  }, []);

  const ctxValue = useMemo(
    () => ({ openWindow, closeWindow, focusWindow, windows, enabled }),
    [openWindow, closeWindow, focusWindow, windows, enabled]
  );

  return (
    <WMCtx.Provider value={ctxValue}>
      {children}
      {enabled && portalEl && createPortal(
        <>
          {windows.map((w) => (
            <FloatingWindow key={w.id} win={w} onClose={closeWindow}
              onFocus={focusWindow} onMove={moveWindow} onResize={resizeWindow} />
          ))}
          <div
            className="fw-taskbar-positioner"
            style={{ position: 'absolute', bottom: 0, left: sidebarW, right: 0, pointerEvents: 'auto', zIndex: 200 }}
          >
            <FWTaskbar windows={windows} onFocus={focusWindow} onClose={closeWindow} />
          </div>
        </>,
        portalEl
      )}
    </WMCtx.Provider>
  );
}