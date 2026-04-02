import { useState, useEffect, useRef } from 'react';
import { createProjectSchema, updateProjectSchema, validate } from '@/lib/validators';
import { getInitials } from '@/lib';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

export function ProjectFormModal({ mode = 'create', formData, setFormData, onSubmit, onClose, isSubmitting }) {
  const isEdit = mode === 'edit';
  const [fieldErrors, setFieldErrors] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setFieldErrors({});
    setPendingMembers([]);
    setSearchQuery('');
    setSearchResults([]);
  }, [mode, onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API}/users/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        // Filter out already pending members
        const filtered = data.filter((u) => !pendingMembers.some((m) => m.id === u.id));
        setSearchResults(filtered);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const addMember = (user) => {
    setPendingMembers((prev) => [...prev, user]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const removeMember = (id) => {
    setPendingMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const schema = isEdit ? updateProjectSchema : createProjectSchema;
    const errors = validate(schema, formData);

    if (errors) { setFieldErrors(errors); return; }
    setFieldErrors({});
    onSubmit(e, pendingMembers);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Project' : 'Create New Project'}</h3>
          <button className="btn-icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body modal-body-scroll">

            <div className={`form-group ${fieldErrors.name ? 'has-error' : ''}`}>
              <label>Project Name *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {fieldErrors.name && (
                <span className="field-error">
                  <i className="fas fa-exclamation-circle"></i> {fieldErrors.name}
                </span>
              )}
            </div>

            <div className={`form-group ${fieldErrors.description ? 'has-error' : ''}`}>
              <label>
                Description
                <span className="char-count text-secondary text-xs">
                  {formData.description?.length ?? 0}/2000
                </span>
              </label>
              <textarea
                className="form-control"
                value={formData.description}
                maxLength={2000}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              {fieldErrors.description && (
                <span className="field-error">
                  <i className="fas fa-exclamation-circle"></i> {fieldErrors.description}
                </span>
              )}
            </div>

            {!isEdit && (
              <div className="form-group">
                <label>Add Members <span className="text-secondary text-xs">(optional)</span></label>

                {pendingMembers.length > 0 && (
                  <div className="member-chips">
                    {pendingMembers.map((m) => (
                      <span key={m.id} className="member-chip">
                        <span className="member-chip-avatar">{getInitials(m.name)}</span>
                        <span className="member-chip-name">{m.name}</span>
                        <button
                          type="button"
                          className="member-chip-remove"
                          onClick={() => removeMember(m.id)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="member-search-wrapper" ref={searchRef}>
                  <div className="member-search-input-group">
                    <i className="fas fa-search member-search-icon"></i>
                    <input
                      type="text"
                      className="form-control member-search-input"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                      autoComplete="off"
                    />
                    {isSearching && (
                      <i className="fas fa-spinner fa-spin member-search-spinner"></i>
                    )}
                  </div>

                  {showDropdown && (
                    <ul className="member-search-dropdown">
                      {searchResults.length === 0 ? (
                        <li className="member-search-empty">No users found</li>
                      ) : (
                        searchResults.map((u) => (
                          <li
                            key={u.id}
                            className="member-search-result"
                            onMouseDown={() => addMember(u)}
                          >
                            <div className="member-search-avatar">
                              {u.avatar
                                ? <img src={u.avatar} alt={u.name} />
                                : <span>{getInitials(u.name)}</span>
                              }
                            </div>
                            <div className="member-search-info">
                              <span className="member-search-name">{u.name}</span>
                              <span className="member-search-email">{u.email}</span>
                            </div>
                            <i className="fas fa-plus member-search-add-icon"></i>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit ? 'Saving...' : 'Creating...'
                : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}