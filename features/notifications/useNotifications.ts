// ─────────────────────────────────────────────
//  features/notifications/useNotifications.ts
//  RF-8.2 — Hook reactivo de notificaciones
// ─────────────────────────────────────────────
import { useMemo, useSyncExternalStore } from 'react';
import {
  getNotificationsSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
  pushNotification,
  resolveFacialRequest,
  subscribeNotifications,
} from './notificationsStore';
import type { NotificationCategory, NotificationMeta, NotificationType } from './types';

export type StatusFilter = 'all' | 'unread' | 'read';

export function useNotifications(opts?: {
  statusFilter?: StatusFilter;
  categoryFilter?: NotificationCategory | 'all';
  /** Limita la bandeja a las notificaciones personales del destinatario. */
  recipientUserId?: string;
}) {
  const all = useSyncExternalStore(subscribeNotifications, getNotificationsSnapshot);

  const filtered = useMemo(() => {
    let list = opts?.recipientUserId
      ? all.filter(n => n.recipientUserId === opts.recipientUserId)
      : all;

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
  }, [all, opts?.statusFilter, opts?.categoryFilter, opts?.recipientUserId]);

  const unreadCount = useMemo(
    () => (opts?.recipientUserId ? all.filter(n => n.recipientUserId === opts.recipientUserId) : all)
      .filter(n => !n.read).length,
    [all, opts?.recipientUserId],
  );

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
