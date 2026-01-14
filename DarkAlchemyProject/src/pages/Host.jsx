import React, { useEffect, useRef, useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { QRCodeSVG } from 'qrcode.react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import Dashboard from './Dashboard';

// --- LOGO / BUTTON COMPONENT ---
// --- LOGO / BUTTON COMPONENT ---
const StartSelectionPlate = ({ onClick, animate, textOverride }) => {
    return (
        <motion.div
            onClick={onClick}
            animate={animate}
            style={{
                position: 'relative',
                width: '300px',
                height: '80px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '2px solid #aaa',
                clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
                marginTop: '40px',
                zIndex: 200
            }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(40,40,40,0.8)', borderColor: '#fff' }}
            whileTap={{ scale: 0.95 }}
            className="start-selection-plate"
        >
            {/* Inner Border Effect */}
            <div style={{
                position: 'absolute', top: '4px', left: '4px', right: '4px', bottom: '4px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
                pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <span style={{ fontFamily: 'Cinzel', fontSize: '1.2rem', color: '#fff', letterSpacing: '2px', lineHeight: 1 }}>START</span>
                <div style={{ width: '80%', height: '1px', background: 'linear-gradient(90deg, transparent, #aaa, transparent)', margin: '2px 0' }} />
                <span style={{ fontFamily: 'Cinzel', fontSize: '1.4rem', color: '#fff', letterSpacing: '1px', lineHeight: 1 }}>
                    {textOverride || "SELECTION"}
                </span>
            </div>

            {/* Screws */}
            {[
                { top: '12%', left: '12%' }, { top: '12%', right: '12%' },
                { bottom: '12%', left: '12%' }, { bottom: '12%', right: '12%' }
            ].map((pos, i) => (
                <div key={i} style={{
                    position: 'absolute', ...pos, width: '4px', height: '4px',
                    background: '#fff', borderRadius: '50%', boxShadow: '0 0 2px #000', zIndex: 3
                }} />
            ))}
        </motion.div>
    );
};

// --- SIDEBAR LIST COMPONENT (Color Polish) ---
const SidebarList = ({ leader, elites, revealedCount, getEliteInfo, roles }) => {
    return (
        <div style={{
            position: 'absolute', top: '25vh', left: '5vw',
            display: 'flex', flexDirection: 'column', gap: '1.5vh',
            zIndex: 100
        }}>
            <AnimatePresence>
                {/* LEADER SLOT */}
                {leader && (
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2), transparent)',
                            padding: '10px', borderLeft: '4px solid #ffd700',
                            width: '250px'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem', color: '#ffd700', fontFamily: 'Cinzel Decorative' }}>
                            {leader.name.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#aaa', fontFamily: 'Roboto Mono', marginLeft: 'auto' }}>LEADER</span>
                    </motion.div>
                )}

                {/* ELITE SLOTS - SEQUENTIAL REVEAL */}
                {elites.map((elite, index) => {
                    if (index >= revealedCount) return null; // Wait for reveal
                    const info = getEliteInfo(roles[elite.name]);
                    return (
                        <motion.div
                            key={elite.name || index}
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: `linear-gradient(90deg, ${info.color}33, transparent)`, // 33 = 20% opacity
                                padding: '10px', borderLeft: `4px solid ${info.color}`,
                                width: '250px'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', color: info.color, fontFamily: 'Cinzel' }}>
                                {elite.name.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#aaa', fontFamily: 'Roboto Mono', marginLeft: 'auto' }}>
                                {info.label}
                            </span>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

// --- REVEAL BOX COMPONENT ---
const RevealBox = ({ focusedPlayer }) => {
    if (!focusedPlayer) return null;

    const isLeader = focusedPlayer.role === 'LEADER';
    const color = focusedPlayer.color || (isLeader ? '#ffd700' : '#ff4444');

    return (
        <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            style={{
                position: 'absolute', bottom: '5vh',
                // Dynamic gradient based on color
                background: `linear-gradient(45deg, ${color}, #000)`,
                padding: '2px',
                borderRadius: '10px',
                boxShadow: `0 0 50px ${color}80`, // 50% opacity hex
                zIndex: 300
            }}
        >
            <div style={{
                background: '#000', padding: '20px 60px', borderRadius: '8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minWidth: '300px'
            }}>
                <span style={{ color: '#fff', fontSize: '1.2rem', fontFamily: 'Cinzel', letterSpacing: '2px', opacity: 0.8 }}>
                    {isLeader ? "THE LEADER IS" : (focusedPlayer.eliteLabel ? `${focusedPlayer.eliteLabel} SECTOR` : "ELITE AWAKENED")}
                </span>
                <span style={{
                    color: color,
                    fontSize: '3rem', fontFamily: 'Cinzel Decorative', fontWeight: 'bold', margin: '10px 0',
                    textShadow: `0 0 20px ${color}`,
                    textAlign: 'center'
                }}>
                    {focusedPlayer.name.toUpperCase()}
                </span>
            </div>
        </motion.div>
    );

};

// --- GAME SUMMARY COMPONENT ---
const GameSummary = ({ result, rounds, survivors, leaderName }) => {
    const isLeaderWin = result?.winner === 'LEADER';

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: '#000', zIndex: 2000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#fff'
            }}
        >
            <h1 style={{
                fontSize: '5rem', fontFamily: 'Cinzel Decorative', color: isLeaderWin ? '#ffd700' : '#ff4444',
                textShadow: isLeaderWin ? '0 0 50px #ffd700' : '0 0 50px #ff0000',
                marginBottom: '20px', textAlign: 'center'
            }}>
                {isLeaderWin ? "THE REGIME ENDURES" : "THE REGIME HAS FALLEN"}
            </h1>

            <div style={{ display: 'flex', gap: '50px', marginTop: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#aaa', fontFamily: 'Cinzel', fontSize: '1.2rem' }}>LEADER STATUS</h3>
                    <p style={{ fontSize: '2rem', color: isLeaderWin ? '#ffd700' : '#444', textDecoration: isLeaderWin ? 'none' : 'line-through' }}>
                        {leaderName}
                    </p>
                    <p style={{ color: isLeaderWin ? '#ffd700' : '#ff4444', fontSize: '1rem', marginTop: '5px' }}>
                        {isLeaderWin ? "SURVIVED" : "DEPOSED"}
                    </p>
                </div>

                <div style={{ width: '2px', background: '#333' }} />

                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#aaa', fontFamily: 'Cinzel', fontSize: '1.2rem' }}>ROUNDS SURVIVED</h3>
                    <p style={{ fontSize: '3rem', color: '#fff' }}>{rounds}</p>
                </div>

                <div style={{ width: '2px', background: '#333' }} />

                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#aaa', fontFamily: 'Cinzel', fontSize: '1.2rem' }}>SURVIVORS</h3>
                    <p style={{ fontSize: '3rem', color: '#fff' }}>{survivors}</p>
                </div>
            </div>

            <p style={{ marginTop: '80px', color: '#444', fontFamily: 'Roboto Mono' }}>
                SESSION TERMINATED
            </p>
        </motion.div>
    );
};

// --- MAIN HOST COMPONENT ---
const Host = () => {
    const { gameState, startGame } = useGameEngine('host');
    const { sessionCode, players, playerCount } = gameState;

    // LOCAL STATE FOR MOCKING
    const [mockRoles, setMockRoles] = useState(null);
    const [mockPlayers, setMockPlayers] = useState([]);

    // EFFECTIVE ROLES & PLAYERS (Merge Server + Mock)
    const roles = mockRoles || gameState.roles;
    // Memoize to prevent effect loops
    const effectivePlayers = React.useMemo(() => [...(players || []), ...mockPlayers], [players, mockPlayers]);
    const effectivePlayerCount = effectivePlayers.length;

    const controls = useAnimation();
    const wheelControls = useAnimation();
    const [errorMsg, setErrorMsg] = useState('');

    // 'IDLE', 'SPINNING', 'DECELERATING', 'REVEAL_LEADER', 'REVEAL_ELITES', 'COMPLETE'
    const [spinStatus, setSpinStatus] = useState('IDLE');
    const [showDashboard, setShowDashboard] = useState(false);
    const [votesRevealed, setVotesRevealed] = useState(false); // New state to track vote reveal status

    // NEW: Track sequential reveal
    const [revealedEliteCount, setRevealedEliteCount] = useState(0);

    // Focused Player for Reveal Box
    const [focusedPlayer, setFocusedPlayer] = useState(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
    const [gameOver, setGameOver] = useState(false);

    const handleNextRound = () => {
        // --- GAME END CHECK ---
        // Effective (Total) - Eliminated <= 6?
        const activeCount = effectivePlayers.length - (gameState.eliminatedPlayers?.length || 0);

        if (activeCount <= 6) {
            console.log("🏁 GAME OVER CONDITION MET: Players <= 6");
            setGameOver(true);

            // Emit Game Over
            import('../services/socket').then(({ socketService }) => {
                socketService.socket.emit('GAME_MESSAGE', {
                    type: 'GAME_OVER',
                    winner: gameState.result?.winner || 'UNKNOWN',
                    round: currentRound
                });
            });
            return;
        }

        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        setVotesRevealed(false);

        // --- COUNCIL REPLACEMENT LOGIC ---
        // 1. Identify Dead Elites
        const currentDead = gameState.eliminatedPlayers || [];
        const deadElites = elites.filter(e => currentDead.includes(e.name));

        let newRoles = { ...roles };
        let rolesChanged = false;

        if (deadElites.length > 0) {
            console.log("💀 DEAD ELITES FOUND:", deadElites.map(e => e.name));
            console.log("💀 CURRENT DEAD LIST:", currentDead);
            console.log("💀 ELITE POOL:", elites.map(e => e.name));

            // 2. Find Candidates (Citizens/Plebs who are ALIVE)
            const candidates = effectivePlayers.filter(p => {
                const r = roles[p.name];
                const isElite = r && r.startsWith('ELITE');
                const isLeader = r === 'LEADER';
                const isDead = currentDead.includes(p.name);
                return !isElite && !isLeader && !isDead;
            });

            // 3. Shuffle Candidates
            const shuffled = [...candidates].sort(() => 0.5 - Math.random());

            // 4. Assign
            deadElites.forEach((deadElite, i) => {
                if (shuffled[i]) {
                    const deadRole = roles[deadElite.name];
                    const replacement = shuffled[i];
                    console.log(`⚔️ PROMOTING ${replacement.name} to ${deadRole}`);

                    // Update Roles
                    newRoles[replacement.name] = deadRole;

                    // CRITICAL: Strip the role from the dead player so they don't appear in the list anymore
                    newRoles[deadElite.name] = 'SPECTATOR';

                    rolesChanged = true;
                }
            });
        }

        // --- 1. HANDLE REGIME CHANGE (Leader Failed) ---
        if (gameState.result?.winner === 'REBELLION') {
            console.log("🔥 REGIME HAS FALLEN. SELECTING NEW LEADER.");

            // CHECK FOR EXTERNAL COUP (Specific Elite)
            // Need to look at betrayalList from broadcastResult which has {name, meta}
            // BUT that list is local to broadcastResult. We need to re-scan votes here or store betrayers in state.
            // Actually, gameState.votes is available.

            let externallyBackedEliteName = null;
            Object.entries(gameState.votes || {}).forEach(([name, voteData]) => {
                const voteVal = (typeof voteData === 'object' && voteData.val) ? voteData.val : voteData;
                const meta = (typeof voteData === 'object' && voteData.meta) ? voteData.meta : {};
                if (voteVal === 'BETRAY' && meta.reason === 'EXTERNAL_OFFER') {
                    externallyBackedEliteName = name;
                }
            });

            // Find Old Leader
            const oldLeader = effectivePlayers.find(p => roles[p.name] === 'LEADER');
            if (oldLeader) {
                // Depose
                newRoles[oldLeader.name] = 'SPECTATOR';
            }

            // Determine New Leader
            let newLeader = null;
            let regimeChangeMsg = "";

            if (externallyBackedEliteName) {
                // PRIORITY: The traitor who took the deal
                console.log("🕵️ EXTERNAL AGENT DETECTED:", externallyBackedEliteName);
                const candidate = effectivePlayers.find(p => p.name === externallyBackedEliteName);
                if (candidate) {
                    newLeader = candidate;
                    regimeChangeMsg = `EXTERNAL INTERVENTION. ${newLeader.name} INSTALLED AS LEADER. +50 RESOURCES ADDED.`;
                }
            }

            // Fallback: Random Survivor if no external deal
            if (!newLeader) {
                const candidates = effectivePlayers.filter(p => {
                    const r = newRoles[p.name];
                    const isDead = (gameState.eliminatedPlayers || []).includes(p.name);
                    return r !== 'SPECTATOR' && r !== 'DEAD' && !isDead;
                });
                if (candidates.length > 0) {
                    newLeader = candidates[Math.floor(Math.random() * candidates.length)];
                    regimeChangeMsg = `LEADER DEPOSED. ${newLeader.name} IS THE NEW LEADER.`;
                }
            }

            if (newLeader) {
                console.log(`👑 NEW LEADER APPOINTED: ${newLeader.name}`);
                newRoles[newLeader.name] = 'LEADER';
                rolesChanged = true;
            }

            // Show Notification
            if (regimeChangeMsg) {
                setErrorMsg(regimeChangeMsg);
                setTimeout(() => setErrorMsg(''), 7000);
            }
        }

        // --- PASS 3: FILL VACANCIES (Due to Death or Promotion) ---
        // Just checking if any Elite roles are unassigned
        // ... (Existing vacancy logic or rely on random citizen shuffle if I merge it)
        // For now, let's just ensure if an ELITE was promoted, their old spot is filled.
        const ELITE_ROLES = ['ELITE_MILITARY', 'ELITE_INTELLIGENCE', 'ELITE_INTERIOR', 'ELITE_ECONOMY', 'ELITE_MEDIA'];
        const takenRoles = Object.values(newRoles);
        const vacantRoles = ELITE_ROLES.filter(r => !takenRoles.includes(r));

        if (vacantRoles.length > 0) {
            const eligibleCitizens = effectivePlayers.filter(p => {
                const r = newRoles[p.name];
                const isDead = (gameState.eliminatedPlayers || []).includes(p.name);
                const isTaken = ELITE_ROLES.includes(r) || r === 'LEADER' || r === 'SPECTATOR';
                return !isTaken && !isDead;
            });
            const shuffledCitizens = [...eligibleCitizens].sort(() => 0.5 - Math.random());

            vacantRoles.forEach((vacantRole, i) => {
                if (shuffledCitizens[i]) {
                    newRoles[shuffledCitizens[i].name] = vacantRole;
                    rolesChanged = true;
                }
            });
        }

        // Emitting START_ROUND clears state
        socketService.socket.emit('GAME_MESSAGE', {
            type: 'START_ROUND',
            round: nextRound,
            code: sessionCode,
            resourceBonus // Pass this new field
        });

        // If roles changed, Emit ROLES_ASSIGNED
        if (rolesChanged) {
            // UPDATE LOCAL MOCK ROLES so Host UI updates immediately (and overrides dirty state)
            setMockRoles(newRoles);

            setTimeout(() => {
                socketService.socket.emit('GAME_MESSAGE', {
                    type: 'ROLES_ASSIGNED',
                    roles: newRoles,
                    code: sessionCode,
                    phase: 'GAME_ACTIVE'
                });
            }, 500); // Small delay to ensure client handles round reset first
        }

    };

    const ELITE_COLORS = ['#ff4444', '#1e90ff', '#32cd32', '#9370db', '#ffa500']; // Red, Blue, Green, Purple, Orange

    // Derived Lists for Sidebar
    const leader = React.useMemo(() => effectivePlayers.find(p => roles && roles[p.name] === 'LEADER'), [effectivePlayers, roles]);
    // Ensure Elites are stable - sort by name or original index to prevent jumping
    // Ensure Elites are stable - sort by name or original index to prevent jumping
    const elites = React.useMemo(() => effectivePlayers.filter(p => roles && roles[p.name] && roles[p.name].startsWith('ELITE')), [effectivePlayers, roles]);

    // Filter Sidebar visibility logic moved inside SidebarList via 'revealedCount' prop

    // --- IDLE + COMPLETE SPIN LOGIC ---
    useEffect(() => {
        if (spinStatus === 'IDLE') {
            wheelControls.start({
                rotate: 360,
                transition: { repeat: Infinity, ease: "linear", duration: 60 } // Very slow idle spin
            });
        }
        if (spinStatus === 'COMPLETE') {
            wheelControls.start({
                rotate: 360,
                transition: { repeat: Infinity, ease: "linear", duration: 120 } // Super slow "Aftermath" drift
            });
        }
    }, [spinStatus, wheelControls]);

    // --- START LOGIC ---
    const handleStart = async () => {
        if (!effectivePlayers || effectivePlayers.length < 6) {
            await controls.start({ x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } });
            setErrorMsg("MANDATE REQUIRES 6 SUBJECTS");
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }

        console.log("🎲 STARTING MANDATE...");
        setSpinStatus('SPINNING');
        setRevealedEliteCount(0); // Reset count
        setMockRoles(null); // Clear previous mocks
        startGame();

        // FAST SPIN
        wheelControls.start({
            rotate: [0, 360],
            transition: { repeat: Infinity, ease: "linear", duration: 0.5 } // Fast!
        });

        // 🛡️ ROLE GENERATION FALLBACK (For Server that doesn't send roles)
        // If we have effective players but NO roles after a short delay, generate them locally.
        console.log("⚠️ Checking for Server Roles...");
        setTimeout(() => {
            const currentRoles = gameState.roles || {};
            if (Object.keys(currentRoles).length === 0) {
                console.warn("⚠️ No roles received from server. Generating LOCAL roles.");
                const shuffled = [...effectivePlayers].sort(() => 0.5 - Math.random());
                const newRoles = {};
                // Assign 1 Leader, 5 Elites, Rest Citizens
                if (shuffled[0]) newRoles[shuffled[0].name] = 'LEADER';

                // Advanced Sector Assignment
                const sectors = [
                    { id: 'ELITE_MILITARY', name: 'MILITARY', color: '#ff4444' }, // Red
                    { id: 'ELITE_INTELLIGENCE', name: 'INTELLIGENCE', color: '#1e90ff' }, // Blue
                    { id: 'ELITE_INTERIOR', name: 'INTERIOR', color: '#9370db' }, // Purple
                    { id: 'ELITE_ECONOMY', name: 'ECONOMY', color: '#32cd32' }, // Green
                    { id: 'ELITE_MEDIA', name: 'MEDIA', color: '#ffa500' } // Orange
                ];

                for (let i = 1; i < 6; i++) {
                    if (shuffled[i]) {
                        // Assign specific sector if available, otherwise generic
                        const sector = sectors[i - 1];
                        newRoles[shuffled[i].name] = sector ? sector.id : 'ELITE';
                    }
                }
                for (let i = 6; i < shuffled.length; i++) {
                    if (shuffled[i]) newRoles[shuffled[i].name] = 'CITIZEN';
                }
                setMockRoles(newRoles);

                setMockRoles(newRoles);

                // CRITICAL FIX: Broadcast roles AFTER the visual delay (15s) so players don't see roles while wheel is spinning.
                import('../services/socket').then(({ socketService }) => {
                    const socket = socketService.connect();
                    socket.emit('GAME_MESSAGE', {
                        type: 'ROLES_ASSIGNED',
                        roles: newRoles,
                        code: sessionCode,
                        phase: 'GAME_ACTIVE'
                    });
                });
            }
        }, 15000); // Wait 15s instead of 3s to match animation
    };

    // --- RESET LOGIC ---
    const handleReselect = () => {
        setSpinStatus('IDLE');
        setMockRoles(null);
        setRevealedEliteCount(0);
        setFocusedPlayer(null);
        wheelControls.stop(); // Stop the 'drift' before restarting idle
    };

    // --- STOP & REVEAL LOGIC ---
    // --- STOP & REVEAL LOGIC ---
    useEffect(() => {
        if (spinStatus === 'SPINNING' && roles && Object.keys(roles).length > 0) {
            console.log("🛑 ROLES RECEIVED:", roles);
            setSpinStatus('DECELERATING');

            // Find Leader
            const leaderIndex = effectivePlayers.findIndex(p => roles[p.name] === 'LEADER');
            const leaderName = effectivePlayers[leaderIndex]?.name;

            if (leaderIndex !== -1) {
                // Calculate Target Angle (Leader at Top)
                const anglePerPlayer = 360 / effectivePlayerCount;
                const playerAngle = anglePerPlayer * leaderIndex;
                let targetRotation = 270 - playerAngle; // 270 is Top (-90)
                const finalRotation = targetRotation + (360 * 5); // 5 extra spins

                wheelControls.stop();
                wheelControls.start({
                    rotate: finalRotation,
                    transition: { duration: 4, ease: "circOut" }
                }).then(() => {
                    setSpinStatus('REVEAL_LEADER');
                    // Pass Explicit Gold Color
                    setFocusedPlayer({ name: leaderName, role: 'LEADER', color: '#ffd700' });
                });
            } else {
                wheelControls.stop();
                setSpinStatus('IDLE');
            }
        }
    }, [spinStatus, roles, effectivePlayers, wheelControls, effectivePlayerCount]);

    // --- SEQUENTIAL REVEAL LOGIC ---
    useEffect(() => {
        if (spinStatus === 'REVEAL_LEADER') {
            const timer = setTimeout(() => {
                setSpinStatus('REVEAL_ELITES');
                setRevealedEliteCount(1);
            }, 4000);
            return () => clearTimeout(timer);
        }

        if (spinStatus === 'REVEAL_ELITES') {
            const totalElites = elites.length;

            if (revealedEliteCount <= totalElites) {
                const currentElite = elites[revealedEliteCount - 1];
                if (currentElite) {
                    // Calculate Color based on Index
                    const roleStr = roles[currentElite.name];
                    const info = getEliteInfo(roleStr);
                    setFocusedPlayer({ name: currentElite.name, role: roleStr, color: info.color, eliteLabel: info.label });
                }

                const delay = 2500;
                const timer = setTimeout(() => {
                    if (revealedEliteCount < totalElites) {
                        setRevealedEliteCount(prev => prev + 1);
                    } else {
                        setSpinStatus('COMPLETE');
                        setFocusedPlayer(null);
                    }
                }, delay);
                return () => clearTimeout(timer);
            }
        }
    }, [spinStatus, revealedEliteCount, elites]);


    const getRole = (name) => roles ? roles[name] : null;

    // Helper to get Elite Color/Name/Weight
    const getEliteInfo = (roleStr) => {
        if (!roleStr) return { color: '#ff4444', label: 'ELITE', weight: 1 };
        switch (roleStr) {
            case 'ELITE_MILITARY': return { color: '#ff4444', label: 'MILITARY', weight: 3 };
            case 'ELITE_INTELLIGENCE': return { color: '#1e90ff', label: 'INTELLIGENCE', weight: 2 };
            case 'ELITE_INTERIOR': return { color: '#9370db', label: 'INTERIOR', weight: 2 };
            case 'ELITE_ECONOMY': return { color: '#32cd32', label: 'ECONOMY', weight: 1 };
            case 'ELITE_MEDIA': return { color: '#ffa500', label: 'MEDIA', weight: 1 };
            default: return { color: '#ff4444', label: 'ELITE', weight: 1 };
        }
    };

    // Calculate and Broadcast Result
    const broadcastResult = () => {
        setVotesRevealed(true);

        // Caluclate Scores
        let loyalPower = 0; // Base Leader Power? Maybe 0 for now.
        let rebelPower = 0;
        const betrayalList = [];

        Object.entries(gameState.votes || {}).forEach(([name, voteData]) => {
            // Handle both legacy string votes and new object votes
            const voteVal = (typeof voteData === 'object' && voteData.val) ? voteData.val : voteData;
            const meta = (typeof voteData === 'object') ? voteData.meta : {};

            const roleStr = roles[name];
            const info = getEliteInfo(roleStr);

            if (voteVal === 'LOYAL') {
                loyalPower += info.weight;
            } else if (voteVal === 'BETRAY') {
                rebelPower += info.weight;
                // Store with meta for later analysis
                betrayalList.push({ name, meta });
            }
        });

        // Check UPRISING (All Citizens Protest + At least 1 Betrayer)
        const citizenNames = effectivePlayers.filter(p => roles[p.name] === 'CITIZEN').map(p => p.name);
        const protestCount = citizenNames.reduce((acc, name) => acc + (gameState.protests?.[name] ? 1 : 0), 0);
        const isUprising = citizenNames.length > 0 && protestCount === citizenNames.length && rebelPower > 0; // rebelPower > 0 means at least 1 traitor usually (if weights > 0)

        let winner = loyalPower >= rebelPower ? 'LEADER' : 'REBELLION';
        let winReason = 'VOTE';

        if (isUprising) {
            console.log("🔥 UPRISING TRIGGERED!");
            winner = 'REBELLION';
            winReason = 'UPRISING';
        }

        // Calculate percentages for display
        const totalPower = loyalPower + rebelPower;
        const loyalPercent = totalPower === 0 ? 0 : Math.round((loyalPower / totalPower) * 100);
        const rebelPercent = totalPower === 0 ? 0 : 100 - loyalPercent;

        // Identify Protesters
        const protesters = Object.keys(gameState.protests || {}).map(name => {
            // Deterministic Class Calculation (Must match CitizenView)
            const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const val = hash % 100;
            let cls = 'Lower Class';
            if (val < 20) cls = 'Upper Class';
            else if (val < 60) cls = 'Middle Class';

            return { name, role: cls };
        });

        // Emit Result
        import('../services/socket').then(({ socketService }) => {
            socketService.socket.emit('GAME_MESSAGE', {
                type: 'GAME_RESULT',
                winner,
                winReason, // Pass reason
                betrayers: betrayalList,
                protesters: protesters, // Send the list
                stats: {
                    loyal: loyalPercent,
                    rebel: rebelPercent
                }
            });
        });
    };

    return (
        <div className="session-content" style={{
            position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>

            {/* GAME SUMMARY OVERLAY */}
            {gameOver && (
                <GameSummary
                    result={gameState.result}
                    rounds={currentRound}
                    survivors={effectivePlayers.length - (gameState.eliminatedPlayers?.length || 0)}
                    leaderName={leader?.name || "UNKNOWN"}
                />
            )}

            {showDashboard ? (
                <Dashboard
                    gameState={{
                        players: effectivePlayers,
                        roles: roles || mockRoles,
                        allocation: {
                            personal: { val: gameState.allocation?.personal || 0, color: '#FFD700', label: 'TREASURY' },
                            military: { val: gameState.allocation?.military || 0, color: '#ff4444', label: 'MILITARY' },
                            intelligence: { val: gameState.allocation?.intelligence || 0, color: '#1e90ff', label: 'INTEL' },
                            interior: { val: gameState.allocation?.interior || 0, color: '#9370db', label: 'INTERIOR' },
                            economy: { val: gameState.allocation?.economy || 0, color: '#32cd32', label: 'ECONOMY' },
                            media: { val: gameState.allocation?.media || 0, color: '#ffa500', label: 'MEDIA' },
                            upper: { val: gameState.allocation?.upper || 0, color: '#00ced1', label: 'UPPER' },
                            middle: { val: gameState.allocation?.middle || 0, color: '#00bfff', label: 'MIDDLE' },
                            labor: { val: gameState.allocation?.labor || 0, color: '#4682b4', label: 'LABOR' },
                        },
                        protests: gameState.stats?.unrest || 0,
                        votes: gameState.votes || {},
                        protests: gameState.stats?.unrest || 0,
                        votes: gameState.votes || {},
                        result: gameState.result, // Pass result
                        currentRound: currentRound,
                        phase: gameState.phase
                    }}
                    onRevealVotes={broadcastResult}
                    votesRevealed={votesRevealed}
                    onNextRound={handleNextRound}
                    eliminatedPlayers={gameState.eliminatedPlayers}
                />
            ) : (
                <>

                    {/* ERROR TOAST */}
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translate(-50%, 0)', background: 'rgba(100, 0, 0, 0.9)', border: '1px solid #ff0000', color: '#fff', padding: '15px 30px', fontFamily: 'Cinzel', fontSize: '1.2rem', zIndex: 1000, boxShadow: '0 0 20px #800000', pointerEvents: 'none' }}>
                                ⚠️ {errorMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* HEADER */}
                    <div style={{ position: 'absolute', top: '5vh', textAlign: 'center', width: '100%', zIndex: 10 }}>
                        <motion.h1 style={{ fontSize: '3rem', color: '#fff', textShadow: '0 0 20px rgba(220, 20, 60, 0.8)', margin: 0, fontFamily: 'Cinzel Decorative' }}>
                            {spinStatus === 'IDLE' ? "HOST CONTROL" : (spinStatus === 'COMPLETE' ? "MANDATE COMPLETE" : "THE MANDATE")}
                        </motion.h1>
                    </div>

                    {/* QR CODE - Top Right (Moved to accommodate Left Sidebar) */}
                    <motion.div style={{ position: 'absolute', top: '40px', right: '40px', zIndex: 50 }}>
                        <div className="qr-box" style={{ width: '140px', height: '140px', border: '1px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}>
                            <QRCodeSVG value={`https://dark-alchemy-server.onrender.com/?code=${sessionCode}`} size={100} bgColor={"transparent"} fgColor={"#ffffff"} />
                            <div className="session-code-display" style={{ fontSize: '1rem', marginTop: '10px', color: '#fff', fontFamily: 'Roboto Mono' }}>{sessionCode}</div>
                        </div>
                    </motion.div>

                    {/* SIDEBAR LIST (LEADER & ELITES) */}
                    <SidebarList
                        leader={(spinStatus === 'REVEAL_LEADER' || spinStatus === 'REVEAL_ELITES' || spinStatus === 'COMPLETE') ? leader : null}
                        elites={(spinStatus === 'REVEAL_ELITES' || spinStatus === 'COMPLETE') ? elites : []}
                        revealedCount={spinStatus === 'COMPLETE' ? 5 : revealedEliteCount}
                        getEliteInfo={getEliteInfo}
                        roles={roles}
                    />

                    {/* --- WHEEL SECTION --- */}
                    <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '5vh', zIndex: 10 }}>

                        {/* WHEEL CONTAINER */}
                        <div style={{ position: 'relative', width: '65vh', height: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                            {/* BACKDROP CIRCLE (Behind Text) */}
                            <div style={{
                                position: 'absolute', width: '100%', height: '100%',
                                borderRadius: '50%',
                                background: 'rgba(0, 0, 0, 0.6)',
                                border: '2px solid rgba(255, 215, 0, 0.3)',
                                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                                zIndex: 0
                            }} />

                            {/* ROTATING CONTENT */}
                            <motion.div
                                className="circle-content"
                                animate={wheelControls}
                                style={{ width: '60vh', height: '60vh', position: 'relative', zIndex: 100 }}
                            >
                                {effectivePlayers.map((p, i) => {
                                    const angle = (360 / effectivePlayerCount) * i;
                                    const nameLen = p.name ? p.name.length : 6;

                                    // CONTAINMENT MATH
                                    // Use smaller font, more spacing, ensure strict containment
                                    const fontSizeVh = Math.min(2.0, 10 / nameLen);
                                    const spacingVh = nameLen > 8 ? 0.2 : 0.5;

                                    // Highlight Logic
                                    const role = getRole(p.name);
                                    const isLeader = (spinStatus === 'REVEAL_LEADER' || spinStatus === 'REVEAL_ELITES' || spinStatus === 'COMPLETE') && role === 'LEADER';

                                    // Check if this specific elite has been revealed yet?
                                    // Find index in elites array
                                    const eliteIndex = elites.findIndex(e => e.name === p.name);
                                    // Is Elite Role AND is revealed
                                    const isEliteRole = role && role.startsWith('ELITE');
                                    const isEliteRevealed = isEliteRole && eliteIndex !== -1 && (spinStatus === 'COMPLETE' || eliteIndex < revealedEliteCount);
                                    const isElite = (spinStatus === 'REVEAL_ELITES' || spinStatus === 'COMPLETE') && isEliteRevealed;

                                    // Determine Elite Color
                                    let eliteColor = '#ff4444'; // default
                                    if (isElite) {
                                        // Extract color from Role String directly now!
                                        eliteColor = getEliteInfo(role).color;
                                    }

                                    // Citizen Color
                                    const isCitizen = !isLeader && !isElite;
                                    const finalColor = isLeader ? '#ffd700' : (isElite ? eliteColor : '#00e5ff');

                                    const isHighlighted = isLeader || isElite;

                                    return (
                                        <motion.div key={i} style={{
                                            position: 'absolute', top: '50%', left: '50%',
                                            width: '6vh', height: '32vh', transformOrigin: 'top center',
                                            transform: `translate(-50%, 0%) rotate(${angle}deg)`,
                                            display: 'flex', justifyContent: 'flex-start', alignItems: 'center',
                                            paddingTop: '12vh', paddingBottom: '2vh', boxSizing: 'border-box', pointerEvents: 'none'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <span style={{
                                                    writingMode: 'vertical-rl', textOrientation: 'upright',
                                                    color: finalColor,
                                                    fontFamily: 'Cinzel Decorative', fontWeight: 'bold',
                                                    fontSize: `${fontSizeVh}vh`, letterSpacing: `${spacingVh}vh`,
                                                    textShadow: isHighlighted ? `0 0 2vh ${finalColor}` : `0 0 10px ${finalColor}`,
                                                    display: 'block',
                                                    whiteSpace: 'nowrap',
                                                    opacity: 1, // Full visibility
                                                    transition: 'color 0.5s, text-shadow 0.5s'
                                                }}>
                                                    {p.name ? p.name.toUpperCase() : "PLAYER"}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            {/* CENTER STATUS BUBBLE */}
                            <div className="center-status" style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '22vh', height: '22vh',
                                background: '#000', borderRadius: '50%', border: '4px solid #333',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                zIndex: 200, boxShadow: '0 0 30px #000'
                            }}>
                                <span style={{ fontSize: '5rem', color: '#fff', fontFamily: 'Cinzel' }}>
                                    {spinStatus === 'IDLE' ? effectivePlayerCount : ""}
                                    {spinStatus === 'SPINNING' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '4px solid #fff', borderTop: '4px solid transparent', borderRadius: '50%' }} />}
                                    {spinStatus === 'REVEAL_LEADER' && "L"}
                                    {spinStatus === 'REVEAL_ELITES' && "E"}
                                </span>
                                <span style={{ color: '#aaa', fontSize: '0.8rem', letterSpacing: '2px', marginTop: '10px' }}>
                                    {spinStatus === 'IDLE' && "SUBJECTS"}
                                </span>
                            </div>

                        </div>

                        {/* START BUTTON (Skips during active phases) */}
                        {(spinStatus === 'IDLE' || spinStatus === 'COMPLETE') && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                <StartSelectionPlate
                                    onClick={spinStatus === 'IDLE' ? handleStart : () => {
                                        console.log("START GAME PHASE");
                                        setShowDashboard(true);
                                    }}
                                    animate={controls}
                                    textOverride={spinStatus === 'COMPLETE' ? "GAME" : "SELECTION"}
                                />


                            </div>
                        )}

                    </motion.div>
                </>
            )}

            {/* --- REVEAL BOX (BOTTOM) --- */}
            <AnimatePresence>
                {(spinStatus === 'REVEAL_LEADER' || spinStatus === 'REVEAL_ELITES') && focusedPlayer && (
                    <RevealBox focusedPlayer={focusedPlayer} />
                )}
            </AnimatePresence>



        </div>
    );
};

export default Host;
