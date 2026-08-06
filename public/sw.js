/* Fama Mennou service worker — Web Push receiver.
 *
 * This runs OUTSIDE the page, in the browser's background. That is what lets a
 * notification arrive when every tab is closed, the browser is minimised, or
 * the phone is locked — none of which Socket.io can do.
 *
 * Deliberately minimal: no asset caching or offline shell. Adding those would
 * change how the whole app loads and is a separate decision; this worker's
 * only job is push.
 */

self.addEventListener('install', (event) => {
  // Activate immediately rather than waiting for existing tabs to close, so a
  // freshly-registered worker can receive pushes right away.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // A push with a non-JSON body should still surface something rather than
    // being dropped silently.
    data = { title: 'Fama Mennou', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Fama Mennou';
  const options = {
    body: data.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    // `tag` lets the OS replace an earlier notification of the same kind
    // instead of stacking twenty entries from one conversation.
    tag: data.tag || data.kind || 'famamennou',
    renotify: true,
    // The destination travels WITH the notification, so the click handler
    // never has to guess — same link the in-app notification uses.
    data: { link: data.link || '/', kind: data.kind || null },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  const target = new URL(link, self.location.origin).href;

  // Focus an existing tab and navigate it if one is already open; only open a
  // new window as a last resort. Opening a duplicate tab every time is the
  // classic mistake here.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(target).then((c) => (c ? c.focus() : null));
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return null;
    })
  );
});
