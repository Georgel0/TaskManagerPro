'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Rnd } from 'react-rnd';

const WMCtx = createContext(null);
export const useWindowManager = () => useContext(WMCtx);

const WIN_CFG = {
  tasks:         { w: 520, h: 280, icon: 'fa-list-check' },
  members:       { w: 540, h: 490, icon: 'fa-users' },
  announcements: { w: 480, h: 380, icon: 'fa-bullhorn' },
  readme:        { w: 700, h: 500, icon: 'fa-book-open' },
  quickAdd:      { w: 430, h: 280, icon: 'fa-circle-plus' },
};

// Snap layout engine
// Returns { x, y, w, h } for the next window slot, or null for free/cascade.
// `existingCount` = number of windows already open.
//
// Patterns mirror Hyprland tiling concepts adapted for a browser viewport:
//   grid    — 2×2 quadrants, cycles after 4
//   master  — first window owns the left ~58%; the rest stack on the right
//   columns — up to 3 equal vertical columns, cycles
//   rows    — up to 3 equal horizontal rows, cycles
const TASKBAR_H = 48; // keep windows above the taskbar

function getSnapRect(pattern, existingCount) {
  if (typeof window === 'undefined' || pattern === 'free') return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight - TASKBAR_H;
  const n  = existingCount;

  switch (pattern) {
    case 'grid': {
      const slot = n % 4;
      const col  = slot % 2;
      const row  = Math.floor(slot / 2);
      return {
        x: col * Math.floor(vw / 2),
        y: row * Math.floor(vh / 2),
        w: Math.floor(vw / 2),
        h: Math.floor(vh / 2),
      };
    }

    case 'master': {
      const masterW = Math.floor(vw * 0.58);
      if (n === 0) return { x: 0, y: 0, w: masterW, h: vh };
      // Stack slots: we divide the right side into up to 3 rows of vh/3
      const slot    = (n - 1) % 3;
      const slotH   = Math.floor(vh / 3);
      return {
        x: masterW,
        y: slot * slotH,
        w: vw - masterW,
        h: slotH,
      };
    }

    case 'columns': {
      const col  = n % 3;
      const colW = Math.floor(vw / 3);
      return { x: col * colW, y: 0, w: colW, h: vh };
    }

    case 'rows': {
      const row  = n % 3;
      const rowH = Math.floor(vh / 3);
      return { x: 0, y: row * rowH, w: vw, h: rowH };
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
  const off = (_ci++ % 8) * 28;
  if (typeof window === 'undefined') return { x: 80 + off, y: 60 + off };
  const { w = 500, h = 560 } = WIN_CFG[type] ?? {};
  return {
    x: Math.max(0, Math.min(80 + off, window.innerWidth  - w - 20)),
    y: Math.max(0, Math.min(60 + off, window.innerHeight - h - 60)),
  };
};

const FloatingWindow = React.memo(function FloatingWindow({ win, onClose, onFocus }) {
  const cfg   = WIN_CFG[win.type] ?? { w: 500, h: 560, icon: 'fa-square' };
  const close = useCallback(() => onClose(win.id), [win.id, onClose]);

  // Use snap rect dimensions when available, otherwise fall back to WIN_CFG defaults
  const initW = win.snapRect?.w ?? cfg.w;
  const initH = win.snapRect?.h ?? cfg.h;
  const initX = win.snapRect?.x ?? win.position.x;
  const initY = win.snapRect?.y ?? win.position.y;

  return (
    <Rnd
      default={{ x: initX, y: initY, width: initW, height: initH }}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
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

export function WindowManagerProvider({ children, enabled, snapEnabled = false, snapPattern = 'grid' }) {
  const [windows, setWindows] = useState([]);

  useEffect(() => {
    const cls = 'fw-taskbar-visible';
    if (enabled && windows.length > 0) document.body.classList.add(cls);
    else document.body.classList.remove(cls);
    return () => document.body.classList.remove(cls);
  }, [enabled, windows.length]);

  const openWindow = useCallback((type, title, render) => {
    setWindows(ws => {
      const existingCount = ws.filter(w => w.type === type).length;
      if (existingCount >= 3) return ws;

      const id = freshId();
      const z  = freshZ();

      // Compute snap rect (null if snap is off or pattern is 'free')
      const snapRect = (snapEnabled && snapPattern !== 'free')
        ? getSnapRect(snapPattern, ws.length)
        : null;

      // Cascade position is used as a fallback inside FloatingWindow
      const position = cascadePos(type);

      return [...ws, { id, type, title, render, position, snapRect, zIndex: z }];
    });
  }, [snapEnabled, snapPattern]);

  const closeWindow  = useCallback((id) => setWindows(ws => ws.filter(w => w.id !== id)), []);
  const focusWindow  = useCallback((id) => {
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