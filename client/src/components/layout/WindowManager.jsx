'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Rnd } from 'react-rnd';

const WMCtx = createContext(null);
export const useWindowManager = () => useContext(WMCtx);

const WIN_CFG = {
  tasks: { w: 520, h: 280, icon: 'fa-list-check' },
  members: { w: 510, h: 450, icon: 'fa-users' },
  announcements: { w: 620, h: 260, icon: 'fa-bullhorn' },
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

  const close = useCallback(() => onClose(win.id), [win.id, onClose]);

  return (
    <Rnd
      default={{
        x: win.position.x,
        y: win.position.y,
        width: cfg.w,
        height: cfg.h,
      }}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
      }}
      minWidth={340}
      minHeight={220}
      bounds="window"
      dragHandleClassName="fw-bar"
      onMouseDown={() => onFocus(win.id)}
      style={{ zIndex: win.zIndex, display: 'flex', flexDirection: 'column' }}
      className="fw-win"
    >
      <div className="fw-bar" style={{ cursor: 'grab' }}>
        <div className="fw-bar-left">
          <i className={`fas ${cfg.icon} fw-bar-icon`} />
          <span className="fw-bar-title">{win.title}</span>
        </div>
        <button
          className="fw-bar-close"
          onClick={close}
          onMouseDown={(e) => e.stopPropagation()}
          title="Close"
        >
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="fw-win-body">
        {typeof win.render === 'function' ? win.render(close) : win.render}
      </div>
    </Rnd>
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