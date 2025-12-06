self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
  });
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data.payload;
    const options = {
      body: body,
      tag: tag,
      renotify: true,
      requireInteraction: true,
    };
    self.registration.showNotification(title, options);
  }
});

self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  if (notification.tag === 'live-status') {
    event.waitUntil(
      self.registration.showNotification(notification.title, {
        body: notification.body,
        tag: notification.tag,
        icon: notification.icon,
        silent: true,
        renotify: false,
        requireInteraction: true,
      })
    );
  }
});
