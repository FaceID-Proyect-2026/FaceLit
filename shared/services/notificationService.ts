import { api } from './api';
import type { Notification, NotificationCategory, NotificationChannel } from '@/features/notifications/types';

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
  const iso = Number.isNaN(created.getTime()) ? new Date().toISOString() : created.toISOString();
  const meta = item.meta ? JSON.parse(item.meta) : undefined;
  const category = item.type.startsWith('csv_') ? 'csv' : (categoryMap[item.category] ?? 'academic');

  return {
    id: item.id,
    recipientUserId: item.recipientUserId,
    type: item.type,
    category,
    channel: mapChannel(item.channel),
    title: item.title,
    message: item.message,
    date: iso.slice(0, 10),
    time: iso.slice(11, 16),
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
