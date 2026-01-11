/**
 * Enhanced DualChannel with WebSocket Support
 * Supports both local (BroadcastChannel/LocalStorage) and remote (WebSocket) communication
 */

class DualChannel {
    constructor(channelName, onMessage, options = {}) {
        this.name = channelName;
        this.onMessage = onMessage;
        this.serverUrl = options.serverUrl || this.detectServerUrl();
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;

        // Try WebSocket first if server URL is available
        if (this.serverUrl) {
            this.initWebSocket();
        } else {
            // Fallback to local communication
            this.initLocal();
        }
    }

    detectServerUrl() {
        // Check for environment variable or config
        if (window.GAME_SERVER_URL) {
            console.log('Using configured server URL:', window.GAME_SERVER_URL);
            return window.GAME_SERVER_URL;
        }
        
        // Auto-detect: if running on localhost, use local server
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Auto-detected localhost, using local server');
            return 'http://localhost:3000';
        }
        
        // For production, use same origin (server should be on same domain)
        // Or set window.GAME_SERVER_URL in your HTML
        console.warn('No server URL configured. Falling back to local mode (same device only).');
        return null; // Will fall back to local mode
    }

    initWebSocket() {
        try {
            // Check if Socket.io is available (should be loaded via CDN in HTML)
            if (typeof io === 'undefined') {
                console.warn('Socket.io library not found, falling back to local mode');
                console.warn('Make sure to include: <script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>');
                this.initLocal();
                return;
            }
            this.connectWebSocket();
        } catch (e) {
            console.warn('WebSocket initialization failed, falling back to local mode:', e);
            this.initLocal();
        }
    }

    connectWebSocket() {
        try {
            console.log('Attempting to connect to server:', this.serverUrl);
            
            // Wake up Render server if it's sleeping (free tier)
            fetch(`${this.serverUrl}/health`)
                .then(() => console.log('Server health check passed'))
                .catch(err => console.warn('Server health check failed (may be sleeping):', err));
            
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 2000, // Increased delay for Render
                reconnectionAttempts: this.maxReconnectAttempts,
                timeout: 20000, // 20 second timeout for Render free tier
                forceNew: true // Force new connection
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to game server');
                this.connected = true;
                this.reconnectAttempts = 0;
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from game server');
                this.connected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error to server:', error);
                console.warn('Falling back to local mode. Server may be unavailable or sleeping (Render free tier).');
                // Don't immediately fall back - keep trying to connect
                // Only fall back if connection fails multiple times
                this.reconnectAttempts++;
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.warn('Max reconnection attempts reached, falling back to local mode');
                    this.initLocal();
                }
            });

            // Listen for game messages
            this.socket.on('GAME_MESSAGE', (data) => {
                this.input(data);
            });

            // Listen for other events
            this.socket.on('JOIN_SUCCESS', (data) => {
                this.input({ type: 'JOIN_SUCCESS', ...data });
            });

            this.socket.on('ERROR', (data) => {
                this.input({ type: 'ERROR', ...data });
            });

            this.socket.on('STATE_UPDATE', (data) => {
                this.input({ type: 'STATE_UPDATE', ...data });
            });

            this.socket.on('SESSION_CREATED', (data) => {
                this.input({ type: 'SESSION_CREATED', ...data });
            });

        } catch (e) {
            console.warn('WebSocket connection failed, falling back to local mode:', e);
            this.initLocal();
        }
    }

    initLocal() {
        // 1. BroadcastChannel
        if (window.BroadcastChannel) {
            this.bc = new BroadcastChannel(this.name);
            this.bc.onmessage = (ev) => this.input(ev.data);
        }

        // 2. LocalStorage Fallback
        this.key = `DA_MSG_${this.name}`;
        window.addEventListener('storage', (ev) => {
            if (ev.key === this.key && ev.newValue) {
                try {
                    const data = JSON.parse(ev.newValue);
                    this.input(data);
                } catch (e) {
                    console.error("Comms Parse Error", e);
                }
            }
        });
    }

    send(data) {
        // If WebSocket is connected, use it
        if (this.connected && this.socket) {
            // Check if this is a join request or session creation
            if (data.type === 'JOIN_REQUEST') {
                this.socket.emit('JOIN_REQUEST', {
                    code: data.code,
                    name: data.name
                });
            } else if (data.type === 'CREATE_SESSION') {
                this.socket.emit('CREATE_SESSION', {
                    code: data.code
                });
            } else {
                // Forward all other game messages
                this.socket.emit('GAME_MESSAGE', data);
            }
        }

        // Also send via local channels (for backward compatibility and same-device)
        if (this.bc) {
            this.bc.postMessage(data);
        }

        // LocalStorage
        const payload = JSON.stringify(data);
        localStorage.setItem(this.key, payload);
    }

    input(data) {
        if (this.onMessage) {
            this.onMessage(data);
        }
    }

    // Method to create session on server (for host)
    createSession(code) {
        if (this.connected && this.socket) {
            this.socket.emit('CREATE_SESSION', { code });
        } else {
            // Fallback: just send via local channel
            this.send({ type: 'CREATE_SESSION', code });
        }
    }

    // Method to explicitly join a session (for players)
    joinSession(code, name) {
        if (this.connected && this.socket) {
            this.socket.emit('JOIN_REQUEST', { code, name });
        } else {
            // Fallback: send via local channel
            this.send({ type: 'JOIN_REQUEST', code, name });
        }
    }
}
