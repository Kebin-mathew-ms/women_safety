import { io, Socket } from 'socket.io-client';
import SecureStorageService from './secureStore';

const DEFAULT_SOCKET_URL = 'http://192.168.1.15:5001';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to the Socket.IO server
   */
  public async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = await SecureStorageService.getAuthToken();

    this.socket = io(DEFAULT_SOCKET_URL, {
      auth: {
        token: token || undefined,
      },
      transports: ['websocket'],
      autoConnect: false,
    });

    this.socket.on('connect', () => {
      console.log(`🔌 Connected to socket server: ${this.socket?.id}`);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('🔌 Socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from socket server. Reason:', reason);
    });

    this.socket.connect();
    return this.socket;
  }

  /**
   * Disconnect from the socket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected manually.');
    }
  }

  /**
   * Join a room
   */
  public joinRoom(roomName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_room', roomName);
    } else {
      console.warn('Socket not connected. Cannot join room.');
    }
  }

  /**
   * Leave a room
   */
  public leaveRoom(roomName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', roomName);
    }
  }

  /**
   * Listen to an event
   */
  public on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Stop listening to an event
   */
  public off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emit an event
   */
  public emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}

export const socketService = SocketService.getInstance();
export default socketService;
