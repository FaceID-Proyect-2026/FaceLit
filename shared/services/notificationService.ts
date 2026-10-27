import { api } from './api';
import type { Notification, NotificationCategory, NotificationChannel } from '@/features/notifications/types';
import { parseNotificationMeta } from '@/features/notifications/localizeNotification';
import { getBogotaDateTimeParts } from '@/shared/utils/dates';

type BackendNotification = {
  id: string;
  recipientUserId: string;
  type: Notification['type'];
  category: string;
  channel: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  meta?: string | null;
  emailStatus?: string | null;
};

const categoryMap: Record<string, NotificationCategory> = {
  ACADEMIC: 'academic',
  ATTENDANCE: 'attendance',
  FACIAL_RECOGNITION: 'facial',
  SECURITY: 'security',
  TRANSFER: 'transfer',
  // Read historical responses during an expand/contract rollout as well.
  ACADEMICO: 'academic',
  ASISTENCIA: 'attendance',
  RECONOCIMIENTO_FACIAL: 'facial',
  SEGURIDAD: 'security',
  TRASLADO: 'transfer',
};

function mapChannel(channel: string): NotificationChannel {
  return channel === 'APP_EMAIL' ? 'app+email' : 'app';
}

function mapEmailStatus(status?: string | null): Notification['emailStatus'] {
  if (!status) return undefined;
  if (status === 'SENT') return 'sent';
  if (status === 'FAILED') return 'failed';
  return 'pending';
}

function mapNotification(item: BackendNotification): Notification {
  const created = new Date(item.createdAt);
  const iso = Number.isNaN(created.getTime()) ? undefined : created.toISOString();
  const local = getBogotaDateTimeParts(created);
  const meta = parseNotificationMeta(item.meta);
  const category = item.type.startsWith('csv_') ? 'csv' : (categoryMap[item.category] ?? 'academic');

  return {
    id: item.id,
    recipientUserId: item.recipientUserId,
    type: item.type,
    category,
    channel: mapChannel(item.channel),
    title: item.title,
    message: item.message,
    createdAt: iso,
    date: local?.date ?? '',
    time: local?.time ?? '',
    read: item.read,
    meta,
    emailStatus: mapEmailStatus(item.emailStatus),
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await api.get<BackendNotification[]>('/api/notifications');
  return data.map(mapNotification);
}

export async function markNotificationReadRemote(id: string): Promise<Notification> {
  const { data } = await api.patch<BackendNotification>(`/api/notifications/${id}/read`);
  return mapNotification(data);
}

export async function markAllNotificationsReadRemote(): Promise<Notification[]> {
  const { data } = await api.patch<BackendNotification[]>('/api/notifications/read-all');
  return data.map(mapNotification);
}

export async function resolveFacialNotificationRemote(id: string, decision: 'accepted' | 'rejected') {
  await api.patch(`/api/notifications/${id}/facial-request`, { decision });
}
