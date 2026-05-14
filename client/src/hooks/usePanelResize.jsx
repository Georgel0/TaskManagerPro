'use client';
import { useRef, useCallback } from 'react';

/**
 * usePanelResize — returns a ref to attach to the panel element and
 * an onMouseDown handler to attach to the resizer handle element.
 *
 * Usage:
 *   const { panelRef, resizerProps } = usePanelResize({ min: 220, max: 640 });
 *   <div ref={panelRef} className="workspace-projects-panel">
 *     <div className="workspace-panel-resizer" {...resizerProps} />
 *     ...
 *   </div>
 */
export function usePanelResize({ min = 220, max = 640, storageKey = 'ws_panel_w' } = {}) {
  const panelRef = useRef(null);
  const resizerRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    const panel = panelRef.current;
    const resizer = resizerRef.current;
    if (!panel) return;

    const startX = e.clientX;
    const startW = panel.getBoundingClientRect().width;

    resizer?.classList.add('is-dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      const newW = Math.min(max, Math.max(min, startW + ev.clientX - startX));
      panel.style.width = `${newW}px`;
    };

    const onUp = () => {
      resizer?.classList.remove('is-dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // Persist so the width survives navigation
      try { localStorage.setItem(storageKey, panel.style.width); } catch {}
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [min, max, storageKey]);

  // Restore saved width on mount
  const initRef = useCallback((node) => {
    panelRef.current = node;
    if (!node) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) node.style.width = saved;
    } catch {}
  }, [storageKey]);

  return {
    panelRef: initRef,
    resizerProps: {
      ref: resizerRef,
      onMouseDown,
    },
  };
}