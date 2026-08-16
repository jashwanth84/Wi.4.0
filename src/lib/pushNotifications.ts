import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export const VAPID_KEY = 'BEOmTFQXjMozoV8FfZ5CMSxRqXdQgeUMXXcXZRago4BsD2nLq11F96JL6DGLszIjx-RCgnAOVllZlEYOp9CFK5g';

export interface PushNotificationPayload {
  title: string;
  body: string;
  type?: 'TOURNAMENT_UPDATE' | 'MATCH_REMINDER' | 'ROOM_CREDENTIALS' | 'ANNOUNCEMENT' | 'GENERAL';
  tournamentId?: string;
  tournamentTitle?: string;
  roomId?: string;
  roomPassword?: string;
  matchTime?: string;
  icon?: string;
  url?: string;
  data?: Record<string, any>;
}

/**
 * Request desktop / mobile push notification permissions and fetch FCM device token.
 */
export async function requestNotificationPermissionAndGetToken(userId?: string): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Cloud Messaging is not supported in this browser environment.');
      return null;
    }

    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      return null;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('Push notification permission was not granted:', permission);
      return null;
    }

    // Register service worker if not already registered
    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.error('Service worker registration failed:', swErr);
      }
    }

    const messaging = getMessaging();
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('✅ Web Push FCM Token active:', currentToken);
      // Save token to Firestore profile if user is logged in
      if (userId) {
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(currentToken),
            fcmToken: currentToken,
            notificationsEnabled: true,
            lastTokenUpdated: new Date().toISOString()
          });
        } catch (e) {
          console.error('Failed to sync FCM token to Firestore:', e);
        }
      }
      return currentToken;
    } else {
      console.warn('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving push token: ', error);
    return null;
  }
}

/**
 * Listen for real-time Firebase Cloud Messaging push notifications in foreground.
 */
export async function setupForegroundNotifications(onReceive: (payload: PushNotificationPayload) => void) {
  try {
    const supported = await isSupported();
    if (!supported) return () => {};

    const messaging = getMessaging();
    return onMessage(messaging, (message) => {
      console.log('🔔 Foreground FCM Push Message received: ', message);
      
      const notif = message.notification || {};
      const data = message.data || {};

      const payload: PushNotificationPayload = {
        title: notif.title || data.title || 'Mr Clutch Tournament Alert',
        body: notif.body || data.body || '',
        type: (data.type as any) || (data.tournamentId ? 'TOURNAMENT_UPDATE' : 'GENERAL'),
        tournamentId: data.tournamentId,
        tournamentTitle: data.tournamentTitle,
        roomId: data.roomId,
        roomPassword: data.roomPassword,
        matchTime: data.matchTime,
        icon: notif.icon || data.icon || '/pwa-192x192.png',
        url: data.url || (data.tournamentId ? `/tournaments/${data.tournamentId}` : '/my-matches'),
        data: data
      };

      // Play soft notification sound if available
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Audio autoplay might be blocked
        });
      } catch (e) {
        // ignore audio failure
      }

      onReceive(payload);
    });
  } catch (e) {
    console.error('Error setting up foreground notifications:', e);
    return () => {};
  }
}

/**
 * Send a tournament update or match reminder push notification to participants/users.
 */
export async function sendTournamentPushNotification(
  tournamentId: string,
  type: 'TOURNAMENT_UPDATE' | 'MATCH_REMINDER' | 'ROOM_CREDENTIALS',
  payload: {
    title: string;
    body: string;
    roomId?: string;
    roomPassword?: string;
    matchTime?: string;
    target?: 'all' | 'participants';
  },
  idToken: string
) {
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        type,
        ...payload
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to trigger tournament push notification:', error);
    throw error;
  }
}
