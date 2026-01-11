/**
 * Dark Alchemy - Real-time Game Server
 * Handles WebSocket connections for cross-device multiplayer gameplay
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // In production, specify your domain
    methods: ["GET", "POST"]
  }
});

// Serve static files from DarkAlchemyProject directory
app.use(cors());
app.use(express.static(path.join(__dirname, 'DarkAlchemyProject')));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'DarkAlchemyProject', 'index.html'));
});

// Store active game sessions
const gameSessions = new Map(); // sessionCode -> { players: Set, hostSocketId: string }

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle join request
  socket.on('JOIN_REQUEST', (data) => {
    const { code, name } = data;
    if (!code || !name) {
      socket.emit('ERROR', { message: 'Code and name required' });
      return;
    }

    const sessionCode = code.toUpperCase();
    let session = gameSessions.get(sessionCode);

    if (!session) {
      // Session doesn't exist - could be a player trying to join before host creates
      socket.emit('ERROR', { message: 'Session not found. Please check the code.' });
      return;
    }

    // Check for duplicate names
    if (Array.from(session.players).some(p => p.name === name)) {
      socket.emit('ERROR', { message: 'Name already taken' });
      return;
    }

    // Add player to session
    const playerInfo = { name, socketId: socket.id };
    session.players.add(playerInfo);
    socket.join(sessionCode);
    socket.sessionCode = sessionCode;
    socket.playerName = name;

    console.log(`Player ${name} joined session ${sessionCode}`);

    // Confirm join to player
    socket.emit('JOIN_SUCCESS', { name });

    // Broadcast player count update to all in session
    io.to(sessionCode).emit('STATE_UPDATE', {
      type: 'STATE_UPDATE',
      playerCount: session.players.size,
      sessionCode: sessionCode
    });
  });

  // Handle game messages (forward to all in session)
  socket.on('GAME_MESSAGE', (data) => {
    if (!socket.sessionCode) return;

    // Broadcast to all players in the session (including sender)
    io.to(socket.sessionCode).emit('GAME_MESSAGE', {
      ...data,
      sender: socket.playerName
    });
  });

  // Handle session creation (host)
  socket.on('CREATE_SESSION', (data) => {
    const { code } = data;
    if (!code) {
      socket.emit('ERROR', { message: 'Session code required' });
      return;
    }

    const sessionCode = code.toUpperCase();

    if (gameSessions.has(sessionCode)) {
      socket.emit('ERROR', { message: 'Session code already exists' });
      return;
    }

    // Create new session
    gameSessions.set(sessionCode, {
      players: new Set(),
      hostSocketId: socket.id,
      createdAt: Date.now()
    });

    socket.join(sessionCode);
    socket.sessionCode = sessionCode;
    socket.isHost = true;

    console.log(`Session ${sessionCode} created by ${socket.id}`);

    socket.emit('SESSION_CREATED', { code: sessionCode });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    if (socket.sessionCode) {
      const session = gameSessions.get(socket.sessionCode);
      if (session) {
        // Remove player from session
        const playerToRemove = Array.from(session.players).find(p => p.socketId === socket.id);
        if (playerToRemove) {
          session.players.delete(playerToRemove);
        }

        // If host disconnects, clean up session after a delay (in case of reconnection)
        if (socket.isHost) {
          setTimeout(() => {
            // Check if host reconnected
            const currentSession = gameSessions.get(socket.sessionCode);
            if (currentSession && currentSession.hostSocketId === socket.id) {
              gameSessions.delete(socket.sessionCode);
              console.log(`Session ${socket.sessionCode} removed (host disconnected)`);
            }
          }, 30000); // 30 second grace period
        } else {
          // Notify others that player left
          io.to(socket.sessionCode).emit('STATE_UPDATE', {
            type: 'STATE_UPDATE',
            playerCount: session.players.size,
            sessionCode: socket.sessionCode
          });
        }
      }
    }
  });

  // Health check
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Clean up old sessions (older than 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [code, session] of gameSessions.entries()) {
    if (now - session.createdAt > 3600000) { // 1 hour
      gameSessions.delete(code);
      console.log(`Cleaned up old session: ${code}`);
    }
  }
}, 600000); // Check every 10 minutes

// Export for Vercel serverless
module.exports = app;

// Start server locally (for development)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Dark Alchemy Game Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for connections`);
  });
}
