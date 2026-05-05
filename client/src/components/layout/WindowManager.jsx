'use client';
import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
const WMCtx = createContext(null);
export const useWindowManager = () => useContext(WMCtx);

const WIN_CFG = {
  tasks: { w: 520, h: 320, icon: 'fa-list-check' },
  members: { w: 510, h: 450, icon: 'fa-users' },
  announcements: { w: 620, h: 230, icon: 'fa-bullhorn' },
  readme: { w: 700, h: 500, icon: 'fa-book-open' },
  quickAdd: { w: 430, h: 280, icon: 'fa-circle-plus' },
};

let _zc = 200;
let _wid = 0;
let _ci = 0;
const freshZ = () => Math.min(++_zc, 8990);
const freshId = () => `fw${++_wid}`;
const cascadePos = (type) => {
  const off = (_ci++ % 8) * 28;
  if (typeof window === 'undefined') return { x: 80 + off, y: 60 + off };
  const { w = 500, h = 560 } = WIN_CFG[type] ?? {};
  return {
    x: Math.max(0, Math.min(80 + off, window.innerWidth - w - 20)),
    y: Math.max(0, Math.min(60 + off, window.innerHeight - h - 60)),
  };
};

const FloatingWindow = React.memo(function FloatingWindow({ win, onClose, onFocus }) {
  const cfg = WIN_CFG[win.type] ?? { w: 500, h: 560, icon: 'fa-square' };

  const winRef = useRef(null);

  const posRef = useRef({ ...win.position });
  const dragOffset = useRef({ x: 0, y: 0 });

  const onBarDown = useCallback((e) => {
    if (e.button !== 0 || e.target.closest('[data-nodrag]')) return;

    dragOffset.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y
    };

    onFocus(win.id);
    e.preventDefault();

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [win.id, onFocus]);

  const onMove = useCallback((e) => {
    const x = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - cfg.w));
    const y = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 48));

    posRef.current = { x, y };

    if (winRef.current) {
      winRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, [cfg.w]);

  const onUp = useCallback(() => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }, [onMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onMove, onUp]);

  const close = useCallback(() => onClose(win.id), [win.id, onClose]);

  return (
    <div
      ref={winRef}
      className="fw-win"
      style={{
        transform: `translate(${posRef.current.x}px, ${posRef.current.y}px)`,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: win.zIndex,
        width: cfg.w,
        height: cfg.h
      }}
      onMouseDown={() => onFocus(win.id)}
    >
      <div className="fw-bar" onMouseDown={onBarDown} style={{ cursor: 'grab' }}>
        <div className="fw-bar-left">
          <i className={`fas ${cfg.icon} fw-bar-icon`} />
          <span className="fw-bar-title">{win.title}</span>
        </div>
        <button data-nodrag className="fw-bar-close" onClick={close} title="Close">
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="fw-win-body">
        {typeof win.render === 'function' ? win.render(close) : win.render}
      </div>
    </div>
  );
});

function FWTaskbar({ windows, onFocus, onClose }) {
  if (!windows.length) return null;
  return (
    <div className="fw-taskbar">
      <span className="fw-tb-brand" title="Open windows">
        <i className="fas fa-layer-group" />
      </span>
      <div className="fw-tb-list">
        {windows.map((w) => {
          const cfg = WIN_CFG[w.type] ?? {};
          return (
            <button key={w.id} className="fw-tb-item" title={w.title} onClick={() => onFocus(w.id)}>
              <i className={`fas ${cfg.icon ?? 'fa-square'}`} />
              <span className="fw-tb-label">{w.title}</span>
              <span
                className="fw-tb-x"
                role="button"
                tabIndex={-1}
                onClick={(e) => { e.stopPropagation(); onClose(w.id); }}
              >
                <i className="fas fa-times" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WindowManagerProvider({ children, enabled }) {
  const [windows, setWindows] = useState([]);

  useEffect(() => {
    const cls = 'fw-taskbar-visible';
    if (enabled && windows.length > 0) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [enabled, windows.length]);

  /**
   * Open a floating window.
   * @param {'tasks'|'members'|'announcements'|'readme'|'quickAdd'} type
   * @param {string}            title  - shown in title bar & taskbar
   * @param {ReactNode|Function} render - JSX or (closeFn) => JSX
   */
  const openWindow = useCallback((type, title, render) => {
    setWindows(ws => {
      const existingCount = ws.filter(w => w.type === type).length;
      const limit = 2;

      if (existingCount >= limit) {
        ws.find(w => w.type === type);
        return ws;
      }
      const id = freshId();
      const pos = cascadePos(type);
      const z = freshZ();
      return [...ws, { id, type, title, render, position: pos, zIndex: z }];
    });
  }, []);

  const closeWindow = useCallback((id) => setWindows(ws => ws.filter(w => w.id !== id)), []);

  const focusWindow = useCallback((id) => {
    const z = freshZ();
    setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: z } : w));
  }, []);

  const ctxValue = useMemo(() => ({
    openWindow,
    closeWindow,
    focusWindow,
    windows,
    enabled
  }), [openWindow, closeWindow, focusWindow, windows, enabled]);

  return (
    <WMCtx.Provider value={ctxValue}>
      {children}
      {enabled && (
        <>
          {windows.map(w => (
            <FloatingWindow key={w.id} win={w} onClose={closeWindow} onFocus={focusWindow} />
          ))}
          <FWTaskbar windows={windows} onFocus={focusWindow} onClose={closeWindow} />
        </>
      )}
    </WMCtx.Provider>
  );
}