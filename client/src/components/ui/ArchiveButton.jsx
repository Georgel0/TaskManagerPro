'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function ArchiveButton({ text, type, id, name, onArchive, className = '' }) {
  const [confirm, setConfirm] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setConfirm(false);
      }
    };

    if (confirm) {
      document.addEventListener('mousedown', handleOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [confirm]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!confirm) {
      // Calculate position dynamically before opening
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 45, 
        left: rect.left + window.scrollX - 100,
      });
    }
    setConfirm(!confirm);
  };

  return (
    <>
      <button
        ref={triggerRef}
        className={`btn-icon archive-btn ${className}`}
        title={`Archive ${type}`}
        onClick={handleToggle}
      >
        <i className="fas fa-box-archive"></i> {text ? 'Archive' : ''}
      </button>

      {confirm && createPortal(
        <div 
          ref={popoverRef}
          className="archive-confirm-popover" 
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            bottom: 'auto',
            right: 'auto',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="archive-confirm-text">Archive?</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); onArchive(id); setConfirm(false); }}
          >
            Yes
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); setConfirm(false); }}
          >
            No
          </button>
        </div>,
        document.body
      )}
    </>
  );
}