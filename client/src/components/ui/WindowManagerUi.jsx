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
  return rect;
}

function getResponsiveDims(availW, availH) {
  let gridCols, gridRows;
  if (availW >= 3300) { gridCols = 5; gridRows = 5; }
  else if (availW >= 2500) { gridCols = 4; gridRows = 4; }
  else if (availW >= 1700) { gridCols = 3; gridRows = 3; }
  else { gridCols = 2; gridRows = 2; }

  const maxCols = availW >= 1400 ? 5 : 3;
  const maxRows = availH >= 900 ? 5 : 3;

  const masterCount = availW >= 1400 ? 2 : 1;

  return { gridCols, gridRows, maxCols, maxRows, masterCount };
}

export function getSnapRect(pattern, n, total = 1) {
  const rect = getCanvasRect();
  if (!rect || pattern === 'free') return null;

  const wx = rect.left + INSET;
  const wy = rect.top + INSET;
  const availW = rect.width - INSET * 2;
  const availH = rect.height - TASKBAR_H - INSET * 2;

  const { gridCols, gridRows, maxCols, maxRows, masterCount } = getResponsiveDims(availW, availH);

  switch (pattern) {
    case 'grid': {
      const capacity = gridCols * gridRows;
      const slot = n % capacity;
      const col = slot % gridCols;
      const row = Math.floor(slot / gridCols);
      const winW = (availW - GAP * (gridCols - 1)) / gridCols;
      const winH = (availH - GAP * (gridRows - 1)) / gridRows;
      return {
        x: wx + col * (winW + GAP),
        y: wy + row * (winH + GAP),
        w: winW,
        h: winH,
      };
    }

    case 'master': {
      const masterAreaW = (availW - GAP * (masterCount + 1)) * 0.6;
      const stackW = availW - masterAreaW - GAP * (masterCount + 1);
      const singleMasterW = (masterAreaW - GAP * (masterCount - 1)) / masterCount;

      if (n < masterCount) {
        return {
          x: wx + GAP + n * (singleMasterW + GAP),
          y: wy,
          w: singleMasterW,
          h: availH - GAP * 2,
        };
      }

      const stackSlot = n - masterCount;
      const stackCols = masterCount >= 2 ? 2 : 1;
      const stackRows = 2;
      const stackCapacity = stackCols * stackRows;
      const slotInStack = stackSlot % stackCapacity;
      const sCol = slotInStack % stackCols;
      const sRow = Math.floor(slotInStack / stackCols);
      const cellW = (stackW - GAP * (stackCols - 1)) / stackCols;
      const cellH = (availH - GAP * (stackRows + 1)) / stackRows;
      return {
        x: wx + masterAreaW + GAP * (masterCount + 1) + sCol * (cellW + GAP),
        y: wy + sRow * (cellH + GAP),
        w: cellW,
        h: cellH,
      };
    }

    case 'columns': {
      const colCount = Math.min(total, maxCols);
      const layers = availH >= 700 ? 2 : 1;
      const layerH = layers > 1 ? (availH - GAP) / 2 : availH;
      const col = n % colCount;
      const layer = Math.floor(n / colCount) % layers;
      const colW = (availW - GAP * (colCount - 1)) / colCount;
      return {
        x: wx + col * (colW + GAP),
        y: wy + layer * (layerH + GAP),
        w: colW,
        h: layerH,
      };
    }

    case 'rows': {
      const rowCount = Math.min(total, maxRows);
      const layers = availW >= 900 ? 2 : 1;
      const layerW = layers > 1 ? (availW - GAP) / 2 : availW;
      const row = n % rowCount;
      const layer = Math.floor(n / rowCount) % layers;
      const rowH = (availH - GAP * (rowCount - 1)) / rowCount;
      return {
        x: wx + layer * (layerW + GAP),
        y: wy + row * (rowH + GAP),
        w: layerW,
        h: rowH,
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