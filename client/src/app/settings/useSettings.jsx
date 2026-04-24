'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL;
const getToken = () => localStorage.getItem('token');

const DEFAULT_PREFS = {
  task_assigned: true,
  task_updated: true,
  task_completed: true,
  task_deleted: true,
  comment_added: true,
  project_changes: true,
  deadline_reminders: true,
  announcements: true,
  account_actions: true,
};

export function useSettings() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await fetch(`${API}/notifications/preferences`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error();
        setPrefs(await res.json());
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const updatePref = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const savePrefs = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error();
      toast.success('Preferences saved.');
    } catch (err) {
      toast.error('Failed to save preferences.');
      console.log(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return { prefs, loading, isSaving, updatePref, savePrefs };
}