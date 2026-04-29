export const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

export const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export const autoResize = (e) => {
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

// Converts the base64 VAPID key to the format the browser expects
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};