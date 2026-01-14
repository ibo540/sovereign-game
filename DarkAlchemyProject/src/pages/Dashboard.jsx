
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- VISUAL ASSETS (CSS-in-JS for now) ---
const styles = {
    container: {
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #050505 0%, #1a0505 40%, #050505 100%)', // Deep dark red/black theme
        color: '#fff',
        display: 'grid',
        gridTemplateColumns: '350px 1fr 350px', // Wider sidebars
        gridTemplateRows: '100px 1fr 100px',
        overflow: 'hidden',
        fontFamily: 'Cinzel, serif',
        position: 'relative'
    },
    // Background Pattern Overlay
    bgOverlay: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'radial-gradient(rgba(255, 215, 0, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0
    },
    header: {
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 60px',
        borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.95), rgba(0,0,0,0.4))',
        backdropFilter: 'blur(5px)',
        boxShadow: '0 5px 30px rgba(0,0,0,0.8)',
        zIndex: 20
    },
    eliteColumn: {
        gridColumn: '1 / 2',
        gridRow: '2 / -1',
        padding: '40px 30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '25px',
        borderRight: '1px solid rgba(255, 215, 0, 0.2)',
        background: 'linear-gradient(90deg, rgba(0,0,0,0.6), transparent)',
        position: 'relative',
        zIndex: 10
    },
    mainContent: {
        gridColumn: '2 / 3',
        gridRow: '2 / 3',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '40px',
        position: 'relative',
        zIndex: 10
    },
    rightColumn: {
        gridColumn: '3 / 4',
        gridRow: '2 / -1',
        padding: '40px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderLeft: '1px solid rgba(255, 215, 0, 0.2)',
        background: 'linear-gradient(-90deg, rgba(0,0,0,0.6), transparent)',
        zIndex: 10
    }
};

// --- ICONS (SVG) ---
const IconHourglass = ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
        <path d="M22 17H2" />
        <path d="M2 7h20" />
        <path d="M12 17v-6" />
        <path d="M12 7V2" />
    </svg>
);
// Simplified Hourglass
const IconWait = ({ color }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
);

const IconLock = ({ color }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconLoyal = ({ color }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const IconBetray = ({ color }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
        <line x1="13" y1="19" x2="19" y2="13" />
        <line x1="16" y1="16" x2="20" y2="20" />
        <line x1="19" y1="21" x2="21" y2="19" />
    </svg>
);


// --- ELITE CARD COMPONENT ---
const EliteCard = ({ name, role, color, weight, vote, votesRevealed }) => {
    // Determine status
    // If no vote: "WAITING..." (Pulsing)
    // If vote exists but not revealed: "VOTE CAST" (Checkmark, Locked)
    // If revealed: SHOW "LOYAL" or "BETRAY"

    let statusText = "WAITING...";
    let statusColor = "#666";
    let StatusIcon = <IconWait color="#666" />;

    if (vote) {
        const voteVal = (typeof vote === 'object' && vote.val) ? vote.val : vote;

        if (!votesRevealed) {
            statusText = "VOTE CAST";
            statusColor = "#FFD700"; // Gold check
            StatusIcon = <IconLock color="#FFD700" />;
        } else {
            statusText = voteVal; // "LOYAL" or "BETRAY"
            statusColor = voteVal === 'LOYAL' ? '#4CAF50' : '#ff4444';
            StatusIcon = voteVal === 'LOYAL' ? <IconLoyal color="#4CAF50" /> : <IconBetray color="#ff4444" />;
        }
    }

    return (
        <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            whileHover={{ scale: 1.02, x: 10 }}
            style={{
                display: 'flex',
                alignItems: 'stretch',
                height: '70px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderLeft: `4px solid ${color}`,
                boxShadow: `0 0 15px rgba(0,0,0,0.5)`,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Glossy shine effect */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.05), transparent)', pointerEvents: 'none' }} />

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                    <span style={{
                        fontFamily: 'Cinzel Decorative',
                        fontSize: '1.4rem',
                        color: color,
                        textShadow: `0 0 10px ${color}80`,
                        lineHeight: 1
                    }}>
                        {name.toUpperCase()}
                    </span>
                    <span style={{
                        fontSize: '0.75rem',
                        color: '#bbb',
                        letterSpacing: '3px',
                        fontFamily: 'Cinzel',
                        textTransform: 'uppercase'
                    }}>
                        {role.replace('ELITE_', '')}
                    </span>
                </div>

                {/* Vote / Weight Indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {/* Vote Status */}
                    <div style={{
                        fontSize: '0.9rem',
                        color: statusColor,
                        fontFamily: 'Cinzel',
                        fontWeight: 'bold',
                        letterSpacing: '2px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        {StatusIcon} {statusText}
                    </div>

                    {/* Weight */}
                    <div style={{
                        fontSize: '0.8rem',
                        fontFamily: 'Cinzel',
                        color: 'rgba(255,255,255,0.2)',
                        marginTop: '2px'
                    }}>
                        POWER: {weight === 3 ? 'III' : (weight === 2 ? 'II' : 'I')}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- CHART COMPONENT (Vertical Bars - Glass Effect) ---
const ResourceChart = ({ allocation }) => {
    // Mock allocation if empty, matching Legacy "Leader Preview" categories
    const data = allocation || {
        personal: 10,
        military: 20,
        intelligence: 15,
        interior: 15,
        economy: 10,
        media: 10,
        citizens: 20 // aggregated for now, or split? User said "all things". Let's split.
    };

    // If we have detailed citizen data, use it, otherwise fallback
    const chartData = allocation ? allocation : {
        personal: { val: 5, color: '#FFD700', label: 'TREASURY' }, // Gold
        military: { val: 25, color: '#ff4444', label: 'MILITARY' }, // Red
        intelligence: { val: 15, color: '#1e90ff', label: 'INTEL' }, // Blue
        interior: { val: 15, color: '#9370db', label: 'INTERIOR' }, // Purple
        economy: { val: 15, color: '#32cd32', label: 'ECONOMY' }, // Green
        media: { val: 10, color: '#ffa500', label: 'MEDIA' }, // Orange
        upper: { val: 5, color: '#00ced1', label: 'UPPER' }, // Cyan
        middle: { val: 5, color: '#00bfff', label: 'MIDDLE' }, // Sky
        labor: { val: 5, color: '#4682b4', label: 'LABOR' }, // Steel
    };

    const maxVal = Math.max(...Object.values(chartData).map(d => d.val));

    return (
        <div style={{
            display: 'flex',
            gap: '20px', // Tighter gap for more bars
            alignItems: 'flex-end',
            height: '400px',
            padding: '40px',
            background: 'rgba(20, 20, 20, 0.4)', // Slightly darker
            backdropFilter: 'blur(10px)', // Glass effect on container
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: '12px',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.5)'
        }}>
            {Object.entries(chartData).map(([key, item], i) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <div style={{
                        fontSize: '1rem',
                        fontFamily: 'Cinzel',
                        fontWeight: 'bold',
                        color: '#fff',
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                        opacity: item.val > 0 ? 1 : 0.3
                    }}>{item.val}%</div>

                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(item.val / maxVal) * 250}px` }}
                        transition={{ duration: 1.2, delay: i * 0.1, ease: 'backOut' }}
                        style={{
                            width: '100%',
                            maxWidth: '40px',
                            minWidth: '20px',
                            // GLASS EFFECT ON BARS
                            background: `linear-gradient(180deg, ${item.color}aa, ${item.color}44)`,
                            border: `1px solid ${item.color}`,
                            borderBottom: 'none',
                            borderRadius: '4px 4px 0 0',
                            boxShadow: `0 0 15px ${item.color}66, inset 0 0 10px rgba(255,255,255,0.2)`,
                            backdropFilter: 'blur(4px)',
                            position: 'relative'
                        }}
                    >
                        {/* Shine highlight */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '30%', background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)' }} />
                    </motion.div>

                    <div style={{
                        fontSize: '0.7rem',
                        color: '#aaa',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontFamily: 'Cinzel',
                        marginTop: '5px',
                        textAlign: 'center',
                        height: '20px' // Fix height for alignment
                    }}>{item.label}</div>
                </div>
            ))}
        </div>
    );
};

// --- PROTEST METER COMPONENT ---
const ProtestMeter = ({ count }) => {
    // Max protests before... chaos?
    const MAX_PROTESTS = 10;
    const percentage = Math.min(100, (count / MAX_PROTESTS) * 100);

    return (
        <div style={{ width: '100%', marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ color: '#ff4444', fontFamily: 'Cinzel Decorative', fontSize: '1.2rem', letterSpacing: '2px' }}>
                    CIVIL UNREST
                </span>
                <span style={{ color: '#aaa', fontFamily: 'Cinzel', fontSize: '1rem' }}>
                    {count} / {MAX_PROTESTS}
                </span>
            </div>

            <div style={{
                width: '100%', height: '20px',
                background: 'rgba(50, 0, 0, 0.5)',
                border: '1px solid #400',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    style={{
                        height: '100%',
                        background: `linear-gradient(90deg, #500, #f00)`,
                        boxShadow: '0 0 20px #f00'
                    }}
                />

                {/* Grid Lines */}
                {[...Array(9)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute', top: 0, left: `${(i + 1) * 10}%`,
                        width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)'
                    }} />
                ))}
            </div>

            <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px', textAlign: 'center', fontFamily: 'Cinzel' }}>
                EXCESSIVE UNREST DESTABILIZES THE REGIME
            </p>
        </div>
    );
};

// --- ELIMINATED LIST COMPONENT (Replaces Protest Meter) ---
const EliminatedList = ({ eliminatedPlayers }) => {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <h3 style={{ color: '#ff4444', letterSpacing: '4px', fontSize: '1.2rem', margin: 0, fontFamily: 'Cinzel Decorative', textAlign: 'center' }}>
                ELIMINATED
            </h3>

            <div style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                padding: '20px',
                overflowY: 'auto'
            }}>
                <AnimatePresence>
                    {eliminatedPlayers.map((name, i) => (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, scale: 0.8, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring' }}
                            style={{
                                position: 'relative',
                                background: '#1a0000',
                                border: '1px solid #400',
                                padding: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 10px #400'
                            }}
                        >
                            <span style={{
                                color: '#666',
                                fontFamily: 'Cinzel',
                                textDecoration: 'line-through',
                                fontSize: '1.2rem'
                            }}>
                                {name.toUpperCase()}
                            </span>

                            {/* STAMP */}
                            <motion.div
                                initial={{ opacity: 0, scale: 2, rotate: -20 }}
                                animate={{ opacity: 1, scale: 1, rotate: -15 }}
                                transition={{ delay: 0.5, type: 'spring', bounce: 0.3 }}
                                style={{
                                    position: 'absolute',
                                    border: '4px solid #ff0000',
                                    color: '#ff0000',
                                    fontFamily: 'Black Ops One, sans-serif', // Fallback font
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    padding: '5px 10px',
                                    transform: 'rotate(-15deg)',
                                    textShadow: '0 0 10px red',
                                    boxShadow: '0 0 10px red, inset 0 0 10px red',
                                    background: 'rgba(255, 0, 0, 0.1)'
                                }}
                            >
                                PURGED
                            </motion.div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {eliminatedPlayers.length === 0 && (
                    <div style={{ color: '#444', fontStyle: 'italic', fontFamily: 'Cinzel', textAlign: 'center', marginTop: '50px' }}>
                        NO CASUALTIES YET
                    </div>
                )}
            </div>
        </div>
    );
};

// --- TIMELINE COMPONENT (New) ---
const Timeline = ({ currentPhase }) => {
    // Phase Mapping:
    // GAME_ACTIVE -> 0 (ALLOCATION)
    // VOTING_PHASE -> 1 (COUNCIL)
    // JUDGMENT -> 2 (JUDGMENT)

    const steps = [
        { id: 'ALLOCATION', label: 'ALLOCATION' },
        { id: 'COUNCIL', label: 'COUNCIL' },
        { id: 'JUDGMENT', label: 'JUDGMENT' }
    ];

    const activeIndex = currentPhase === 'JUDGMENT' ? 2 : (currentPhase === 'VOTING_PHASE' ? 1 : 0);

    return (
        <div style={{
            marginTop: '20px',
            marginBottom: '40px',
            display: 'flex', alignItems: 'center', gap: '40px', zIndex: 50,
            justifyContent: 'center'
        }}>
            {steps.map((step, i) => {
                const isActive = i === activeIndex;
                const isPast = i < activeIndex;
                // const color = isActive ? '#DC143C' : (isPast ? '#444' : '#222');
                const glow = isActive ? '0 0 15px #DC143C' : 'none';

                return (
                    <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', position: 'relative' }}>
                        {/* Dot */}
                        <motion.div
                            animate={{
                                scale: isActive ? 1.2 : 1,
                                backgroundColor: isActive ? '#DC143C' : (isPast ? '#666' : '#333')
                            }}
                            style={{
                                width: '12px', height: '12px', borderRadius: '50%',
                                boxShadow: glow
                            }}
                        />
                        {/* Label */}
                        <span style={{
                            fontFamily: 'Cinzel', fontSize: '0.7rem', letterSpacing: '2px',
                            color: isActive ? '#fff' : (isPast ? '#888' : '#444'),
                            opacity: isActive || isPast ? 1 : 0.5
                        }}>
                            {step.label}
                        </span>

                        {/* Connector Line */}
                        {i < steps.length - 1 && (
                            <div style={{
                                position: 'absolute', top: '5px', left: '20px', width: '40px', height: '2px',
                                background: '#333', zIndex: -1
                            }}>
                                {(isPast || isActive) && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: isPast ? '100%' : '50%' }}
                                        style={{ height: '100%', background: '#666' }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = ({ gameState, onRevealVotes, votesRevealed, onNextRound, eliminatedPlayers }) => {
    const { players, roles, allocation, protests, votes, result } = gameState; // Destructure result
    const [showResult, setShowResult] = useState(false);

    // Show result overlay when result arrives, hide after 8s
    useEffect(() => {
        if (result) {
            setShowResult(true);
            // Removed auto-hide timer to allow manual close
        }
    }, [result]);

    // Helper to get Sector Info
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

    // Filter Elites
    console.log("🔍 DASHBOARD ROLES:", roles);
    const elites = players.filter(p => roles[p.name] && roles[p.name].startsWith('ELITE'));
    console.log("🏛️ FILTERED ELITES:", elites.map(e => e.name));
    const totalElites = elites.length;
    const voteCount = votes ? Object.keys(votes).length : 0;
    const allVoted = totalElites > 0 && voteCount >= totalElites;

    return (
        <div style={styles.container}>
            <div style={styles.bgOverlay} />

            {/* Header */}
            <header style={styles.header}>
                <h1 style={{ margin: 0, letterSpacing: '8px', fontSize: '1.8rem', fontFamily: 'Cinzel Decorative', color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                    <span style={{ color: '#DC143C' }}>SOVEREIGN</span>
                </h1>
                <div style={{ display: 'flex', gap: '40px', fontFamily: 'Cinzel', fontSize: '1rem', color: '#aaa' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', letterSpacing: '2px' }}>ROUND</span>
                        <span style={{ color: '#fff', fontSize: '1.2rem' }}>{gameState.currentRound || 1}</span>
                    </div>

                    {/* NEXT ROUND BUTTON */}
                    {(gameState.phase === 'JUDGMENT' || gameState.result) && (
                        <div style={{ marginLeft: '20px' }}>
                            <button
                                onClick={onNextRound}
                                style={{
                                    background: '#DC143C', color: '#fff', border: 'none',
                                    padding: '5px 15px', fontFamily: 'Cinzel', fontSize: '0.8rem',
                                    cursor: 'pointer', borderRadius: '4px'
                                }}
                            >
                                START ROUND {(gameState.currentRound || 1) + 1}
                            </button>
                        </div>
                    )}

                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', letterSpacing: '2px' }}>PHASE</span>
                        <span style={{ color: '#DC143C', fontSize: '1.2rem' }}>
                            {gameState.phase === 'VOTING_PHASE' ? 'COUNCIL' : (gameState.phase === 'JUDGMENT' ? 'JUDGMENT' : 'ALLOCATION')}
                        </span>
                    </div>
                </div>
            </header>

            {/* Left: Elite Council */}
            <aside style={styles.eliteColumn}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #DC143C', paddingBottom: '15px' }}>
                    <h2 style={{ fontSize: '1.2rem', color: '#DC143C', margin: 0, fontFamily: 'Cinzel Decorative', letterSpacing: '2px' }}>The High Council</h2>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{voteCount}/{totalElites} VOTES</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                    {elites.map((elite, i) => {
                        const info = getEliteInfo(roles[elite.name]);
                        // Find vote for this elite
                        const eliteVote = votes ? votes[elite.name] : null;

                        return (
                            <EliteCard
                                key={elite.name}
                                name={elite.name}
                                role={roles[elite.name]}
                                color={info.color}
                                weight={info.weight}
                                vote={eliteVote} // Pass vote
                                votesRevealed={votesRevealed} // Pass reveal state
                            />
                        );
                    })}
                </div>

                {/* REVEAL BUTTON */}
                <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                    {!votesRevealed && voteCount > 0 && (
                        <button
                            onClick={onRevealVotes}
                            style={{
                                background: allVoted ? '#FFD700' : '#444',
                                color: allVoted ? '#000' : '#888',
                                border: 'none',
                                padding: '10px 20px',
                                fontFamily: 'Cinzel',
                                fontWeight: 'bold',
                                cursor: allVoted ? 'pointer' : 'not-allowed',
                                width: '100%',
                                opacity: allVoted ? 1 : 0.5
                            }}
                            disabled={!allVoted}
                        >
                            {allVoted ? "REVEAL ALL VOTES" : "WAITING FOR VOTES..."}
                        </button>
                    )}
                </div>

            </aside>

            {/* Center: Main Content (Resource Chart) */}
            <main style={styles.mainContent}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h2 style={{
                        fontSize: '2.5rem',
                        marginBottom: '20px',
                        fontFamily: 'Cinzel Decorative',
                        textAlign: 'center',
                        background: 'linear-gradient(180deg, #fff, #888)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
                    }}>
                        RESOURCE DISTRIBUTION
                    </h2>
                    <Timeline currentPhase={gameState.phase} />
                </motion.div>

                <ResourceChart allocation={allocation} />

                <motion.div
                    key={gameState.phase} // Trigger animation on phase change
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        marginTop: '60px',
                        padding: '15px 40px',
                        border: '1px solid rgba(220, 20, 60, 0.3)',
                        borderRadius: '4px',
                        background: 'rgba(220, 20, 60, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                    <div style={{ width: '10px', height: '10px', background: '#DC143C', borderRadius: '50%', boxShadow: '0 0 10px #DC143C' }} />
                    <span style={{ fontFamily: 'Cinzel', letterSpacing: '2px', color: '#DC143C', fontSize: '0.9rem' }}>
                        {gameState.phase === 'VOTING_PHASE'
                            ? "AWAITING COUNCIL VOTES..."
                            : (gameState.phase === 'JUDGMENT'
                                ? (gameState.judgmentExecuted
                                    ? "JUDGMENT EXECUTED. PREPARING TO ADVANCE..."
                                    : "LEADER IS DECIDING PUNISHMENTS...")
                                : "LEADER IS DECIDING RESOURCE ALLOCATION...")
                        }
                    </span>
                </motion.div>
            </main>

            {/* Right: Eliminated List & Protest Meter */}
            <aside style={styles.rightColumn}>
                <ProtestMeter count={protests || 0} />
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
                <EliminatedList eliminatedPlayers={eliminatedPlayers || []} />
            </aside>

            {/* --- RESULT OVERLAY --- */}
            <AnimatePresence>
                {result && showResult && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.95)', zIndex: 1000,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }}
                            transition={{ type: 'spring', duration: 1 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ fontSize: '8rem', marginBottom: '20px' }}>
                                {result.winner === 'LEADER' ? '♛' : '☠'}
                            </div>
                            <h1 style={{
                                fontSize: '6rem', color: result.winner === 'LEADER' ? '#FFD700' : '#ff4444',
                                fontFamily: 'Cinzel Decorative', textShadow: '0 0 50px currentColor', margin: 0
                            }}>
                                {result.winner === 'LEADER' ? 'REGIME SECURED' : 'REGIME FALLEN'}
                            </h1>
                            <p style={{
                                fontSize: '2rem', color: '#fff', fontFamily: 'Cinzel', letterSpacing: '5px',
                                marginTop: '20px', textTransform: 'uppercase'
                            }}>
                                {result.winner === 'LEADER' ? 'THE REBELLION IS CRUSHED' : 'THE LEADER HAS BEEN DEPOSED'}
                            </p>

                            {/* CLOSE BUTTON */}
                            <button
                                onClick={() => setShowResult(false)}
                                style={{
                                    marginTop: '40px',
                                    background: 'transparent',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    color: '#fff',
                                    fontFamily: 'Cinzel',
                                    fontSize: '1.2rem',
                                    padding: '10px 30px',
                                    cursor: 'pointer',
                                    letterSpacing: '2px',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => { e.target.style.borderColor = '#fff'; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.background = 'transparent'; }}
                            >
                                CLOSE
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Dashboard;
