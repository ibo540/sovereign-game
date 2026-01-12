/**
 * HETAIROI - Game Engine
 * Handles Session State, Phase Transitions, and Staged Reveals.
 */

// Note: DualChannel is now in websocket-channel.js
// This file will use it if available, otherwise fall back to inline definition

class GameSession {
    constructor() {
        this.state = 'LOBBY';
        this.players = [];
        this.sessionCode = this.generateSessionCode();
        this.roles = {
            leader: null,
            elites: [],
            citizens: []
        };

        // Game Loop State
        this.phase = 'ALLOCATION';
        this.timer = 0;
        this.timerInterval = null;
        this.roundNumber = 0;

        // Mechanic State
        this.votes = [];
        this.lastAllocation = { military: 0, intelligence: 0, interior: 0, economy: 0, media: 0 };
        this.protestLevel = 0; // 0-100%

        // Initialize Communication
        // Use WebSocket channel if available, otherwise fall back to local
        if (typeof DualChannel !== 'undefined') {
            this.channel = new DualChannel('dark_alchemy_session', (data) => this.handleMessage(data));

            // CRITICAL FIX: Register session on server IMMEDIATELY so players can join
            if (this.channel.createSession) {
                console.log('Creating session on server:', this.sessionCode);
                this.channel.createSession(this.sessionCode);
            }
        } else {
            // Fallback: inline DualChannel (for backward compatibility)
            this.channel = this.createLocalChannel('dark_alchemy_session', (data) => this.handleMessage(data));
        }

        // Start Lobby UI
        this.updateUI();
    }

    createLocalChannel(channelName, onMessage) {
        // Fallback local channel implementation
        const channel = {
            name: channelName,
            onMessage: onMessage,
            bc: null,
            key: `DA_MSG_${channelName}`
        };

        if (window.BroadcastChannel) {
            channel.bc = new BroadcastChannel(channelName);
            channel.bc.onmessage = (ev) => channel.input(ev.data);
        }

        window.addEventListener('storage', (ev) => {
            if (ev.key === channel.key && ev.newValue) {
                try {
                    const data = JSON.parse(ev.newValue);
                    channel.input(data);
                } catch (e) { console.error("Comms Parse Error", e); }
            }
        });

        channel.send = function (data) {
            if (this.bc) this.bc.postMessage(data);
            const payload = JSON.stringify(data);
            localStorage.setItem(this.key, payload);
        };

        channel.input = function (data) {
            if (this.onMessage) this.onMessage(data);
        };

        return channel;
    }

    generateSessionCode() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    // --- Communication Handling ---
    handleMessage(msg) {
        if (!msg || !msg.type) return;

        if (msg.type === 'JOIN_REQUEST') {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:87',message:'Game engine received JOIN_REQUEST',data:{msgCode:msg.code,msgName:msg.name,engineSessionCode:this.sessionCode,engineState:this.state,currentPlayersCount:this.players.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            if (this.state === 'LOBBY' && msg.code === this.sessionCode) {
                // Prevent duplicate joins
                if (this.players.some(p => p.name === msg.name)) return;

                // Accept Player
                this.players.push({ name: msg.name, role: null });
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:95',message:'Game engine added player',data:{playerName:msg.name,newPlayersCount:this.players.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion

                // Confirm Join to Player
                this.channel.send({ type: 'JOIN_SUCCESS', name: msg.name });

                // Update All UIs (Lobby Count)
                this.broadcastState();
            }
        } else if (msg.type === 'ALLOCATION_SUBMIT') {
            if (this.phase === 'ALLOCATION') {
                console.log("Allocation Received:", msg.data);
                this.lastAllocation = msg.data;
                this.nextPhase();
            }
        } else if (msg.type === 'VOTE_SUBMIT') {
            if (this.phase === 'VOTING') {
                // Ensure unique vote per player (replace if exists)
                const existingIdx = this.votes.findIndex(v => v.voter === msg.name);
                if (existingIdx >= 0) {
                    this.votes[existingIdx] = { voter: msg.name, vote: msg.vote, coupType: msg.coupType, candidate: msg.candidate };
                } else {
                    this.votes.push({ voter: msg.name, vote: msg.vote, coupType: msg.coupType, candidate: msg.candidate });
                }

                // Broadcase Vote Count (Anonymous) to update UI if needed (Not implemented yet)

                // Check if all elites voted (5 Elites)
                // In production, should check this.roles.elites.length
                if (this.votes.length >= this.roles.elites.length) {
                    this.nextPhase();
                }
            }
        } else if (msg.type === 'PROTEST') {
            // Increase protest level (Decay is handled in timer)
            this.protestLevel = Math.min(100, this.protestLevel + 5);
            // Broadcast immediate update for responsiveness
            this.channel.send({ type: 'PROTEST_LEVEL', level: this.protestLevel });
        } else if (msg.type === 'STATE_UPDATE') {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:143',message:'Game engine received STATE_UPDATE from server',data:{msgPlayerCount:msg.playerCount,msgPlayers:msg.players,msgSessionCode:msg.sessionCode,engineSessionCode:this.sessionCode,enginePlayersLength:this.players.length,shouldUpdate:msg.sessionCode===this.sessionCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
            // #endregion
            // Update player list from server if session codes match
            if (msg.sessionCode === this.sessionCode && msg.playerCount !== undefined) {
                // Sync actual player names from server
                if (msg.players && Array.isArray(msg.players)) {
                    // Server sent actual player names - use them
                    this.players = msg.players.map(name => ({ name: name, role: null }));
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:150',message:'Game engine synced player names from server',data:{playerNames:msg.players,playerCount:this.players.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                    // #endregion
                } else {
                    // Fallback: only player count available, sync count only
                    const serverPlayerCount = msg.playerCount;
                    while (this.players.length < serverPlayerCount) {
                        this.players.push({ name: `Player ${this.players.length + 1}`, role: null });
                    }
                    while (this.players.length > serverPlayerCount) {
                        this.players.pop();
                    }
                }
                this.updateUI();
                
                // CRITICAL: Also trigger UI update in session_control.html if handleUiUpdate exists
                // This ensures the pie chart is rendered when server sends STATE_UPDATE
                if (typeof window !== 'undefined' && typeof window.handleUiUpdate === 'function') {
                    // Forward the STATE_UPDATE to the UI handler with updated player data
                    window.handleUiUpdate({
                        ...msg,
                        players: this.players.map(p => p.name) // Ensure players array is included
                    });
                }
            }
        }
    }

    // --- State Broadcasting ---
    broadcastState() {
        const stateMsg = {
            type: 'STATE_UPDATE',
            sessionCode: this.sessionCode,
            phase: this.phase,
            timeRemaining: this.timeRemaining,
            playerCount: this.players.length,
            round: this.roundNumber,
            allocation: this.lastAllocation,
            roles: this.roles // Send role specific data if needed, or filter
        };
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:182',message:'broadcastState sending STATE_UPDATE',data:{phase:stateMsg.phase,hasRoles:!!stateMsg.roles,leader:stateMsg.roles?.leader?.name,eliteCount:stateMsg.roles?.elites?.length,citizenCount:stateMsg.roles?.citizens?.length,channelConnected:this.channel?.connected},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        this.channel.send(stateMsg);
        this.updateUI();
    }

    // --- Core Game Loop ---
    beginSimulation() {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:198',message:'beginSimulation called',data:{playerCount:this.players.length,currentState:this.state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        if (this.players.length < 3) {
            // alert("Need at least 3 players to start!");
            // For testing, allowing 1 player override
        }

        this.state = 'ACTIVE';
        this.roundNumber = 1;
        this.assignRoles();
        this.startPhase('ALLOCATION');
    }

    assignRoles() {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:210',message:'assignRoles called',data:{playerCount:this.players.length,playerNames:this.players.map(p=>p.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        // Shuffle players
        const shuffled = [...this.players].sort(() => 0.5 - Math.random());

        // 1. Leader
        this.roles.leader = shuffled[0];
        this.roles.leader.role = 'Leader';

        // 2. Elites (5 Fixed)
        const eliteTypes = [
            { id: 'General', name: 'Military', weight: 3 },
            { id: 'SpyChief', name: 'Intelligence', weight: 2 },
            { id: 'PoliceChief', name: 'Interior', weight: 2 },
            { id: 'Oligarch', name: 'Economy', weight: 1 },
            { id: 'Propagandist', name: 'Media', weight: 1 }
        ];

        this.roles.elites = [];
        let pIndex = 1;

        // Assign Real Players to Elites first
        for (let i = 0; i < eliteTypes.length; i++) {
            if (pIndex < shuffled.length) {
                const p = shuffled[pIndex++];
                p.role = eliteTypes[i].name; // Just string name
                this.roles.elites.push({
                    name: p.name,
                    role: eliteTypes[i].name,
                    weight: eliteTypes[i].weight,
                    type: eliteTypes[i].id
                });
            } else {
                // Fill with Bots if not enough players? 
                // For Minimum Viable, we assume players fill or we handle empty
            }
        }

        // 3. Citizens (Rest)
        this.roles.citizens = [];
        while (pIndex < shuffled.length) {
            const p = shuffled[pIndex++];
            p.role = 'Citizen';
            // Assign random class
            const classes = ['Upper Class', 'Middle Class', 'Lower Class'];
            p.class = classes[Math.floor(Math.random() * classes.length)];
            this.roles.citizens.push(p);
        }

        // Notify Players of Roles
        this.players.forEach(p => {
            // Find detailed role info
            let roleData = { role: p.role };
            if (p.role === 'Citizen') {
                const c = this.roles.citizens.find(c => c.name === p.name);
                if (c) roleData.className = c.class;
            }
            if (this.roles.elites.find(e => e.name === p.name)) {
                const e = this.roles.elites.find(e => e.name === p.name);
                roleData.weight = e.weight;
            }

            const roleMsg = {
                type: 'ROLE_ASSIGNMENT',
                target: p.name,
                role: p.role,
                details: roleData
            };
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:271',message:'Sending ROLE_ASSIGNMENT',data:{target:roleMsg.target,role:roleMsg.role,channelConnected:this.channel?.connected,channelHasSocket:!!this.channel?.socket},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
            this.channel.send(roleMsg);
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:278',message:'assignRoles completed',data:{leader:this.roles.leader?.name,eliteCount:this.roles.elites.length,citizenCount:this.roles.citizens.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
    }

    startPhase(phase) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:296',message:'startPhase called',data:{newPhase:phase,oldPhase:this.phase,state:this.state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        clearInterval(this.timerInterval);

        // Resolution Logic Check
        if (phase === 'RESOLUTION' && this.phase === 'VOTING') {
            this.resolveRound();
        }

        this.phase = phase;
        let duration = 0;

        switch (phase) {
            case 'ALLOCATION':
                duration = 90;
                this.votes = [];
                this.protestLevel = 0;
                break;
            case 'VOTING':
                duration = 60;
                break;
            case 'RESOLUTION':
                duration = 20;
                break;
            default:
                duration = 10;
        }

        this.timeRemaining = duration;
        this.updateTimerUI(duration);
        this.broadcastState();
        this.startTimer();
    }

    resolveRound() {
        let outcomeMessage = `Round ${this.roundNumber} Result: `;

        // Calculate Coup Power
        let betrayWeight = 0;
        let loyalWeight = 0;
        let candidate = null;

        // Sum Votes
        this.votes.forEach(v => {
            const elite = this.roles.elites.find(e => e.name === v.voter);
            let weight = elite ? elite.weight : 0;

            // External Offer Bonus
            if (v.coupType === 'EXTERNAL') {
                weight += 1.5; // Massive Bonus for Foreign Intervention
            }

            if (v.vote === 'BETRAY') {
                betrayWeight += weight;
                if (v.candidate) candidate = v.candidate;
            } else {
                loyalWeight += weight;
            }
        });

        // Determine Outcome
        // If External involved, threshold is lower? Or just weight added.
        const totalWeight = betrayWeight + loyalWeight;
        const rebelPercent = totalWeight > 0 ? Math.round((betrayWeight / totalWeight) * 100) : 0;
        const loyalPercent = 100 - rebelPercent;

        const coupSuccess = betrayWeight > loyalWeight;

        let purgedList = [];
        let pardonedList = [];

        if (coupSuccess) {
            outcomeMessage += "COUP SUCCEEDED! The Leader has been overthrown.";
            // Determine New Leader
            let newLeaderName = candidate;

            // If no candidate specified, highest weight betrayer
            if (!newLeaderName) {
                const betrayers = this.votes.filter(v => v.vote === 'BETRAY');
                if (betrayers.length > 0) {
                    // Find biggest traitor
                    betrayers.sort((a, b) => {
                        // Priority to Initiators? 
                        return 0; // random for now
                    });
                    newLeaderName = betrayers[0].voter;
                } else {
                    newLeaderName = "The Military"; // Fallback
                }
            }
            outcomeMessage += ` All hail the new Leader: ${newLeaderName}!`;

        } else {
            outcomeMessage += "The Leader survives. Order is restored.";

            // Repression Logic
            const betrayers = this.votes.filter(v => v.vote === 'BETRAY');

            // Automatic Purge of Top 2 Traitors (by Weight)
            // Sort by weight descending
            betrayers.sort((a, b) => {
                const dA = this.roles.elites.find(e => e.name === a.voter);
                const dB = this.roles.elites.find(e => e.name === b.voter);
                return (dB ? dB.weight : 0) - (dA ? dA.weight : 0);
            });

            // Purge top 2
            let purgedCount = 0;
            betrayers.forEach(b => {
                if (purgedCount < 2) {
                    this.roles.elites = this.roles.elites.filter(e => e.name !== b.voter);
                    purgedList.push(b.voter);
                    purgedCount++;
                } else {
                    pardonedList.push(b.voter); // Failed rebels who survived
                }
            });
            if (purgedCount > 0) outcomeMessage += ` ${purgedCount} Traitors Purged.`;

            // Demote Citizens (Mock logic)
            outcomeMessage += " Dissidents repressed.";
        }

        // Broadcast Result
        this.channel.send({
            type: 'ROUND_RESULT',
            message: outcomeMessage,
            success: !coupSuccess, // msg.success means "Regime Won"
            stats: {
                loyal: loyalPercent,
                betray: rebelPercent
            },
            purged: purgedList,
            pardoned: pardonedList
        });

        this.roundNumber++;
    }

    // --- UI Updates ---

    updateUI() {
        const screens = {
            setup: document.getElementById('screen-setup'),
            lobby: document.getElementById('screen-lobby'),
            game: document.getElementById('screen-game')
        };

        // Hide all first
        Object.values(screens).forEach(el => {
            if (el) el.classList.add('hidden');
        });

        // Show current
        if (this.state === 'SETUP') {
            if (screens.setup) screens.setup.classList.remove('hidden');
        } else if (this.state === 'LOBBY') {
            if (screens.lobby) screens.lobby.classList.remove('hidden');
            document.getElementById('display-code').innerText = this.sessionCode;
            document.getElementById('player-count').innerText = this.players.length;
        } else if (this.state === 'ACTIVE') {
            if (screens.game) screens.game.classList.remove('hidden');
            // Show Header Indicators
            document.querySelector('.session-header').classList.remove('hidden'); // Ensure header is visible
            document.getElementById('display-round').innerText = this.roundNumber;
            document.getElementById('display-phase').innerText = this.phase;
        }
    }

    startLobby() {
        this.state = 'LOBBY';
        
        // Create session on server if using WebSocket
        if (this.channel && typeof this.channel.createSession === 'function') {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/337209b4-c064-4f4f-9d1d-83736bceeff3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game_engine.js:407',message:'Host creating session on server',data:{sessionCode:this.sessionCode,channelConnected:this.channel.connected,hasCreateSession:typeof this.channel.createSession==='function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
            // #endregion
            this.channel.createSession(this.sessionCode);
        }
        
        this.updateUI();
    }

    startGame() {
        this.beginSimulation();
    }

    updatePlayerCountUI(count, newPlayerName) {
        const el = document.getElementById('player-count');
        if (el) el.innerText = count;

        // Add to list
        const list = document.getElementById('player-list');
        if (list && newPlayerName) {
            const li = document.createElement('li');
            li.innerText = `${newPlayerName} connected...`;
            li.className = 'player-item-joined';
            list.appendChild(li);
        }
    }
}

// Global Instance
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new GameSession();

    // Bind Buttons
    const btnCreate = document.getElementById('btn-create-session');
    if (btnCreate) btnCreate.onclick = () => game.startLobby();

    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) btnStart.onclick = () => game.startGame();
});
