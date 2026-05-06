'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

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
  snap_windows_enabled:     false,
  snap_pattern:             'grid',
};

export function useSettings() {
  const [prefs, setPrefs]     = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/settings`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPrefs({ ...DEFAULT_PREFS, ...data });
      } catch {
        // Keep defaults silently
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
      const res = await fetch(`${API}/settings`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();
      toast.success('Settings saved.');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return { prefs, loading, isSaving, updatePref, savePrefs };
}