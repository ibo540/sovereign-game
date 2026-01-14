import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EliteView = ({ gameState, emit }) => {
    const { allocation, roles, players } = gameState;
    const myName = gameState.myName; // Assuming passed or found

    // Find my specific role string (e.g., "ELITE_MILITARY")
    // Fix: roles is { Name: RoleString }, so just access it directly.
    const myRoleStr = roles ? roles[myName] : null;

    // Simplified Role Parsing
    const roleType = myRoleStr ? myRoleStr.replace('ELITE_', '') : 'MILITARY'; // Default fallback

    // Local State
    const [hasVoted, setHasVoted] = useState(false);
    const [showBetrayModal, setShowBetrayModal] = useState(false);
    const [showExternalOffer, setShowExternalOffer] = useState(false);

    // Reset State when Round Changes or Phase Resets
    useEffect(() => {
        if (gameState.phase === 'GAME_ACTIVE' || gameState.phase === 'ALLOCATION') {
            setHasVoted(false);
            setShowBetrayModal(false);
            setShowExternalOffer(false);
            setChatInput("");
        }
    }, [gameState.phase, gameState.currentRound]);

    // External Offer Trigger (Deterministic: One Elite per Round)
    useEffect(() => {
        if (allocation && !hasVoted && gameState.phase === 'VOTING_PHASE') {
            const elitePlayers = players
                .filter(p => roles[p.name] && roles[p.name].startsWith('ELITE'))
                .sort((a, b) => a.name.localeCompare(b.name));

            if (elitePlayers.length > 0) {
                // Deterministic Index based on Round
                const round = gameState.currentRound || 1;
                const targetIndex = round % elitePlayers.length;
                const targetElite = elitePlayers[targetIndex].name;

                if (myName === targetElite) {
                    setTimeout(() => setShowExternalOffer(true), 3000); // 3s Delay
                }
            }
        }
    }, [allocation, gameState.phase, hasVoted, players, roles, myName, gameState.currentRound]);

    // Use Real Chat Messages from Game State (with fallback for initial mock)
    const messages = gameState.messages && gameState.messages.length > 0
        ? gameState.messages
        : [
            { sender: 'SYSTEM', text: "Council Channel Established.", color: '#666' }
        ];

    const [chatInput, setChatInput] = useState("");

    // Helpers for Theme Colors
    const getThemeColor = (type) => {
        switch (type) {
            case 'MILITARY': return '#b30000';
            case 'INTELLIGENCE': return '#00bcd4';
            case 'INTERIOR': return '#7b1fa2';
            case 'ECONOMY': return '#4caf50';
            case 'MEDIA': return '#ff9800';
            default: return '#b30000';
        }
    };
    const themeColor = getThemeColor(roleType);

    // Chart Data Calculation
    // Use allocation or default mock
    const alloc = allocation || {
        military: 20, intelligence: 15, interior: 15, economy: 10, media: 10,
        personal: 10, citizens: 20
    };

    const myShare = alloc[roleType.toLowerCase()] || 0;
    const leaderShare = alloc.personal || 0;

    // Calculate Peers Average (excluding me and Leader/Citizens)
    const eliteKeys = ['military', 'intelligence', 'interior', 'economy', 'media'];
    const peerTotal = eliteKeys.reduce((acc, key) => key !== roleType.toLowerCase() ? acc + (alloc[key] || 0) : acc, 0);
    const peerAvg = Math.round(peerTotal / 4);

    const citizenShare = (typeof alloc.citizens === 'object')
        ? (alloc.citizens.upper + alloc.citizens.middle + alloc.citizens.labor)
        : (alloc.citizens || 20);

    const handleVote = (voteType, candidate = null, meta = {}) => {
        emit('VOTE_SUBMIT', {
            vote: voteType,
            candidate,
            coupType: voteType === 'LOYAL' ? 'NONE' : 'INTERNAL',
            meta // Pass extra data
        });
        setHasVoted(true);
        setShowBetrayModal(false);
    };

    const sendChat = () => {
        if (!chatInput.trim()) return;

        // Emit Chat Message via Game Engine (broadcast)
        // We use 'GAME_MESSAGE' channel similar to other events
        emit('GAME_MESSAGE', {
            type: 'CHAT_MESSAGE',
            sender: roleType, // e.g. "MILITARY"
            text: chatInput,
            color: themeColor
        });

        setChatInput("");
    };

    // 3. WAITING FOR LEADER STATE
    if (!allocation || Object.keys(allocation).length === 0) {
        return (
            <div className="main-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="status-ring" style={{ width: '80px', height: '80px', borderTop: `4px solid ${themeColor}` }}></div>
                <h2 style={{ color: themeColor, marginTop: '30px', letterSpacing: '2px', fontFamily: 'Cinzel Decorative' }}>AWAITING LEADER</h2>
                <p style={{ color: '#aaa', fontFamily: 'Roboto Mono' }}>Allocating State Budget...</p>
            </div>
        );
    }

    if (hasVoted) {
        return (
            <div className="main-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="status-ring" style={{ width: '80px', height: '80px', borderTop: `4px solid ${themeColor}` }}></div>
                <h2 style={{ color: themeColor, marginTop: '30px', letterSpacing: '2px', fontFamily: 'Cinzel Decorative' }}>VOTE RECORDED</h2>
                <p style={{ color: '#aaa', fontFamily: 'Roboto Mono' }}>Awaiting Council Consensus...</p>
            </div>
        );
    }

    return (
        <div className="main-container elite-responsive-wrapper" style={{ minHeight: '100vh', padding: '20px', boxSizing: 'border-box', overflowX: 'hidden' }}>
            {/* Dynamic Style Injection for Body BG and Responsive Grid */}
            <style>{`
                * {
                    box-sizing: border-box;
                }
                html, body {
                    overflow-x: hidden !important;
                    max-width: 100vw !important;
                }
                body {
                    background: url('/assets/background_elite.png') no-repeat center center fixed !important;
                    background-size: cover !important;
                    margin: 0;
                    padding: 0;
                }
                .chart-bar-fill { transition: width 1s ease-out; }

                /* DEFAULT MOBILE STYLES (Vertical Stack) */
                .elite-responsive-wrapper {
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 15px;
                }
                .elite-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 25px;
                }
                .chat-section {
                     height: 250px;
                     max-height: 40vh;
                }

                /* LAPTOP/DESKTOP STYLES (Side-by-Side) */
                @media (min-width: 1024px) {
                    .elite-responsive-wrapper {
                        max-width: 95vw;
                        padding: 20px;
                    }
                    .elite-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        align-items: start;
                    }
                    .elite-header-group {
                        grid-column: 1 / -1;
                        text-align: center;
                        margin-bottom: 15px;
                    }
                    #elite-title {
                        font-size: 2.5rem !important;
                        margin: 0 0 5px 0 !important;
                    }
                    .chat-section {
                        height: 400px;
                        max-height: 50vh;
                    }
                }
                
                /* Prevent overflow on smaller screens */
                @media (max-width: 1023px) {
                    #elite-title {
                        font-size: 2rem !important;
                    }
                }
            `}</style>

            <div className="elite-grid">

                {/* HEADLINES (Full Width on Desktop) */}
                <div className="elite-header-group">
                    <h1 id="elite-title" style={{ color: themeColor, textShadow: `0 0 20px ${themeColor}`, fontSize: '2rem', margin: '0 0 8px 0', fontFamily: 'Cinzel Decorative', textAlign: 'center' }}>
                        ELITE {roleType}
                    </h1>
                    <div className="subtitle-row" style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: '#888', gridGap: '20px', fontFamily: 'Roboto Mono', fontSize: '0.8rem' }}>
                        <span>MINISTRY OF {roleType}</span>
                        <span>|</span>
                        <span>VOTE WEIGHT: {roleType === 'MILITARY' ? 3 : (roleType === 'INTELLIGENCE' || roleType === 'INTERIOR' ? 2 : 1)}</span>
                    </div>
                </div>

                {/* LEFT COLUMN: CHARTS */}
                <div className="left-column">
                    <div className="section-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px', marginBottom: '25px', color: '#ccc', letterSpacing: '3px' }}>
                        RESOURCE ALLOCATION
                    </div>

                    <div className="comparison-chart" style={{ display: 'grid', gap: '25px' }}>
                        {/* YOU */}
                        <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '90px 1fr 60px', alignItems: 'center', gap: '20px' }}>
                            <span className="chart-label" style={{ textAlign: 'right', color: themeColor, fontWeight: 'bold' }}>YOU</span>
                            <div className="chart-bar-bg" style={{ height: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${myShare}%` }}
                                    style={{ height: '100%', background: themeColor, boxShadow: `0 0 15px ${themeColor}` }}
                                />
                            </div>
                            <span className="chart-value" style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: themeColor, fontWeight: '700' }}>{myShare}%</span>
                        </div>
                        {/* LEADER */}
                        <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '90px 1fr 60px', alignItems: 'center', gap: '20px' }}>
                            <span className="chart-label" style={{ textAlign: 'right', color: '#ffd700', opacity: 0.7 }}>LEADER</span>
                            <div className="chart-bar-bg" style={{ height: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${leaderShare}%` }} style={{ height: '100%', background: '#ffd700' }} />
                            </div>
                            <span className="chart-value" style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: '#ddd' }}>{leaderShare}%</span>
                        </div>
                        {/* CITIZENS */}
                        <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '90px 1fr 60px', alignItems: 'center', gap: '20px' }}>
                            <span className="chart-label" style={{ textAlign: 'right', color: '#aaa' }}>CITIZENS</span>
                            <div className="chart-bar-bg" style={{ height: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${citizenShare}%` }} style={{ height: '100%', background: '#fff', opacity: 0.6 }} />
                            </div>
                            <span className="chart-value" style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: '#ddd' }}>{citizenShare}%</span>
                        </div>
                        {/* PEERS */}
                        <div className="chart-row" style={{ display: 'grid', gridTemplateColumns: '90px 1fr 60px', alignItems: 'center', gap: '20px' }}>
                            <span className="chart-label" style={{ textAlign: 'right', color: '#aaa' }}>PEERS (AVG)</span>
                            <div className="chart-bar-bg" style={{ height: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${peerAvg}%` }} style={{ height: '100%', background: '#00e5ff', opacity: 0.6 }} />
                            </div>
                            <span className="chart-value" style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: '#ddd' }}>{peerAvg}%</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: CHAT & ACTIONS */}
                <div className="right-column">
                    <div className="section-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px', marginBottom: '15px', color: '#ccc', letterSpacing: '3px' }}>
                        SECRET COUNCIL CHANNEL
                    </div>

                    <div className="chat-box" style={{ border: `1px solid ${themeColor}`, background: 'rgba(0,0,0,0.4)', padding: '15px', display: 'flex', flexDirection: 'column' }}>
                        <div className="chat-section" style={{ overflowY: 'auto', marginBottom: '10px', fontFamily: 'Roboto Mono', fontSize: '0.9rem', flexGrow: 1 }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{ marginBottom: '8px' }}>
                                    <span style={{ color: msg.color, fontWeight: 'bold' }}>[{msg.sender}]:</span> {msg.text}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                placeholder="Transmit Encrypted Message..."
                                style={{ flexGrow: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid #555', color: '#fff', padding: '12px', fontFamily: 'Roboto Mono' }}
                            />
                            <button onClick={sendChat} style={{ background: themeColor, color: '#000', border: 'none', padding: '0 25px', fontFamily: 'Cinzel', fontWeight: 'bold', cursor: 'pointer' }}>SEND</button>
                        </div>
                    </div>

                    {/* DECISION */}
                    <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
                        <button
                            onClick={() => handleVote('LOYAL')}
                            style={{ flex: 1, padding: '25px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${themeColor}`, color: themeColor, fontFamily: 'Cinzel', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', letterSpacing: '2px' }}
                        >
                            LOYAL
                        </button>
                        <button
                            onClick={() => setShowBetrayModal(true)}
                            style={{ flex: 1, padding: '25px', background: 'rgba(0,0,0,0.6)', border: '1px solid #ff3d00', color: '#ff3d00', fontFamily: 'Cinzel', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', letterSpacing: '2px' }}
                        >
                            BETRAY
                        </button>
                    </div>
                </div>

            </div>

            {/* BETRAYAL MODAL */}
            <AnimatePresence>
                {showBetrayModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                        <div style={{ background: '#000', border: '2px solid #ff3d00', padding: '30px', maxWidth: '400px', textAlign: 'center' }}>
                            <h3 style={{ color: '#ff3d00', marginBottom: '20px', fontFamily: 'Cinzel' }}>CONFIRM TREASON</h3>
                            <p style={{ color: '#ccc', fontFamily: 'Roboto Mono', fontSize: '0.9rem', marginBottom: '30px' }}>
                                You are voting to overthrow the Leader. If successful, a new order will rise.
                            </p>
                            <button
                                onClick={() => handleVote('BETRAY')}
                                style={{ width: '100%', padding: '15px', background: '#2a0000', border: '1px solid #ff0000', color: '#ff0000', fontFamily: 'Cinzel', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
                            >
                                EXECUTE BETRAYAL
                            </button>
                            <button
                                onClick={() => setShowBetrayModal(false)}
                                style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #444', color: '#666', fontFamily: 'Roboto Mono', cursor: 'pointer' }}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* EXTERNAL POWER MODAL */}
            <AnimatePresence>
                {showExternalOffer && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}
                    >
                        <div style={{
                            background: '#050000', border: '2px solid #ff0000', padding: '40px', maxWidth: '500px', textAlign: 'center',
                            boxShadow: '0 0 50px #400000'
                        }}>
                            <h3 style={{ color: '#ff0000', marginBottom: '20px', fontFamily: 'Cinzel Decorative', fontSize: '2rem', letterSpacing: '5px' }}>
                                EXTERNAL CONTACT
                            </h3>
                            <p style={{ color: '#fff', fontFamily: 'Roboto Mono', fontSize: '1rem', marginBottom: '30px', lineHeight: '1.6' }}>
                                We have observed your dissatisfaction. <br />
                                <span style={{ color: '#ff4444' }}>If you lead the coup, we will supply +50 Resources and ensure your leadership in the new order.</span>
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <button
                                    onClick={() => {
                                        // Confirm Betrayal Logic
                                        if (window.confirm("ARE YOU SURE? THIS CANNOT BE UNDONE.")) {
                                            handleVote('BETRAY', null, { reason: 'EXTERNAL_OFFER' });
                                            setShowExternalOffer(false);
                                        }
                                    }}
                                    style={{ padding: '15px', background: '#400000', border: '1px solid #ff0000', color: '#fff', fontFamily: 'Cinzel', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
                                >
                                    ACCEPT OFFER (BETRAY)
                                </button>
                                <button
                                    onClick={() => setShowExternalOffer(false)}
                                    style={{ padding: '15px', background: 'transparent', border: '1px solid #666', color: '#aaa', fontFamily: 'Roboto Mono', cursor: 'pointer' }}
                                >
                                    BURN MESSAGE
                                </button>
                                <button
                                    onClick={() => setShowExternalOffer(false)}
                                    style={{ padding: '15px', background: 'transparent', border: 'none', color: '#444', fontFamily: 'Roboto Mono', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    IGNORE
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EliteView;
