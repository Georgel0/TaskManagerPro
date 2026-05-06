import { useState, useEffect, useRef } from 'react';
import { createProjectSchema, updateProjectSchema, validate } from '@/lib/validators';
import { getInitials } from '@/lib';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#ef4444', '#06b6d4', '#f97316',
];

export function ProjectFormModal({ mode = 'create', formData: initialData, onSubmit, onClose, isSubmitting }) {
  const isEdit = mode === 'edit';
  const [fieldErrors, setFieldErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const [localData, setLocalData] = useState(initialData);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setFieldErrors({});
    setPendingMembers([]);
    setSearchQuery('');
    setSearchResults([]);
    setTagInput('');
  }, [mode, onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field, value) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      const existing = localData.tags || [];
      if (!existing.includes(newTag) && existing.length < 5) {
        handleChange('tags', [...existing, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    handleChange('tags', (localData.tags || []).filter((t) => t !== tag));
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

      // Cancel previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch(`${API}/users/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
          signal: abortControllerRef.current.signal // Attach signal
        });
        const data = await res.json();
        setSearchResults(data.filter((u) => !pendingMembers.some((m) => m.id === u.id)));
        setShowDropdown(true);
      } catch (err) {
        // Ignore abort errors, handle others
        if (err.name !== 'AbortError') {
          setSearchResults([]);
        }
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

  const removeMember = (id) => setPendingMembers((prev) => prev.filter((m) => m.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    let submissionData = { ...localData };

    if (tagInput.trim()) {
      const newTag = tagInput.trim().toLowerCase();
      const existing = submissionData.tags || [];
      if (!existing.includes(newTag) && existing.length < 5) {
        submissionData.tags = [...existing, newTag];
      }
      setTagInput('');
    }

    const schema = isEdit ? updateProjectSchema : createProjectSchema;
    const errors = validate(schema, submissionData);

    if (errors) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit(e, pendingMembers, submissionData);
  };

  const handlePasteTags = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const incomingTags = pasteData.split(/[,\n]/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t);

    let currentTags = [...(localData.tags || [])];
    let didAdd = false;

    for (const tag of incomingTags) {
      if (currentTags.length >= 5) break;
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
        didAdd = true;
      }
    }

    if (didAdd) {
      handleChange('tags', currentTags);
    }
  };

  return (
    <div className="modal-overlay">
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Project' : 'Create New Project'}</h3>
          <button className="btn-icon" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>

          <div className="modal-body modal-body-scroll">

            <div className={`form-group ${fieldErrors.name ? 'has-error' : ''}`}>
              <label>Project Name *</label>
              <input
                type="text"
                className="form-control"
                value={localData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {fieldErrors.name && <span className="field-error"><i className="fas fa-exclamation-circle"></i> {fieldErrors.name}</span>}
            </div>

            <div className={`form-group ${fieldErrors.description ? 'has-error' : ''}`}>
              <label>
                Description
                <span className="char-count">{localData.description?.length ?? 0}/2000</span>
              </label>
              <textarea
                className="form-control"
                value={localData.description}
                maxLength={2000}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              {fieldErrors.description && <span className="field-error"><i className="fas fa-exclamation-circle"></i> {fieldErrors.description}</span>}
            </div>

            <div className="form-group">
              <label>Project Color</label>
              <div className="color-picker-row">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${localData.color === c ? 'color-swatch-active' : ''}`}
                    style={{ '--swatch-color': c }}
                    onClick={() => handleChange('color', localData.color === c ? null : c)}
                    title={c}
                  />
                ))}
                {localData.color && (
                  <button
                    type="button"
                    className="btn-icon color-clear-btn"
                    onClick={() => handleChange('color', null)}
                    title="Clear color"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Tags <span className="form-hint">Press Enter or comma to add · max 5</span></label>
              {(localData.tags || []).length > 0 && (
                <div className="tag-chips">
                  {(localData.tags || []).map((tag) => (
                    <span key={tag} className="tag-chip">
                      {tag}
                      <button type="button" className="tag-chip-remove" onClick={() => removeTag(tag)}>
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                className="form-control"
                placeholder="e.g. client, urgent, frontend..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                onPaste={handlePasteTags}
                disabled={(localData.tags || []).length >= 5}
              />
            </div>

            {!isEdit && (
              <div className="form-group">
                <label>Add Members <span className="form-hint">(optional)</span></label>

                {pendingMembers.length > 0 && (
                  <div className="member-chips">
                    {pendingMembers.map((m) => (
                      <span key={m.id} className="member-chip">
                        <span className="member-chip-avatar">{getInitials(m.name)}</span>
                        <span className="member-chip-name">{m.name}</span>
                        <button type="button" className="member-chip-remove" onClick={() => removeMember(m.id)}>
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
                    {isSearching && <i className="fas fa-spinner fa-spin member-search-spinner"></i>}
                  </div>

                  {showDropdown && (
                    <ul className="member-search-dropdown">
                      {searchResults.length === 0 ? (
                        <li className="member-search-empty">No users found</li>
                      ) : (
                        searchResults.map((u) => (
                          <li key={u.id} className="member-search-result" onMouseDown={() => addMember(u)}>
                            <div className="member-search-avatar">
                              {u.avatar ? <img src={u.avatar} alt={u.name} /> : <span>{getInitials(u.name)}</span>}
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
  );
}