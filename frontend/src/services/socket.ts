import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinProject(projectId: string) {
    this.socket?.emit('join:project', projectId);
  }

  leaveProject(projectId: string) {
    this.socket?.emit('leave:project', projectId);
  }

  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    this.socket?.on(event, handler);
  }

  off<K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]) {
    this.socket?.off(event, handler);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
