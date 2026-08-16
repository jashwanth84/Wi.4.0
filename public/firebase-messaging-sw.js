importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "mr-clutch-d8ca2",
  appId: "1:759726212842:android:aa5c0ff244a7af64f0b993",
  apiKey: "AIzaSyCIvdETG9XFN5Yyr9GK2LCBAM1Pn3ToY7M",
  authDomain: "mr-clutch-d8ca2.firebaseapp.com",
  messagingSenderId: "759726212842"
});

const messaging = firebase.messaging();

// Handle Background Push Messages (Tournament Updates, Match Reminders, System Alerts)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message: ', payload);

  const data = payload.data || {};
  const notif = payload.notification || {};

  const type = data.type || 'GENERAL';
  let title = notif.title || data.title || 'Mr Clutch 🎯';
  let body = notif.body || data.body || 'New tournament update!';
  let icon = notif.icon || data.icon || '/pwa-192x192.png';
  let tag = data.tournamentId ? `tournament-${data.tournamentId}` : 'general-notif';

  let actions = [];
  if (data.tournamentId) {
    actions.push({
      action: 'view_tournament',
      title: '🎮 View Match'
    });
  }
  if (data.roomId) {
    actions.push({
      action: 'view_room',
      title: '🔑 View Room ID'
    });
  }

  // Customize headers based on notification type
  if (type === 'TOURNAMENT_UPDATE') {
    title = `🏆 Tournament Update: ${title}`;
  } else if (type === 'MATCH_REMINDER') {
    title = `⏰ Match Reminder: ${title}`;
  }

  const notificationOptions = {
    body,
    icon,
    badge: '/pwa-192x192.png',
    tag,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || (data.tournamentId ? `/tournaments/${data.tournamentId}` : '/my-matches'),
      tournamentId: data.tournamentId,
      type,
      roomId: data.roomId,
      roomPassword: data.roomPassword,
      ...data
    },
    actions
  };

  self.registration.showNotification(title, notificationOptions);
});

// Handle Notification Click (Focus or Navigate to Tournament/Match)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data || {};
  let targetUrl = clickData.url || '/';

  if (event.action === 'view_tournament' && clickData.tournamentId) {
    targetUrl = `/tournaments/${clickData.tournamentId}`;
  } else if (event.action === 'view_room' && clickData.tournamentId) {
    targetUrl = `/tournaments/${clickData.tournamentId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if window is already open and navigate it
      for (let client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if ('navigate' in client && targetUrl) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
