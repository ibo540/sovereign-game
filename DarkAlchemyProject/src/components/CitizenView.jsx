import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CitizenView = ({ gameState, emit }) => {
    const { allocation, roles, myName } = gameState;

    // Deterministic Class Assignment (Since Host only sends "CITIZEN")
    // We use name hash so it stays consistent for the same player.
    const getClass = (name) => {
        if (!name) return 'Lower Class';
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const val = hash % 100;
        if (val < 20) return 'Upper Class'; // 20% Chance
        if (val < 60) return 'Middle Class'; // 40% Chance
        return 'Lower Class'; // 40% Chance
    };

    const myClass = getClass(myName);

    // Theme Config
    const getTheme = (cls) => {
        if (cls === 'Upper Class') return { color: '#ffd700', bg: 'rgba(255, 215, 0, 0.05)' };
        if (cls === 'Middle Class') return { color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.05)' };
        return { color: '#ff3d00', bg: 'rgba(255, 61, 0, 0.05)' };
    };
    const theme = getTheme(myClass);

    // Stats
    const alloc = allocation || {
        citizens: { upper: 5, middle: 10, labor: 5 },
        personal: 10,
        military: 20, intelligence: 15, interior: 15, economy: 10, media: 10
    };

    // Dynamic Totals
    // Handle both Nested (Legacy) and Flat (Current) structures
    const getVal = (key) => {
        if (alloc[key] !== undefined) return alloc[key]; // Flat
        if (alloc.citizens && alloc.citizens[key] !== undefined) return alloc.citizens[key]; // Nested
        return 0; // Default to 0
    };

    const citizenTotal = getVal('upper') + getVal('middle') + getVal('labor');

    const eliteKeys = ['military', 'intelligence', 'interior', 'economy', 'media'];
    const eliteTotal = eliteKeys.reduce((acc, key) => acc + (alloc[key] || 0), 0);

    let myGain = 5;
    if (myClass === 'Upper Class') myGain = getVal('upper');
    if (myClass === 'Middle Class') myGain = getVal('middle');
    if (myClass === 'Lower Class') myGain = getVal('labor');

    const [hasActed, setHasActed] = useState(false);
    const [actionType, setActionType] = useState(null); // 'accept' or 'protest'

    const handleAction = (type) => {
        if (navigator.vibrate) navigator.vibrate(100);
        setActionType(type);
        setTimeout(() => {
            setHasActed(true);
            const msgType = type === 'protest' ? 'PROTEST' : 'ACCEPT'; // Using ACCEPT to just log, only PROTEST does something in engine for now
            emit(msgType, {});
        }, 1500); // Wait for animation
    };

    // 2. WAITING FOR LEADER STATE
    if (!allocation || Object.keys(allocation).length === 0) {
        return (
            <div className="leader-dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', border: `1px solid ${theme.color}` }}>
                <div className="status-ring" style={{ width: '80px', height: '80px', borderTop: `4px solid ${theme.color}` }}></div>
                <h2 style={{ color: theme.color, marginTop: '30px', letterSpacing: '2px', fontFamily: 'Cinzel Decorative' }}>AWAITING BUDGET</h2>
                <p style={{ color: '#aaa', fontFamily: 'Roboto Mono' }}>The Leader is Deliberating...</p>
            </div>
        );
    }

    if (hasActed) {
        return (
            <div className="leader-dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', border: `1px solid ${theme.color}` }}>
                <div className="status-ring" style={{ width: '100px', height: '100px', borderTop: `4px solid ${theme.color}` }}></div>
                <h2 style={{ color: theme.color, marginTop: '30px', letterSpacing: '2px', fontFamily: 'Cinzel Decorative' }}>
                    {actionType === 'protest' ? 'SIGNAL TRANSMITTED' : 'COMPLIANCE REGISTERED'}
                </h2>
                <p style={{ color: '#aaa', fontFamily: 'Roboto Mono' }}>Awaiting Regime Consensus...</p>
            </div>
        );
    }

    return (
        <div className="leader-dashboard" style={{ border: `1px solid ${theme.color}`, boxShadow: `inset 0 0 50px ${theme.bg}`, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <h1 style={{ color: theme.color, textShadow: `0 0 10px ${theme.color}`, fontSize: '2.5rem', margin: 0, fontFamily: 'Cinzel Decorative' }}>CITIZEN</h1>
                <p className="leader-sub-header" style={{ borderColor: theme.color, color: theme.color, fontFamily: 'Cinzel', fontSize: '1rem', letterSpacing: '4px', borderTop: `1px solid ${theme.color}`, display: 'inline-block', padding: '5px 20px', marginTop: '10px' }}>
                    {myClass.toUpperCase()}
                </p>
            </div>

            {/* Content */}
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                    {[
                        { label: 'YOUR GAIN', val: `${myGain}%` },
                        { label: 'CITIZEN TOTAL', val: `${citizenTotal}%` },
                        { label: 'ELITE TOTAL', val: `${eliteTotal}%` },
                        { label: 'LEADER GAIN', val: `${alloc.personal || 10}%` }
                    ].map(stat => (
                        <div key={stat.label} style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderLeft: `2px solid ${theme.color}` }}>
                            <span style={{ fontFamily: 'Cinzel', fontSize: '0.8rem', color: '#aaa', display: 'block' }}>{stat.label}</span>
                            <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: theme.color, fontWeight: '700' }}>{stat.val}</span>
                        </div>
                    ))}
                </div>

                <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '40px', textAlign: 'center' }}>
                    "The hierarchy is absolute. Your compliance is mandatory."
                </p>

                {/* Buttons with Animation Logic */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', position: 'relative', height: '200px', alignItems: 'center' }}>

                    {/* ACCEPT BUTTON */}
                    <AnimatePresence>
                        {actionType !== 'protest' && (
                            <motion.button
                                initial={{ scale: 1 }}
                                animate={actionType === 'accept' ? { x: 100, scale: 1.5, opacity: 0 } : {}}
                                exit={{ opacity: 0, scale: 0 }}
                                onClick={() => handleAction('accept')}
                                style={{
                                    width: '150px', height: '150px', borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)', border: `2px solid ${theme.color}`, color: theme.color,
                                    fontFamily: 'Cinzel Decorative', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer',
                                    boxShadow: `0 0 20px ${theme.color}`
                                }}
                            >
                                ACCEPT
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* PROTEST BUTTON */}
                    <AnimatePresence>
                        {actionType !== 'accept' && (
                            <motion.button
                                initial={{ scale: 1 }}
                                animate={actionType === 'protest' ? { x: -100, scale: 1.5, opacity: 0 } : {}}
                                exit={{ opacity: 0, scale: 0 }}
                                onClick={() => handleAction('protest')}
                                style={{
                                    width: '150px', height: '150px', borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)', border: `2px solid ${theme.color}`, color: theme.color,
                                    fontFamily: 'Cinzel Decorative', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer',
                                    boxShadow: `0 0 20px ${theme.color}`
                                }}
                            >
                                PROTEST
                            </motion.button>
                        )}
                    </AnimatePresence>

                </div>

            </div>
        </div>
    );
};

export default CitizenView;
