'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Rnd } from 'react-rnd';

const WMCtx = createContext(null);
export const useWindowManager = () => useContext(WMCtx);

const WIN_CFG = {
  tasks:         { w: 520, h: 480, icon: 'fa-list-check'  },
  members:       { w: 540, h: 490, icon: 'fa-users'       },
  announcements: { w: 480, h: 420, icon: 'fa-bullhorn'    },
  readme:        { w: 680, h: 520, icon: 'fa-book-open'   },
  quickAdd:      { w: 430, h: 320, icon: 'fa-circle-plus' },
};

const TASKBAR_H = 48;  
const SIDEBAR_W = 70; 
const PANEL_W = 420; 
const WORKSPACE_X = SIDEBAR_W + PANEL_W; 
const PAD = 6;  

/**
 * Returns { x, y, w, h } for the next window, or null for free/cascade.
 * All coords are viewport-relative (position: fixed context).
 * x always starts at WORKSPACE_X so windows never overlap the projects panel.
 */
function getSnapRect(pattern, n) {
  if (typeof window === 'undefined' || pattern === 'free') return null;

  const availW = Math.max(200, window.innerWidth  - WORKSPACE_X);
  const availH = Math.max(200, window.innerHeight - TASKBAR_H);

  switch (pattern) {
    case 'grid': {
      const slot  = n % 4;
      const col   = slot % 2;
      const row   = Math.floor(slot / 2);
      const cellW = Math.floor(availW / 2);
      const cellH = Math.floor(availH / 2);
      return {
        x: WORKSPACE_X + col * cellW + PAD,
        y: row * cellH + PAD,
        w: cellW - PAD * 2,
        h: cellH - PAD * 2,
      };
    }

    case 'master': {
      const masterW = Math.floor(availW * 0.58);
      if (n === 0) {
        return { x: WORKSPACE_X + PAD, y: PAD, w: masterW - PAD * 2, h: availH - PAD * 2 };
      }
      const slot  = (n - 1) % 3;
      const slotH = Math.floor(availH / Math.min(n, 3)); 
      return {
        x: WORKSPACE_X + masterW + PAD,
        y: slot * slotH + PAD,
        w: availW - masterW - PAD * 2,
        h: slotH - PAD * 2,
      };
    }

    case 'columns': {
      const col  = n % 3;
      const colW = Math.floor(availW / 3);
      return {
        x: WORKSPACE_X + col * colW + PAD,
        y: PAD,
        w: colW - PAD * 2,
        h: availH - PAD * 2,
      };
    }

    case 'rows': {
      const row  = n % 3;
      const rowH = Math.floor(availH / 3);
      return {
        x: WORKSPACE_X + PAD,
        y: row * rowH + PAD,
        w: availW - PAD * 2,
        h: rowH - PAD * 2,
      };
    }

    default:
      return null;
  }
}

let _zc  = 200;
let _wid = 0;
let _ci  = 0;
const freshZ  = () => Math.min(++_zc, 8990);
const freshId = () => `fw${++_wid}`;

const cascadePos = (type) => {
  const cfg    = WIN_CFG[type] ?? { w: 500, h: 560 };
  const off    = (_ci++ % 8) * 28;
  if (typeof window === 'undefined') {
    return { x: WORKSPACE_X + 60 + off, y: 40 + off };
  }
  const availW = Math.max(0, window.innerWidth  - WORKSPACE_X);
  const availH = Math.max(0, window.innerHeight - TASKBAR_H);
  return {
    x: WORKSPACE_X + Math.max(0, Math.min(60 + off, availW - cfg.w - 20)),
    y: Math.max(0, Math.min(40 + off, availH - cfg.h - 20)),
  };
};

const FloatingWindow = React.memo(function FloatingWindow({ win, onClose, onFocus }) {
  const cfg   = WIN_CFG[win.type] ?? { w: 500, h: 560, icon: 'fa-square' };
  const close = useCallback(() => onClose(win.id), [win.id, onClose]);

  const initX = win.snapRect?.x ?? win.position.x;
  const initY = win.snapRect?.y ?? win.position.y;
  const initW = win.snapRect?.w ?? cfg.w;
  const initH = win.snapRect?.h ?? cfg.h;

  return (
    <Rnd
      default={{ x: initX, y: initY, width: initW, height: initH }}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
      }}
      minWidth={320}
      minHeight={200}
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

export function WindowManagerProvider({ children, enabled, snapEnabled = false, snapPattern = 'grid' }) {
  const [windows, setWindows] = useState([]);

  const snapRef = useRef({ enabled: snapEnabled, pattern: snapPattern });
  useEffect(() => {
    snapRef.current = { enabled: snapEnabled, pattern: snapPattern };
  }, [snapEnabled, snapPattern]);

  useEffect(() => {
    if (!enabled) return;
    window.dispatchEvent(
      new CustomEvent('wm-workspace', { detail: { active: windows.length > 0 } })
    );
  }, [enabled, windows.length]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent('wm-workspace', { detail: { active: false } })
      );
    };
  }, []);

  useEffect(() => {
    const cls = 'fw-taskbar-visible';
    if (enabled && windows.length > 0) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [enabled, windows.length]);

  const openWindow = useCallback((type, title, render) => {
    setWindows(ws => {
      if (ws.filter(w => w.type === type).length >= 3) return ws;

      const id = freshId();
      const z  = freshZ();
      const { enabled: sEnabled, pattern } = snapRef.current;

      const snapRect = (sEnabled && pattern !== 'free')
        ? getSnapRect(pattern, ws.length)
        : null;

      const position = cascadePos(type);

      return [...ws, { id, type, title, render, position, snapRect, zIndex: z }];
    });
  }, []);

  const closeWindow = useCallback((id) => setWindows(ws => ws.filter(w => w.id !== id)), []);

  const focusWindow = useCallback((id) => {
    const z = freshZ();
    setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: z } : w));
  }, []);

  const ctxValue = useMemo(() => ({
    openWindow, closeWindow, focusWindow, windows, enabled,
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