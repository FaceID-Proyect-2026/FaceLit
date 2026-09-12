// ─────────────────────────────────────────────
//  features/notifications/useNotifications.ts
//  RF-8.2 — Hook reactivo de notificaciones
// ─────────────────────────────────────────────
import { useMemo, useSyncExternalStore } from 'react';
import {
  getNotificationsSnapshot,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  pushNotification,
  resolveFacialRequest,
  subscribeNotifications,
} from './notificationsStore';
import type { Notification, NotificationCategory, NotificationMeta, NotificationType } from './types';

export type StatusFilter = 'all' | 'unread' | 'read';

export function useNotifications(opts?: {
  statusFilter?: StatusFilter;
  categoryFilter?: NotificationCategory | 'all';
}) {
  const all = useSyncExternalStore(subscribeNotifications, getNotificationsSnapshot);

  const filtered = useMemo(() => {
    let list = all;

    // Filtro por estado
    const sf = opts?.statusFilter ?? 'all';
    if (sf === 'unread') list = list.filter(n => !n.read);
    else if (sf === 'read') list = list.filter(n => n.read);

    // Filtro por categoría
    const cf = opts?.categoryFilter ?? 'all';
    if (cf !== 'all') list = list.filter(n => n.category === cf);

    // Siempre más reciente primero
    return [...list].sort((a, b) => {
      const ta = `${a.date}T${a.time}`;
      const tb = `${b.date}T${b.time}`;
      return tb.localeCompare(ta);
    });
  }, [all, opts?.statusFilter, opts?.categoryFilter]);

  const unreadCount = useMemo(() => all.filter(n => !n.read).length, [all]);

  return {
    notifications: filtered,
    unreadCount,
    markRead:    (id: string) => markNotificationRead(id),
    markAllRead: () => markAllNotificationsRead(),
    push: (type: NotificationType, title: string, message: string, meta?: NotificationMeta) =>
      pushNotification(type, title, message, meta),
    resolveFacial: (notifId: string, decision: 'accepted' | 'rejected', decidedBy: string) =>
      resolveFacialRequest(notifId, decision, decidedBy),
  };
}
