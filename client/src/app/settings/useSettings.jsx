'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

const DEFAULT_PREFS = {
  task_assigned:            true,
  task_updated:             true,
  task_completed:           true,
  task_deleted:             true,
  comment_added:            true,
  project_changes:          true,
  deadline_reminders:       true,
  announcements:            true,
  account_actions:          true,
  floating_windows_enabled: false,
};

function syncToLocalStorage(data) {
  if (typeof window === 'undefined') return;
  const isMobile = window.innerWidth <= 768;
  localStorage.setItem(
    'fw-enabled',
    String(!isMobile && (data.floating_windows_enabled ?? false))
  );
}

export function useSettings() {
  const [prefs,    setPrefs   ] = useState(DEFAULT_PREFS);
  const [loading,  setLoading ] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/notifications/preferences`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPrefs({ ...DEFAULT_PREFS, ...data });
        syncToLocalStorage(data);
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updatePref = (key, value) =>
    setPrefs((prev) => ({ ...prev, [key]: value }));

  const savePrefs = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/notifications/preferences`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();
      syncToLocalStorage(prefs); 
      toast.success('Preferences saved.');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return { prefs, loading, isSaving, updatePref, savePrefs };
}