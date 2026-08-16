import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Key, Bell, X, Copy, Check, ChevronRight, Sparkles } from 'lucide-react';
import { setupForegroundNotifications, PushNotificationPayload, requestNotificationPermissionAndGetToken } from '../lib/pushNotifications';
import { useAuth } from '../contexts/AuthContext';

export default function PushNotificationBanner() {
  const [notification, setNotification] = useState<PushNotificationPayload | null>(null);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check notification permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'default' && user) {
        // Show subtle prompt to enable match reminders
        const dismissed = localStorage.getItem('match_notif_prompt_dismissed');
        if (!dismissed) {
          setShowPromptBanner(true);
        }
      }
    } else {
      setPermissionStatus('unsupported');
    }
  }, [user]);

  // Setup foreground listener for real-time push notifications
  useEffect(() => {
    let unsubscribe: any = () => {};

    setupForegroundNotifications((payload) => {
      setNotification(payload);

      // Auto dismiss after 10 seconds unless it has room credentials
      const timer = setTimeout(() => {
        setNotification((curr) => (curr === payload ? null : curr));
      }, 10000);

      return () => clearTimeout(timer);
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) return;
    const token = await requestNotificationPermissionAndGetToken(user.uid);
    if (token) {
      setPermissionStatus('granted');
      setShowPromptBanner(false);
    }
  };

  const handleDismissPrompt = () => {
    setShowPromptBanner(false);
    localStorage.setItem('match_notif_prompt_dismissed', 'true');
  };

  const handleCopyCredentials = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification) return;
    const text = `Room ID: ${notification.roomId || ''} | Password: ${notification.roomPassword || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2500);
  };

  const handleNavigateToMatch = () => {
    if (!notification) return;
    if (notification.tournamentId) {
      navigate(`/tournaments/${notification.tournamentId}`);
    } else if (notification.url) {
      navigate(notification.url);
    }
    setNotification(null);
  };

  return (
    <>
      {/* 1. Real-time Incoming Push Notification Alert */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="relative overflow-hidden bg-[#150D2A] border-2 border-brand-purple/60 text-white rounded-2xl shadow-2xl p-4 backdrop-blur-xl">
            {/* Glowing decorative background aura */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-purple/30 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {notification.type === 'MATCH_REMINDER' ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                ) : notification.type === 'ROOM_CREDENTIALS' || notification.roomId ? (
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                      notification.type === 'MATCH_REMINDER'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : notification.type === 'ROOM_CREDENTIALS' || notification.roomId
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {notification.type === 'MATCH_REMINDER'
                        ? '⏰ Match Reminder'
                        : notification.type === 'ROOM_CREDENTIALS' || notification.roomId
                        ? '🔑 Room ID Ready'
                        : '🏆 Tournament Update'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mt-1 line-clamp-1">
                    {notification.title}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              {notification.body}
            </p>

            {/* Room ID and Password Snippet if available */}
            {notification.roomId && (
              <div className="mt-3 bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="font-mono text-xs">
                  <span className="text-gray-400">ID:</span> <span className="font-bold text-yellow-400">{notification.roomId}</span>
                  {notification.roomPassword && (
                    <>
                      <span className="text-gray-500 mx-1.5">|</span>
                      <span className="text-gray-400">Pass:</span> <span className="font-bold text-yellow-400">{notification.roomPassword}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleCopyCredentials}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1 transition"
                >
                  {copiedRoom ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRoom ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-3.5 flex items-center justify-end gap-2">
              <button
                onClick={() => setNotification(null)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg transition"
              >
                Dismiss
              </button>
              <button
                onClick={handleNavigateToMatch}
                className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow flex items-center gap-1.5 transition"
              >
                <span>View Tournament</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Opt-in Banner for Push Notifications (Match reminders & Room IDs) */}
      {showPromptBanner && permissionStatus === 'default' && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#19102E] border border-purple-500/30 rounded-2xl p-4 shadow-xl text-white backdrop-blur-md">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs flex items-center gap-1.5 text-white">
                    <span>Never miss match start!</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Enable push notifications for live Room ID release & 15-min match reminders.
                  </p>
                </div>
              </div>
              <button onClick={handleDismissPrompt} className="text-gray-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={handleDismissPrompt}
                className="text-[11px] text-gray-400 hover:text-white px-2 py-1"
              >
                Later
              </button>
              <button
                onClick={handleEnableNotifications}
                className="px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow transition"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
