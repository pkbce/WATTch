
'use client';

import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // 1. Register the service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        },
        (error) => {
          console.error('Service Worker registration failed:', error);
        }
      );
    }

    // 2. Set initial permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((status) => {
        setPermission(status);
        if (status !== 'granted') {
          console.log('Notification permission was not granted.');
        }
      });
    }
  };

  const showNotification = (title: string, body: string, tag: string) => {
    if (permission !== 'granted' || !navigator.serviceWorker.controller) {
      console.log('Cannot show notification. Permission:', permission, 'Controller:', navigator.serviceWorker.controller);
      return;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { title, body, tag },
    });
  };

  return { permission, requestPermission, showNotification };
}
