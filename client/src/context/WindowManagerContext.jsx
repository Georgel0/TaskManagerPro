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

  // Re-calculate snap rects for all windows when layout changes
  const reSnapAll = useCallback(() => {
    setWindows((ws) => {
      return ws.map((w, idx) => {
        const nextSnap = snapEnabled && snapPattern !== 'free'
          ? getSnapRect(snapPattern, idx, ws.length)
          : null;

        // Don't re-snap windows that were manually moved (snapRect === null)
        // unless a snap pattern is actively set
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
    // Delay to let any sidebar/layout transitions finish
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
    {enabled && createPortal(         
      <>
        {windows.map((w) => (
          <FloatingWindow
            key={w.id}
            win={w}
            onClose={closeWindow}
            onFocus={focusWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
          />
        ))}
        <FWTaskbar windows={windows} onFocus={focusWindow} onClose={closeWindow} />
      </>,
      document.body                  
    )}
  </WMCtx.Provider>
);
}