// ─────────────────────────────────────────────
//  features/notifications/useNotifications.ts
//  RF-8.2 — Hook reactivo de notificaciones
// ─────────────────────────────────────────────
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import {
  getNotificationsSnapshot,
  getRemoteUnreadCount,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  pushNotification,
  resolveFacialRequest,
  subscribeNotifications,
  setNotificationsOwner,
} from './notificationsStore';
import type { NotificationCategory, NotificationMeta, NotificationType } from './types';

export type StatusFilter = 'all' | 'unread' | 'read';

export function useRemoteUnreadCount(recipientUserId?: string): number {
  return useSyncExternalStore(
    subscribeNotifications,
    () => getRemoteUnreadCount(recipientUserId),
  );
}

export function useNotifications(opts?: {
  statusFilter?: StatusFilter;
  categoryFilter?: NotificationCategory | 'all';
  /** Limita la bandeja a las notificaciones personales del destinatario. */
  recipientUserId?: string;
}) {
  const { user } = useAuth();
  const { statusFilter, categoryFilter } = opts ?? {};
  const recipientUserId = opts?.recipientUserId ?? user?.id;
  const all = useSyncExternalStore(subscribeNotifications, getNotificationsSnapshot);

  useEffect(() => {
    setNotificationsOwner(user?.id ?? '');
    if (!user?.id) return;
    loadNotifications();
    const timer = setInterval(() => {
      loadNotifications();
    }, 15000);
    return () => clearInterval(timer);
  }, [user?.id]);

  const filtered = useMemo(() => {
    let list = recipientUserId
      ? all.filter(n => n.recipientUserId === recipientUserId)
      : [];

    // Filtro por estado
    const sf = statusFilter ?? 'all';
    if (sf === 'unread') list = list.filter(n => !n.read);
    else if (sf === 'read') list = list.filter(n => n.read);

    // Filtro por categoría
    const cf = categoryFilter ?? 'all';
    if (cf !== 'all') list = list.filter(n => n.category === cf);

    // Siempre más reciente primero
    return [...list].sort((a, b) => {
      if (a.createdAt && b.createdAt) return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      const ta = `${a.date}T${a.time}`;
      const tb = `${b.date}T${b.time}`;
      return tb.localeCompare(ta);
    });
  }, [all, statusFilter, categoryFilter, recipientUserId]);

  const unreadCount = useMemo(
    () => (recipientUserId ? all.filter(n => n.recipientUserId === recipientUserId) : [])
      .filter(n => !n.read).length,
    [all, recipientUserId],
  );

  return {
    notifications: filtered,
    unreadCount,
    markRead:    (id: string) => markNotificationRead(id),
    markAllRead: () => markAllNotificationsRead(),
    push: (type: NotificationType, title: string, message: string, meta?: NotificationMeta) =>
      pushNotification(type, title, message, meta),
    resolveFacial: (notifId: string, decision: 'accepted' | 'rejected', decidedBy: string, decidedByName?: string) =>
      resolveFacialRequest(notifId, decision, decidedBy, decidedByName),
  };
}
