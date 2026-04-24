import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});
