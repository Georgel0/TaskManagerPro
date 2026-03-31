export const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

export const formatDate = (date) => 
  new Date(date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric' });

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export const autoResize = (e) => {
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};