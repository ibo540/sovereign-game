import { useState, useEffect, useRef } from 'react';
import { socketService } from '../services/socket';

export function useGameEngine(role = 'host') {
    const [gameState, setGameState] = useState({
        phase: 'LOBBY',
        players: [],
        sessionCode: '----',
        playerCount: 0,
        roles: {},
        sessionCode: '----',
        playerCount: 0,
        roles: {},
        eliminatedPlayers: [], // New: Track eliminated
        messages: [], // New: Chat Storage
        myName: localStorage.getItem('player_name') || null
    });

    // Local Cache for Names (The "Shield" Logic)
    // We use an ARRAY to preserve join order (FIFO) so Player 1 = knownNames[0]
    const knownNames = useRef([]);
    const initialized = useRef(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('dark_alchemy_names');
            if (saved) {
                knownNames.current = JSON.parse(saved);
                console.log('📦 Loaded known names:', knownNames.current);
            }
        } catch (e) {
            console.error('Failed to load names', e);
        }
    }, []);

    const saveNames = () => {
        try {
            localStorage.setItem('dark_alchemy_names', JSON.stringify(knownNames.current));
        } catch (e) { console.error('Storage save failed', e); }
    };

    useEffect(() => {
        // 1. Connect
        const socket = socketService.connect();

        // 2. Setup Host Session if Host (Run Once)
        if (role === 'host' && !initialized.current) {
            initialized.current = true;
            const code = Math.random().toString(36).substring(2, 6).toUpperCase();
            setGameState(prev => ({ ...prev, sessionCode: code }));

            // Register as Host (LEGACY PROTOCOL)
            socket.emit('CREATE_SESSION', { code });
            console.log('👑 Host registered with code:', code);

            // CRITICAL: Clear cache on new session
            knownNames.current = [];
            saveNames();
        }

        // 3. Listeners

        // GAME MESSAGE (Side Channel for Names & Roles & Chat)
        socket.on('GAME_MESSAGE', (msg) => {
            if (!msg) return;

            // 1. NAME ANNOUNCE
            if (msg.type === 'NAME_ANNOUNCE' && msg.name) {
                console.log("🗣️ NAME ANNOUNCE:", msg.name);
                const newName = msg.name;
                if (!knownNames.current.includes(newName)) {
                    knownNames.current.push(newName);
                    saveNames();
                }
                setGameState(prev => {
                    // Force re-map player names
                    const updatedPlayers = prev.players.map((p, index) => {
                        if (knownNames.current[index]) {
                            return { ...p, name: knownNames.current[index] };
                        }
                        return p;
                    });
                    return { ...prev, players: updatedPlayers };
                });
            }

            // 2. ROLES ASSIGNED (Host Fallback Broadcast)
            if (msg.type === 'ROLES_ASSIGNED' && msg.roles) {
                console.log("🎲 ROLES RECEIVED via Side Channel:", msg.roles);
                setGameState(prev => ({
                    ...prev,
                    roles: msg.roles,
                    phase: 'GAME_ACTIVE' // Force active state
                }));
            }

            // 3. ALLOCATION UPDATE (From Leader -> Host -> Everyone)
            // Note: In a real app the server handles this. Here we might rely on broadcast.
            if (msg.type === 'ALLOCATION_SUBMIT' && msg.allocation) {
                console.log("💰 ALLOCATION RECEIVED:", msg.allocation);
                setGameState(prev => ({
                    ...prev,
                    allocation: msg.allocation,
                    phase: 'VOTING_PHASE' // Example phase switch
                }));
            }

            // 4. VOTE UPDATE (From Elite -> Host)
            if (msg.type === 'VOTE_SUBMIT' && msg.vote) {
                // Return Object format for Host processing
                console.log("🗳️ VOTE RECEIVED:", msg);
                setGameState(prev => ({
                    ...prev,
                    votes: {
                        ...prev.votes,
                        [msg.sender || 'Unknown']: { val: msg.vote, meta: msg.meta }
                    }
                }));
            }

            // 5. CHAT MESSAGE (New)
            if (msg.type === 'CHAT_MESSAGE' && msg.text) {
                console.log("💬 CHAT RECEIVED:", msg);
                setGameState(prev => {
                    // DEDUPLICATION: Check if message ID already exists
                    // We assume messages have unique 'id' (timestamp-random)
                    const isDuplicate = prev.messages && prev.messages.some(m => m.id === msg.id);
                    if (isDuplicate) {
                        console.warn("⚠️ Ignored Duplicate Message:", msg.id);
                        return prev;
                    }
                    return {
                        ...prev,
                        messages: [...(prev.messages || []), msg]
                    };
                });
            }

            // 6. PROTEST (New)
            if (msg.type === 'PROTEST') {
                console.log("🔥 PROTEST RECEIVED");
                setGameState(prev => ({
                    ...prev,
                    stats: {
                        ...prev.stats,
                        unrest: (prev.stats?.unrest || 0) + 5 // Increase by 5 per protest
                    }
                }));
            }

            // 7. GAME RESULT (Victory/Defeat)
            if (msg.type === 'GAME_RESULT') {
                console.log("🏆 GAME RESULT:", msg);
                setGameState(prev => ({
                    ...prev,
                    result: msg,
                    phase: 'JUDGMENT' // Trigger Leader Judgment / Game Over
                }));
            }

            // 8. PLAYER DIED (Direct or via Execution Order)
            if (msg.type === 'PLAYER_DIED' && msg.name) {
                console.log("💀 PLAYER DIED:", msg.name);
                setGameState(prev => {
                    const newEliminated = prev.eliminatedPlayers.includes(msg.name)
                        ? prev.eliminatedPlayers
                        : [...(prev.eliminatedPlayers || []), msg.name];

                    if (prev.myName === msg.name) return { ...prev, status: 'DEAD', eliminatedPlayers: newEliminated };
                    return { ...prev, eliminatedPlayers: newEliminated };
                });
            }

            if (msg.type === 'EXECUTION_ORDER' && msg.targets) {
                console.log("⚖️ EXECUTION ORDER:", msg.targets);
                setGameState(prev => {
                    // Add targets to eliminated list
                    const currentEliminated = prev.eliminatedPlayers || [];
                    const newEliminated = [...new Set([...currentEliminated, ...msg.targets])];

                    if (msg.targets.includes(prev.myName)) {
                        return { ...prev, status: 'DEAD', eliminatedPlayers: newEliminated, judgmentExecuted: true };
                    }
                    return { ...prev, eliminatedPlayers: newEliminated, judgmentExecuted: true };
                });
            }


            // 9. START ROUND (Reset)
            if (msg.type === 'START_ROUND') {
                console.log("🔄 STARTING ROUND:", msg.round);
                setGameState(prev => ({
                    ...prev,
                    phase: 'GAME_ACTIVE', // Reset to Allocation
                    currentRound: msg.round,
                    allocation: null, // Clear allocation
                    votes: {}, // Clear votes
                    result: null, // Clear result
                    judgmentExecuted: false, // Reset judgment flag
                    messages: [] // Optional: Clear chat?
                }));
            }

            // 10. GAME OVER
            if (msg.type === 'GAME_OVER') {
                console.log("🏁 GAME OVER RECEIVED");
                setGameState(prev => ({
                    ...prev,
                    phase: 'GAME_OVER'
                }));
            }
        });

        // JOIN REQUEST (The "Golden Source")
        socket.on('JOIN_REQUEST', (data) => {
            console.log('📩 Receive Join Request:', data);
            if (data.name) {
                // Add to ordered list if uniqueness check passes
                if (!knownNames.current.includes(data.name)) {
                    knownNames.current.push(data.name);
                    saveNames();
                }

                // Optimistic Local Update
                setGameState(prev => {
                    const exists = prev.players.find(p => p.name === data.name);
                    if (!exists) {
                        return {
                            ...prev,
                            players: [...prev.players, { name: data.name, ...data }],
                            playerCount: prev.playerCount + 1
                        };
                    }
                    return prev;
                });
            }
        });

        // STATE UPDATE (Sync from Server)
        socket.on('STATE_UPDATE', (msg) => {
            // console.log('🔄 State Update:', msg);

            setGameState(prev => {
                let serverPlayers = msg.players || [];
                let serverCount = (msg.playerCount !== undefined) ? msg.playerCount : prev.playerCount;

                // 1. Normalize Server Data
                let formattedPlayers = serverPlayers.map(p => {
                    const rawName = (typeof p === 'string') ? p : p.name;
                    return { name: rawName, ...((typeof p === 'object') ? p : {}) };
                });

                // 2. REBUILD/OVERRIDE LOGIC
                // The server often sends ["Player 1", "Player 2"]. 
                // We use our local 'knownNames' cache to restore the real names.

                // If server sends nothing but count > 0, rebuild entirely from cache
                if (formattedPlayers.length === 0 && serverCount > 0) {
                    formattedPlayers = [];
                    for (let i = 0; i < serverCount; i++) {
                        const name = knownNames.current[i] || `Player ${i + 1}`;
                        formattedPlayers.push({ name, role: null });
                    }
                }
                // If server sends Generic Names (e.g. "Player 1"), try to match with Cached Real Name
                else {
                    formattedPlayers = formattedPlayers.map((p, index) => {
                        // Logic: If we have a cached name at this index, USE IT.
                        // This assumes the server maintains order (FIFO).
                        // If the server shuffled, this might mis-attribute names, but for Lobby it's usually fine.
                        if (knownNames.current[index]) {
                            // Only override if the server name looks generic
                            if (p.name.match(/^Player \d+$/)) {
                                return { ...p, name: knownNames.current[index] };
                            }
                            // Actually, let's aggressively prefer local name if available 
                            // because our server seems to ignore custom names completely.
                            return { ...p, name: knownNames.current[index] };
                        }
                        return p;
                    });
                }

                return {
                    ...prev,
                    phase: msg.phase || prev.phase,
                    roles: msg.roles || prev.roles,
                    playerCount: serverCount,
                    players: formattedPlayers.length > 0 ? formattedPlayers : prev.players
                };
            });
        });

        // JOIN SUCCESS (For Player)
        socket.on('JOIN_SUCCESS', (data) => {
            console.log('✅ Join Success:', data);
            setGameState(prev => ({
                ...prev,
                isJoined: true,
                sessionCode: data.sessionCode || data.code || prev.sessionCode,
            }));
        });

        // ERROR HANDLING
        socket.on('ERROR', (data) => {
            console.error('❌ Game Error:', data);
            setGameState(prev => ({
                ...prev,
                joinError: data.message || "Unknown Error"
            }));
        });

        return () => {
            socket.off('GAME_MESSAGE'); // <--- FIX DUPLICATE MESSAGES
            socket.off('JOIN_REQUEST');
            socket.off('STATE_UPDATE');
            socket.off('JOIN_SUCCESS');
            socket.off('ERROR');
        };
    }, [role]);

    // NEW: Join Function for Players
    // NEW: Join Function for Players
    const joinSession = (code, name) => {
        const socket = socketService.connect();
        setGameState(prev => ({ ...prev, joinError: null }));
        socket.emit('JOIN_REQUEST', { code, name });
        // SIDE CHANNEL Broadcast
        socket.emit('GAME_MESSAGE', { type: 'NAME_ANNOUNCE', name, code });
        setGameState(prev => ({ ...prev, sessionCode: code, myName: name }));
        localStorage.setItem('player_name', name);
    };

    // NEW: Start Game (Host)
    const startGame = () => {
        const socket = socketService.connect();
        socket.emit('START_GAME', { code: gameState.sessionCode });
    };

    // NEW: Generic Emit (Wrapper)
    const emit = (type, payload) => {
        // Auto-Generate ID for Chat Messages if missing
        if (type === 'GAME_MESSAGE' && payload.type === 'CHAT_MESSAGE' && !payload.id) {
            payload.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        socketService.send(type, payload);

        // Optimistic Update for Chat
        if (type === 'GAME_MESSAGE' && payload.type === 'CHAT_MESSAGE') {
            setGameState(prev => ({
                ...prev,
                messages: [...(prev.messages || []), payload]
            }));
        }
    };

    return {
        gameState,
        // localKnownPlayers, // Deprecated API
        joinSession,
        startGame,
        emit // <--- CRITICAL FIX
    };
}
