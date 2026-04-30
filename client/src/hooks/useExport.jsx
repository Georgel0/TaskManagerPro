'use client';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useExport() {
  const [exportingKey, setExportingKey] = useState(null);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const exportData = useCallback(async (option) => {
    if (exportingKey) return; // prevent concurrent exports

    const toastId = toast.loading(`Preparing "${option.label}"…`);
    setExportingKey(option.endpoint);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated.');

      const url = `${API}${option.endpoint}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let msg = 'Export failed.';
        try {
          const body = await response.json();
          msg = body.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const blob = await response.blob();

      let filename = option.filename || 'export.csv';
      const disposition = response.headers.get('Content-Disposition');
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      toast.success(`"${option.label}" downloaded!`, { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Export failed.', { id: toastId });
    } finally {
      setExportingKey(null);
    }
  }, [exportingKey, API]);

  return { exportData, exportingKey };
}