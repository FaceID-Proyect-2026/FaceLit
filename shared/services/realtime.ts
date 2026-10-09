import { API_URL } from '@/shared/constants/api';

export type RealtimeMessage = {
  type: 'ready' | 'sync' | 'data.changed' | 'authentication.failed';
  resource?: string;
  action?: string;
  actorId?: string;
  changedAt?: string;
};

type RealtimeListener = (message: RealtimeMessage) => void;

const listeners = new Set<RealtimeListener>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let connectionGeneration = 0;
let connectionActive = false;
let accessToken: string | null = null;

function emit(message: RealtimeMessage) {
  listeners.forEach(listener => listener(message));
}

export function subscribeRealtime(listener: RealtimeListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function websocketUrl() {
  return `${API_URL.replace(/^http/, 'ws').replace(/\/+$/, '')}/ws/realtime`;
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function send(message: { type: string; token?: string }) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function connect(generation: number) {
  if (!connectionActive || generation !== connectionGeneration || !accessToken) return;

  clearReconnectTimer();
  let nextSocket: WebSocket;
  try {
    nextSocket = new WebSocket(websocketUrl());
  } catch (error) {
    console.warn('[Realtime] No se pudo abrir el canal WebSocket:', error);
    scheduleReconnect(generation);
    return;
  }
  socket = nextSocket;

  nextSocket.onopen = () => {
    if (generation !== connectionGeneration || !connectionActive) {
      nextSocket.close(1000, 'Sesión cerrada');
      return;
    }
    send({ type: 'authenticate', token: accessToken ?? undefined });
  };

  nextSocket.onmessage = event => {
    if (generation !== connectionGeneration || typeof event.data !== 'string') return;
    try {
      const message = JSON.parse(event.data) as RealtimeMessage;
      if (message.type === 'ready' || message.type === 'sync') {
        reconnectAttempts = 0;
      }
      emit(message);
    } catch (error) {
      console.warn('[Realtime] Se recibió un mensaje WebSocket inválido:', error);
    }
  };

  nextSocket.onerror = () => {
    console.warn('[Realtime] Error en la conexión WebSocket.');
  };

  nextSocket.onclose = event => {
    if (generation !== connectionGeneration || !connectionActive) return;
    socket = null;
    if (event.code === 1008) {
      connectionActive = false;
      emit({ type: 'authentication.failed' });
      return;
    }
    scheduleReconnect(generation);
  };
}

function scheduleReconnect(generation: number) {
  if (!connectionActive || generation !== connectionGeneration || reconnectTimer) return;
  const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(generation);
  }, delay);
}

export function startRealtime(token: string) {
  stopRealtime();
  accessToken = token;
  connectionActive = true;
  reconnectAttempts = 0;
  const generation = ++connectionGeneration;
  connect(generation);

  return () => {
    if (generation === connectionGeneration) stopRealtime();
  };
}

export function stopRealtime() {
  connectionActive = false;
  accessToken = null;
  clearReconnectTimer();
  connectionGeneration += 1;
  const previousSocket = socket;
  socket = null;
  if (previousSocket && previousSocket.readyState < WebSocket.CLOSING) {
    previousSocket.close(1000, 'Sesión cerrada');
  }
}

export function requestRealtimeSync() {
  if (socket?.readyState === WebSocket.OPEN) {
    send({ type: 'sync' });
    return;
  }
  if (socket && socket.readyState !== WebSocket.CLOSED) return;
  if (connectionActive && !reconnectTimer) connect(connectionGeneration);
}
