'use client';
import { useState } from 'react';

export function ArchiveButton({ type, id, name, onArchive, className = '' }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className={`btn-icon archive-btn ${className}`}
        title={`Archive ${type}`}
        onClick={(e) => { e.stopPropagation(); setConfirm(true); }}
      >
        <i className="fas fa-box-archive"></i>
      </button>

      {confirm && (
        <div 
          className="archive-confirm-popover" 
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
        </div>
      )}
    </div>
  );
}