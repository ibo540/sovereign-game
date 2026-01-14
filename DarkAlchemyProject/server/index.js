const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity (or configure for your Vercel domain)
        methods: ["GET", "POST"]
    }
});

// --- GAME STATE STORE ---
// In-memory storage (resets on restart)
const sessions = {};
// sessions[code] = { 
//    players: [], 
//    gameState: { phase: 'LOBBY', roles: {}, allocation: {}, votes: {}, ... } 
// }

// Helper: Generate Room Code
const generateCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // JOIN/HOST SESSION
    socket.on('join_session', ({ sessionCode, name, role }) => {
        let code = sessionCode?.toUpperCase();
        let session = sessions[code];

        if (role === 'host') {
            // Create new session if host
            if (!code || !sessions[code]) {
                code = generateCode();
                sessions[code] = {
                    players: [],
                    gameState: {
                        phase: 'LOBBY',
                        roles: {},
                        allocation: {},
                        votes: {},
                        eliminatedPlayers: [],
                        currentRound: 1,
                        stats: { unrest: 0 }
                    }
                };
            }
            socket.join(code);
            socket.emit('session_created', code);
            console.log(`Session ${code} created by Host`);
            return;
        }

        // Player Join
        if (session) {
            // Add player if not exists
            const existing = session.players.find(p => p.name === name);
            if (!existing) {
                session.players.push({ id: socket.id, name, role: 'CITIZEN' }); // Default role until assigned
            } else {
                // Reconnect logic? Update ID
                existing.id = socket.id;
            }

            socket.join(code);
            // Broadcast updated player list
            io.to(code).emit('STATE_UPDATE', {
                players: session.players,
                ...session.gameState
            });
            console.log(`Player ${name} joined ${code}`);
        } else {
            socket.emit('error', 'Session not found');
        }
    });

    // GAME MESSAGES (Generic Handler)
    // The frontend sends { type: 'TYPE', ...payload }
    // We update state and broadcast 'STATE_UPDATE' or specific events
    socket.on('GAME_MESSAGE', (data) => {
        // Find room this socket is in
        // A socket might be in multiple rooms (default + game), so we need the code passed or stored
        const { code, type, ...payload } = data;
        if (!code || !sessions[code]) return;

        const session = sessions[code];
        const state = session.gameState;

        console.log(`[${code}] ACTION: ${type}`, payload);

        switch (type) {
            case 'START_GAME':
                state.phase = 'GAME_ACTIVE';
                io.to(code).emit('STATE_UPDATE', { phase: 'GAME_ACTIVE' });
                break;

            case 'ROLES_ASSIGNED':
                state.roles = payload.roles;
                // session.players update?
                io.to(code).emit('STATE_UPDATE', { roles: state.roles });
                break;

            case 'ALLOCATION_SUBMIT':
                state.allocation = payload.allocation;
                state.phase = 'VOTING_PHASE';
                io.to(code).emit('STATE_UPDATE', {
                    allocation: state.allocation,
                    phase: 'VOTING_PHASE'
                });
                break;

            case 'VOTE_SUBMIT':
                // payload: { vote: 'LOYAL'|'BETRAY', coupType, meta, sender (maybe implied by socket?) }
                // Use a 'votes' object keyed by player name if possible, or just push to array
                // Ideally, we'd identity player by socket.id, but name is often passed.
                // NOTE: Frontend needs to send WHO voted if we don't track socket->player map meticulously.
                // Assuming payload includes sender name? If not, we rely on client sending it or mapping.
                // Let's rely on payload.sender from client for simplicity, or handle it here.
                // WAIT: The frontend 'emit' for VOTE_SUBMIT in EliteView doesn't send sender name implicitly?
                // We should check useGameEngine.

                // For now, let's assume we store it:
                // state.votes[payload.sender] = { val: payload.vote, meta: payload.meta };
                // Actually, the Host frontend manages the logic mostly.
                // The server can just be a relay for "GAME_MESSAGE" events to everyone in the room.

                // IF we want server-authoritative, we write logic here. 
                // IF we want "Relay" mode (Host is brain), we just broadcast.
                // The current architecture seems to rely on Host being the brain for next round logic.

                // RELAY MODE:
                io.to(code).emit('GAME_MESSAGE', { type, ...payload });

                // Also update local state for late joiners?
                if (type === 'VOTE_SUBMIT' && payload.sender) {
                    state.votes = state.votes || {};
                    state.votes[payload.sender] = { val: payload.vote, meta: payload.meta };
                }
                break;

            case 'START_ROUND':
                // Reset round state
                state.currentRound = payload.round;
                state.phase = 'ALLOCATION'; // Or whatever Host decides
                state.votes = {};
                // Clear allocation?
                state.allocation = {};
                io.to(code).emit('STATE_UPDATE', {
                    currentRound: state.currentRound,
                    phase: 'ALLOCATION',
                    votes: {},
                    allocation: {}
                });
                break;

            case 'EXECUTION_ORDER':
                // payload: { targets: ['Name'] }
                state.eliminatedPlayers = [
                    ...(state.eliminatedPlayers || []),
                    ...(payload.targets || [])
                ];
                io.to(code).emit('STATE_UPDATE', { eliminatedPlayers: state.eliminatedPlayers });
                break;

            case 'PROTEST': // Citizen protest
                state.stats.unrest = (state.stats.unrest || 0) + 1;
                // Track who protested?
                io.to(code).emit('STATE_UPDATE', { stats: state.stats });
                // Also broadcast the raw message so Host can track "Who"
                io.to(code).emit('GAME_MESSAGE', { type: 'PROTEST', sender: payload.sender });
                break;

            default:
                // Universal Relay for other events
                io.to(code).emit('GAME_MESSAGE', { type, ...payload });
                break;
        }

        // Always emit a generic state sync after action?
        // io.to(code).emit('STATE_UPDATE', { ...state });
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
        // Clean up?
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING on port ${PORT}`);
});
