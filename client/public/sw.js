self.addEventListener('push', (event) => {
  if (!event.data) return;

  const { title, body } = event.data.json();

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon-96x96.png',
      badge: '/favicon-96x96.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow('/dashboard');
    })
  );
});