'use client';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { useWindowManager } from '@/context';
import { useSettings } from '@/app/settings/useSettings';

export const STORAGE_KEY = 'fw_state_v2';
const TASKBAR_H = 55;
const GAP = 10;
const INSET = 10;

export function loadSaved() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export function persistWindows(windows) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        windows.map(({ id, type, title, position, size, zIndex, meta }) => ({
          id, type, title, position, size: size ?? null, zIndex, meta: meta ?? {},
        }))
      )
    );
  } catch { }
}

const WIN_CFG = {
  tasks: { w: 520, h: 480, icon: 'fa-list-check' },
  members: { w: 540, h: 490, icon: 'fa-users' },
  announcements: { w: 480, h: 420, icon: 'fa-bullhorn' },
  readme: { w: 680, h: 520, icon: 'fa-book-open' },
  quickAdd: { w: 430, h: 320, icon: 'fa-circle-plus' },
  'create-project': { w: 500, h: 560, icon: 'fa-folder-plus' },
};

export function getWinCfg(type) {
  if (WIN_CFG[type]) return WIN_CFG[type];
  if (type.startsWith('edit-')) return { w: 500, h: 560, icon: 'fa-pen-to-square' };
  return { w: 500, h: 560, icon: 'fa-square' };
}

function getCanvasRect() {
  if (typeof window === 'undefined') return null;
  const canvas = document.querySelector('.workspace-canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  console.log('=== CANVAS RECT ===');
  console.log('left:', rect.left, 'top:', rect.top);
  console.log('width:', rect.width, 'height:', rect.height);
  console.log('right:', rect.right, 'bottom:', rect.bottom);
  return rect;
}

export function getSnapRect(pattern, n, total = 1) {
  const rect = getCanvasRect();
  if (!rect || pattern === 'free') return null;

  const wx = rect.left + INSET;
  const wy = rect.top + INSET;
  const availW = rect.width - INSET * 2;
  const availH = rect.height - TASKBAR_H - INSET * 2;

  switch (pattern) {
    case 'grid': {
      const slot = n % 4;
      const col = slot % 2;
      const row = Math.floor(slot / 2);
      const winW = (availW - GAP) / 2;
      const winH = (availH - GAP) / 2;
      return {
        x: wx + col * (winW + GAP),
        y: wy + row * (winH + GAP),
        w: winW,
        h: winH
      };
    }

    case 'master': {
      const masterW = (availW - (GAP * 3)) * 0.65;
      const stackW = (availW - GAP) * 0.35;
      if (n === 0) {
        return { x: wx + GAP, y: wy, w: masterW - GAP, h: availH - (GAP * 2) };
      }
      const slot = (n - 1) % 2;
      const stackH = (availH - (GAP * 3)) / 2;
      return {
        x: wx + masterW + GAP,
        y: wy + slot * (stackH + GAP),
        w: stackW,
        h: stackH
      };
    }

    case 'columns': {
      const count = Math.min(total, 3);
      const col = n % 3;
      const colW = (availW - (GAP * (count - 1))) / count;
      return {
        x: wx + col * (colW + GAP),
        y: wy,
        w: colW,
        h: availH
      };
    }

    case 'rows': {
      const count = Math.min(total, 3);
      const row = n % 3;
      const rowH = (availH - (GAP * (count - 1))) / count;
      return {
        x: wx,
        y: wy + row * (rowH + GAP),
        w: availW,
        h: rowH
      };
    }
    default: return null;
  }
}

let _cascadeCount = 0;

export const cascadePos = (type) => {
  const rect = getCanvasRect();
  if (!rect) return { x: 450, y: 100 };
  const off = (_cascadeCount++ % 5) * 28;
  return {
    x: rect.left + INSET,
    y: rect.top + INSET + off,
  };
};

function getSnapKey(win) {
  if (!win.snapRect) return 'free';
  return `${Math.round(win.snapRect.x)},${Math.round(win.snapRect.y)},${Math.round(win.snapRect.w)},${Math.round(win.snapRect.h)}`;
}

export const FloatingWindow = React.memo(function FloatingWindow({ win, onClose, onFocus, onMove, onResize }) {
  const cfg = getWinCfg(win.type);
  const close = useCallback(() => onClose(win.id), [win.id, onClose]);

  const defaultPos = win.snapRect
    ? { x: win.snapRect.x, y: win.snapRect.y }
    : win.position;

  const defaultSize = win.snapRect
    ? { width: win.snapRect.w, height: win.snapRect.h }
    : win.size
      ? { width: win.size.w, height: win.size.h }
      : { width: cfg.w, height: cfg.h };

  const snapKey = getSnapKey(win);

  return (
    <Rnd
      key={snapKey}
      default={{
        x: defaultPos.x,
        y: defaultPos.y,
        width: defaultSize.width,
        height: defaultSize.height,
      }}
      enableResizing={{
        top: true, right: true, bottom: true, left: true,
        topRight: true, bottomRight: true, bottomLeft: true, topLeft: true,
      }}
      minWidth={win.snapRect ? 100 : 320}
      minHeight={win.snapRect ? 100 : 200}
      bounds=".workspace-canvas"
      dragHandleClassName="fw-bar"
      enableUserSelectHack={false}
      onMouseDown={() => onFocus(win.id)}
      onDragStop={(_e, d) => onMove(win.id, d.x, d.y)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => onResize(win.id, ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)}
      style={{ zIndex: win.zIndex, display: 'flex', flexDirection: 'column' }}
      className={`fw-win ${win.snapRect ? 'is-snapped' : ''}`}
    >
      <div className="fw-bar">
        <div className="fw-bar-left">
          <i className={`fas ${cfg.icon} fw-bar-icon`} />
          <span className="fw-bar-title">{win.title}</span>
        </div>
        <button className="fw-bar-close" onClick={close} onMouseDown={(e) => e.stopPropagation()}>
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="fw-win-body">
        {typeof win.render === 'function' ? win.render(close) : win.render}
      </div>
    </Rnd>
  );
});

export function FWTaskbar({ windows, onFocus, onClose }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const wm = useWindowManager();
  const { prefs } = useSettings();

  if (!windows.length) return null;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    scrollRef.current.scrollLeft += e.deltaY + e.deltaX;
  };

  return (
    <div className="fw-taskbar">
      {prefs.workspace_window_count_enabled ? (
        <div className="workspace-canvas-hint" title={`${wm.windows.length} window${wm.windows.length !== 1 ? 's' : ''} open`}>
          <i className="fas fa-layer-group" />
          <span>{wm.windows.length}</span>
        </div>
      ) : (
        <span className="fw-tb-brand"><i className="fas fa-layer-group" /></span>
      )}

      <div
        className={`fw-tb-list ${isDragging ? 'dragging' : ''}`}
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      >
        {windows.map((w) => {
          const cfg = getWinCfg(w.type);
          return (
            <button
              key={w.id}
              className="fw-tb-item"
              onClick={() => !isDragging && onFocus(w.id)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <i className={`fas ${cfg.icon ?? 'fa-square'}`} />
              <span className="fw-tb-label">{w.title}</span>
              <span className="fw-tb-x" onClick={(e) => { e.stopPropagation(); onClose(w.id); }}>
                <i className="fas fa-times" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}