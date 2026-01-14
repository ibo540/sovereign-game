import { io } from 'socket.io-client';

// Force Remote Server (User does not have local backend running)
const SERVER_URL = 'https://dark-alchemy-server.onrender.com';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect(url = SERVER_URL) {
        if (this.socket) return this.socket;

        this.socket = io(url, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to Game Server:', this.socket.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('❌ Connection Error:', err);
        });

        return this.socket;
    }

    // Join a room (Session)
    joinSession(sessionCode, name, role = 'host') {
        if (!this.socket) this.connect();
        this.socket.emit('join_session', { sessionCode, name, role });
    }

    // Send a generic message
    send(type, payload) {
        if (!this.socket) return;
        this.socket.emit('GAME_MESSAGE', { type, ...payload });
    }

    // Event listener wrapper
    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);
    }

    off(event) {
        if (!this.socket) return;
        this.socket.off(event);
    }
}

export const socketService = new SocketService();
