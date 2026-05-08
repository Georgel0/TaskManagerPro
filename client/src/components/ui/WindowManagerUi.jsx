'use client';
import React, { useCallback, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';

export const STORAGE_KEY = 'fw_state_v1';

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

const TASKBAR_H = 48;
const PANEL_W = 420;
const WORKSPACE_X = PANEL_W;
const PAD = 3;
const HEADER_H = 60;

function getWorkspaceX() {
  if (typeof window === 'undefined') return WORKSPACE_X;
  const panel = document.querySelector('.workspace-projects-panel');
  if (panel) return Math.round(panel.getBoundingClientRect().right);
  return WORKSPACE_X;
}

export function getSnapRect(pattern, n) {
  if (typeof window === 'undefined' || pattern === 'free') return null;
  const wx = getWorkspaceX();
  const availW = Math.max(200, window.innerWidth - wx);
  const availH = Math.max(200, window.innerHeight - TASKBAR_H - HEADER_H);

  switch (pattern) {
    case 'grid': {
      const slot = n % 4;
      const col = slot % 2;
      const row = Math.floor(slot / 2);
      const cW = Math.floor(availW / 2);
      const cH = Math.floor(availH / 2);
      return { x: wx + col * cW + PAD, y: HEADER_H + row * cH + PAD, w: cW - PAD * 2, h: cH - PAD * 2 };
    }

    case 'master': {
      const masterW = Math.floor(availW * 0.58);
      if (n === 0) return { x: wx + PAD, y: HEADER_H + PAD, w: masterW - PAD * 2, h: availH - PAD * 2 };
      const slot = (n - 1) % 3;
      const slotH = Math.floor(availH / Math.min(n, 3));
      return { x: wx + masterW + PAD, y: HEADER_H + slot * slotH + PAD, w: availW - masterW - PAD * 2, h: slotH - PAD * 2 };
    }

    case 'columns': {
      const col = n % 3;
      const colW = Math.floor(availW / 3);
      return { x: wx + col * colW + PAD, y: HEADER_H + PAD, w: colW - PAD * 2, h: availH - PAD * 2 };
    }

    case 'rows': {
      const row = n % 3;
      const rowH = Math.floor(availH / 3);
      return { x: wx + PAD, y: HEADER_H + row * rowH + PAD, w: availW - PAD * 2, h: rowH - PAD * 2 };
    }

    default: return null;
  }
}

let _ci = 0;
export const cascadePos = (type) => {
  const cfg = getWinCfg(type);
  const off = (_ci++ % 8) * 28;
  if (typeof window === 'undefined') return { x: WORKSPACE_X + 60 + off, y: HEADER_H + 40 + off };
  const wx = getWorkspaceX();
  const availW = Math.max(0, window.innerWidth - wx);
  const availH = Math.max(0, window.innerHeight - TASKBAR_H - HEADER_H);
  return {
    x: wx + Math.max(0, Math.min(PAD + off, availW - cfg.w - 20)),
    y: HEADER_H + Math.max(0, Math.min(40 + off, availH - cfg.h - 20)),
  };
};

export const FloatingWindow = React.memo(function FloatingWindow({ win, onClose, onFocus, onMove, onResize }) {
  const cfg = getWinCfg(win.type);
  const close = useCallback(() => onClose(win.id), [win.id, onClose]);

  const initX = win.snapRect?.x ?? win.position.x;
  const initY = win.snapRect?.y ?? win.position.y;
  const initW = win.snapRect?.w ?? win.size?.w ?? cfg.w;
  const initH = win.snapRect?.h ?? win.size?.h ?? cfg.h;

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
      onDragStop={(_e, d) => onMove(win.id, d.x, d.y)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => onResize(win.id, ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)}
      style={{ zIndex: win.zIndex, display: 'flex', flexDirection: 'column' }}
      className="fw-win"
    >
      <div className="fw-bar" style={{ cursor: 'grab' }}>
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

  if (!windows.length) return null;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="fw-taskbar">
      <span className="fw-tb-brand"><i className="fas fa-layer-group" /></span>
      <div
        className={`fw-tb-list ${isDragging ? 'dragging' : ''}`}
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
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