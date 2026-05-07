'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

  const snapRef = useRef({ enabled: snapEnabled, pattern: snapPattern });
  useEffect(() => {
    snapRef.current = { enabled: snapEnabled, pattern: snapPattern };
  }, [snapEnabled, snapPattern]);

  // Restore persisted windows on first enable
  useEffect(() => {
    if (!enabled || hasRestored) return;

    const saved = loadSaved();
    setHasRestored(true);

    if (!saved.length) return;

    // Bump global counters so new windows don't collide with restored ones
    saved.forEach((w) => {
      const numId = parseInt(w.id.replace('fw', ''), 10);
      if (!isNaN(numId) && numId > _wid) _wid = numId;
      if (w.zIndex > _zc) _zc = w.zIndex;
    });

    setWindows(
      saved.map((w) => ({
        ...w,
        render: (close) => restorerRef?.current?.(w.type, w.meta, close),
      }))
    );
  }, [enabled]);

  // Persist on every windows change
  useEffect(() => {
    if (enabled && hasRestored) persistWindows(windows);
  }, [enabled, hasRestored, windows]);

  // Workspace active event
  useEffect(() => {
    if (!enabled) return;
    window.dispatchEvent(
      new CustomEvent('wm-workspace', { detail: { active: windows.length > 0 } })
    );
  }, [enabled, windows.length]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('wm-workspace', { detail: { active: false } }));
    };
  }, []);

  useEffect(() => {
    const cls = 'fw-taskbar-visible';
    if (enabled && windows.length > 0) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [enabled, windows.length]);

  const openWindow = useCallback((type, title, render, meta = {}) => {
    setWindows((ws) => {
      if (ws.filter((w) => w.type === type).length >= 3) return ws;

      const id = freshId();
      const z = freshZ();
      const { enabled: sEnabled, pattern } = snapRef.current;
      const snapRect = sEnabled && pattern !== 'free' ? getSnapRect(pattern, ws.length) : null;
      const position = cascadePos(type);

      return [...ws, { id, type, title, render, position, snapRect, size: null, zIndex: z, meta }];
    });
  }, []);

  const closeWindow = useCallback((id) => setWindows((ws) => ws.filter((w) => w.id !== id)), []);

  const focusWindow = useCallback((id) => {
    const z = freshZ();
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, zIndex: z } : w)));
  }, []);

  const moveWindow = useCallback((id, x, y) => {
    setWindows((ws) =>
      ws.map((w) =>
        w.id === id
          ? { ...w, position: { x, y }, snapRect: null }
          : w
      )
    );
  }, []);

  const resizeWindow = useCallback((id, width, height, x, y) => {
    setWindows((ws) =>
      ws.map((w) =>
        w.id === id
          ? { ...w, size: { w: width, h: height }, position: { x, y }, snapRect: null }
          : w
      )
    );
  }, []);

  const ctxValue = useMemo(
    () => ({ openWindow, closeWindow, focusWindow, windows, enabled }),
    [openWindow, closeWindow, focusWindow, windows, enabled]
  );

  return (
    <WMCtx.Provider value={ctxValue}>
      {children}
      {enabled && (
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
        </>
      )}
    </WMCtx.Provider>
  );
}