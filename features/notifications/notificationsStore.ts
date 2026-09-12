// ─────────────────────────────────────────────
//  features/notifications/notificationsStore.ts
//  RF-8 V4 — Store de notificaciones
//
//  Mismo patrón pub/sub que los demás stores del proyecto
//  (useSyncExternalStore).
//
//  RF-8.1 — pushNotification() genera automáticamente la
//  notificación con fecha/hora, canal y estado no-leído.
//
//  RF-8.3 — Las notificaciones 'app+email' marcan emailStatus
//  como 'pending'; en producción este store llama al endpoint
//  SMTP del backend. El mock las deja en 'pending' para que
//  la UI las distinga.
// ─────────────────────────────────────────────
import {
  MOCK_NOTIFICATIONS_RF8,
  NOTIFICATION_CHANNELS,
  Notification,
  NotificationMeta,
  NotificationType,
} from './types';

type Listener = () => void;

let notifications: Notification[] = [...MOCK_NOTIFICATIONS_RF8];
const listeners = new Set<Listener>();

function emit() { listeners.forEach(l => l()); }

export function subscribeNotifications(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNotificationsSnapshot(): Notification[] {
  return notifications;
}

// ── Derivar categoría desde tipo ─────────────
function categoryFromType(type: NotificationType): Notification['category'] {
  if (type.startsWith('csv_'))            return 'csv';
  if (type === 'learner_transferred')     return 'transfer';
  if (type.startsWith('attendance_'))     return 'attendance';
  if (type.startsWith('academic_'))       return 'academic';
  if (type.startsWith('security_'))       return 'security';
  if (type.startsWith('facial_'))         return 'facial';
  return 'academic';
}

// ── RF-8.1 — Emitir una nueva notificación ───
export function pushNotification(
  type: NotificationType,
  title: string,
  message: string,
  meta?: NotificationMeta,
): Notification {
  const now     = new Date();
  const channel = NOTIFICATION_CHANNELS[type];

  const notification: Notification = {
    id:       `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    category: categoryFromType(type),
    channel,
    title,
    message,
    date: now.toISOString().slice(0, 10),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    read:   false,
    meta,
    // RF-8.3: marcar como pendiente si el canal incluye correo
    emailStatus: channel === 'app+email' ? 'pending' : undefined,
  };

  notifications = [notification, ...notifications]; // más reciente primero
  emit();

  // RF-8.3: en producción, aquí se dispararía la llamada al backend SMTP.
  // api.post('/api/notifications/email', notification).then(() => {
  //   markEmailSent(notification.id);
  // }).catch(() => { /* quedará en 'pending' */ });

  return notification;
}

// ── RF-8.2 — Marcar como leída ────────────────
export function markNotificationRead(id: string): void {
  notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  emit();
}

export function markAllNotificationsRead(): void {
  notifications = notifications.map(n => ({ ...n, read: true }));
  emit();
}

// ── RF-8.4 — Resolver solicitud de re-registro ──
export function resolveFacialRequest(
  notificationId: string,
  decision: 'accepted' | 'rejected',
  decidedBy: string,
): void {
  const now = new Date().toISOString();
  notifications = notifications.map(n =>
    n.id === notificationId
      ? {
          ...n,
          read: true,
          meta: {
            ...n.meta,
            facialDecision: decision,
            decidedBy,
            decidedAt: now,
          },
        }
      : n,
  );
  emit();
}

// ── RF-8.3 — Marcar correo como enviado ──────
export function markEmailSent(id: string): void {
  notifications = notifications.map(n =>
    n.id === id ? { ...n, emailStatus: 'sent' as const } : n,
  );
  emit();
}

// ── Unread count (para badge en sidebar/campana) ──
export function getUnreadCount(): number {
  return notifications.filter(n => !n.read).length;
}
