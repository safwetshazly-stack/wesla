import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/auth.store'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken
    socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => console.log('[Socket] Connected'))
    socket.on('disconnect', () => console.log('[Socket] Disconnected'))
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message))
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
