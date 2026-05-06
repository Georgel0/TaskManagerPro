'use clint';
import { useState, useEffect, useRef } from 'react';

export function MemberActionMenu({ member, onRemove, onTransferClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="action-dropdown-wrapper" ref={ref}>
      <button
        className="btn-icon"
        title="More actions"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
      >
        <i className="fas fa-ellipsis-v"></i>
      </button>

      {open && (
        <div className="action-dropdown-menu">
          <button
            className="dropdown-item"
            title="Make Owner"
            onClick={(e) => { e.stopPropagation(); onTransferClick(member.id); setOpen(false); }}
          >
            <i className="fas fa-crown"></i> Promote
          </button>
          <button
            className="dropdown-item text-danger"
            title="Remove Member"
            onClick={(e) => { e.stopPropagation(); onRemove(member.id); setOpen(false); }}
          >
            <i className="fas fa-user-minus"></i> Kick
          </button>
        </div>
      )}
    </div>
  );
}