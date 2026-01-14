import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LeaderView = ({ gameState, emit }) => {
    // Allocation State
    const [allocation, setAllocation] = useState({
        personal: 0,
        military: 0,
        intelligence: 0,
        interior: 0,
        economy: 0,
        media: 0,
        upper: 0,
        middle: 0,
        labor: 0
    });

    const [poolRemaining, setPoolRemaining] = useState(100);
    const [isOverBudget, setIsOverBudget] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [executionTargets, setExecutionTargets] = useState(new Set());
    const [traitorStatus, setTraitorStatus] = useState({}); // { name: 'PENDING' | 'EXECUTED' | 'PARDONED' }
    const [judgmentSent, setJudgmentSent] = useState(false);



    // Reset when phase resets to GAME_ACTIVE (new round)
    useEffect(() => {
        if (gameState.phase === 'GAME_ACTIVE') {
            setIsSubmitted(false);
            setJudgmentSent(false);
            setTraitorStatus({});
            setExecutionTargets(new Set());
            // Optional: Reset allocation to 0 or keep last round's?
            // Let's reset for fresh start
            setAllocation({
                personal: 0, military: 0, intelligence: 0, interior: 0, economy: 0, media: 0, upper: 0, middle: 0, labor: 0
            });
        }
    }, [gameState.phase, gameState.currentRound]);

    // Calculate pool whenever allocation changes
    useEffect(() => {
        const total = Object.values(allocation).reduce((a, b) => a + Number(b), 0);
        const remaining = 100 - total;
        setPoolRemaining(remaining);
        setIsOverBudget(remaining < 0);
    }, [allocation]);

    const handleInput = (key, value) => {
        setAllocation(prev => ({
            ...prev,
            [key]: parseInt(value) || 0
        }));
    };

    const handleSubmit = () => {
        if (poolRemaining !== 0) {
            alert("Allocations must sum exactly to 100.");
            return;
        }
        setIsSubmitted(true);
        // CRITICAL FIX: Emit wrapped in GAME_MESSAGE so server relays it to Host/Others
        emit('GAME_MESSAGE', { type: 'ALLOCATION_SUBMIT', allocation });
        console.log("CONFIRM BUDGET CLICKED - Sent ALLOCATION_SUBMIT");
    };

    return (
        <div id="main-content" className="leader-dashboard responsive-leader-wrapper">
            {/* FORCE BODY CLASS for Styling - Preserved across states */}
            <style>{`
                body {
                    background-image: url('/assets/leader_bg_dark.png') !important; 
                    background-size: cover !important;
                    overflow-x: hidden;
                }

                .leader-dashboard {
                    padding: 20px;
                    max-width: 600px; /* Mobile Default */
                    margin: 0 auto;
                }

                /* STICKY HEADER Mobile */
                .pool-display {
                     position: sticky; top: 0; zIndex: 100;
                     background: rgba(0,0,0,0.8);
                     backdrop-filter: blur(10px);
                     border-bottom: 1px solid #d4af37;
                     margin-bottom: 20px;
                     padding: 15px;
                     border-radius: 0 0 10px 10px;
                }

                /* DESKTOP GRID */
                @media (min-width: 1024px) {
                    .responsive-leader-wrapper {
                        max-width: 1400px; /* Wide Desktop */
                        padding-top: 40px;
                    }

                     /* Grid Layout for Form */
                    .allocation-form {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr; /* 3 Columns: Personal, Elites, Citiens */
                        gap: 40px;
                        align-items: start;
                    }

                    /* Span specific items if needed */
                    .pool-display {
                        grid-column: 1 / -1; /* Header spans all */
                        position: relative; /* Unstick on desktop? or Keep sticky */
                        top: 0;
                        margin-bottom: 40px;
                    }

                    .section-column {
                        background: rgba(0,0,0,0.3);
                        padding: 20px;
                        border-radius: 10px;
                        border: 1px solid rgba(255,255,255,0.1);
                    }

                    .btn-submit {
                        grid-column: 1 / -1;
                        max-width: 400px;
                        margin: 40px auto 0 auto !important;
                        font-size: 1.5rem !important;
                    }
                }

                /* LEGACY STYLES RESTORED */
                .screen-container { width: 100%; max-width: 800px; text-align: center; position: relative; padding: 2vh; }
                .victory-icon { font-size: 4rem; margin-bottom: 20px; color: #4CAF50; text-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
                .stat-box { display: flex; justify-content: center; gap: 40px; margin-bottom: 40px; }
                .stat-label { font-family: 'Cinzel', serif; color: #aaa; font-size: 0.9rem; display: block; margin-bottom: 5px; }
                .stat-val { font-size: 2.5rem; font-weight: 700; color: #fff; }
                
                .traitor-card { background: rgba(0, 0, 0, 0.4); border: 1px solid #444; padding: 15px; margin-bottom: 15px; border-radius: 4px; transition: all 0.5s ease; position: relative; overflow: hidden; }
                .traitor-card:hover { border-color: #d4af37; box-shadow: 0 0 20px rgba(212, 175, 55, 0.1); transform: scale(1.02); }
                .traitor-info { margin-bottom: 15px; }
                .traitor-name { display: block; font-family: 'Cinzel', serif; font-size: 1.8rem; font-weight: 700; color: #fff; text-shadow: 0 0 5px rgba(0, 0, 0, 0.8); letter-spacing: 2px; }
                .traitor-role { font-size: 1rem; color: #888; font-style: italic; }
                .action-buttons { display: flex; gap: 15px; justify-content: center; transition: opacity 0.3s; }
                
                .btn-action { 
                    padding: 10px 25px; font-family: 'Cinzel', serif; font-size: 1rem; font-weight: bold; cursor: pointer; border: 1px solid; background: transparent; text-transform: uppercase; letter-spacing: 2px; flex: 1; transition: all 0.2s;
                }
                .btn-keep { color: #4CAF50; border-color: #4CAF50; }
                .btn-keep:hover { background: rgba(76, 175, 80, 0.2); transform: scale(1.05); }
                .btn-kill { color: #ff3333; border-color: #ff3333; }
                .btn-kill:hover { background: rgba(255, 51, 51, 0.2); transform: scale(1.05); }

                .btn-continue { 
                    margin: 50px auto 0 auto; padding: 18px 50px; background: rgba(10, 10, 10, 0.8); border: 1px solid #d4af37; color: #d4af37; font-family: 'Cinzel Decorative', serif; font-size: 1.4rem; text-transform: uppercase; letter-spacing: 4px; cursor: pointer; box-shadow: 0 0 15px rgba(0, 0, 0, 0.8); transition: all 0.3s ease;
                }
                .btn-continue:hover { background: rgba(212, 175, 55, 0.1); box-shadow: 0 0 30px rgba(212, 175, 55, 0.2); letter-spacing: 6px; }

                /* ANIMATIONS */
                @keyframes stampIn {
                    0% { opacity: 0; transform: scale(2) rotate(-10deg); }
                    50% { opacity: 1; transform: scale(1) rotate(-10deg); }
                    70% { transform: scale(1.1) rotate(-10deg); }
                    100% { transform: scale(1) rotate(-10deg); }
                }
                @keyframes shakeScreen {
                    0% { transform: translate(0,0); }
                    25% { transform: translate(-10px, 10px); }
                    50% { transform: translate(10px, -10px); }
                    75% { transform: translate(-10px, -10px); }
                    100% { transform: translate(0,0); }
                }

                .traitor-card.executed {
                    background: rgba(50, 0, 0, 0.6);
                    border-color: #ff0000;
                    transform: scale(0.98);
                    pointer-events: none; /* Lock input */
                }
                .traitor-card.executed .traitor-name { text-decoration: line-through; color: #888; }
                .traitor-card.executed::after {
                    content: "TERMINATED";
                    position: absolute; top: 50%; left: 50%;
                    transform: translate(-50%, -50%) rotate(-10deg);
                    font-size: 3rem; font-weight: bold; color: rgba(255, 0, 0, 0.8);
                    border: 5px solid rgba(255, 0, 0, 0.8); padding: 10px 40px;
                    text-transform: uppercase; letter-spacing: 5px;
                    animation: stampIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    z-index: 10;
                    pointer-events: none;
                }

                .traitor-card.pardoned {
                    background: rgba(0, 50, 0, 0.4);
                    border-color: #4CAF50;
                    opacity: 0.8;
                    pointer-events: none;
                }
                .traitor-card.pardoned .action-buttons { opacity: 0; } /* Hide buttons */
                .traitor-card.pardoned::after {
                    content: "LOYALTY RESTORED";
                    position: absolute; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 1.5rem; color: #4CAF50;
                    font-family: 'Cinzel', serif; letter-spacing: 2px;
                    text-shadow: 0 0 10px #4CAF50;
                }

                /* DEFEAT */
                .pulse-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(50, 0, 0, 0.3); animation: alarmPulse 1s infinite alternate; z-index: -1; pointer-events: none; }
                @keyframes alarmPulse { 0% { background: rgba(50, 0, 0, 0.2); } 100% { background: rgba(100, 0, 0, 0.5); } }
                .crack { position: absolute; background: rgba(255, 255, 255, 0.1); z-index: 0; pointer-events: none; }
                .c1 { width: 1px; height: 100%; left: 30%; top: 0; transform: rotate(15deg); }
                .c2 { width: 100%; height: 1px; left: 0; top: 40%; transform: rotate(-10deg); }
                .defeat-msg { margin-top: 30px; color: #8a0e0e; font-style: italic; font-size: 1.2rem; border-top: 1px solid #550000; padding-top: 20px; }
                .icon-dead { font-size: 5rem; color: #8a0e0e; margin-bottom: 2vh; animation: shakeIcon 0.5s infinite; }
                @keyframes shakeIcon { 
                    0% { transform: translate(1px, 1px) rotate(0deg); } 
                    10% { transform: translate(-1px, -2px) rotate(-1deg); } 
                    20% { transform: translate(-3px, 0px) rotate(1deg); } 
                    30% { transform: translate(3px, 2px) rotate(0deg); } 
                    40% { transform: translate(1px, -1px) rotate(1deg); } 
                    50% { transform: translate(-1px, 2px) rotate(-1deg); } 
                    60% { transform: translate(-3px, 1px) rotate(0deg); } 
                    100% { transform: translate(1px, -2px) rotate(-1deg); } 
                }
                /* CUSTOM INPUTS */
                input[type=range] {
                    -webkit-appearance: none;
                    width: 100%;
                    background: transparent;
                    margin: 10px 0;
                }
                input[type=range]:focus { outline: none; }
                
                /* Slider Track */
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 8px;
                    cursor: pointer;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                
                /* Slider Thumb */
                input[type=range]::-webkit-slider-thumb {
                    height: 24px;
                    width: 24px;
                    border-radius: 50%;
                    background: #d4af37;
                    border: 2px solid #fff;
                    box-shadow: 0 0 10px rgba(212, 175, 55, 0.8);
                    cursor: pointer;
                    -webkit-appearance: none;
                    margin-top: -9px; /* center on track */
                    transition: transform 0.1s;
                }
                input[type=range]::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    background: #fff;
                    border-color: #d4af37;
                }

                /* Number Input */
                input[type=number] {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid #555;
                    color: #fff;
                    font-family: 'Cinzel', serif;
                    font-size: 1.2rem;
                    padding: 5px 10px;
                    width: 80px;
                    text-align: center;
                    border-radius: 4px;
                    transition: all 0.3s;
                }
                input[type=number]:focus {
                    border-color: #d4af37;
                    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
                    outline: none;
                }

                /* Firefox Styles */
                input[type=range]::-moz-range-track {
                    width: 100%;
                    height: 8px;
                    cursor: pointer;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                input[type=range]::-moz-range-thumb {
                    height: 24px;
                    width: 24px;
                    border: 2px solid #fff;
                    border-radius: 50%;
                    background: #d4af37;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(212, 175, 55, 0.8);
                }
            `}</style>



            {isSubmitted && !gameState.result ? (
                <div className="leader-dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                    <div className="status-ring"></div>
                    <h1 className="judgment-title">AWAITING COUNCIL</h1>
                    <p className="leader-sub-header">Allocation Transmitted</p>
                </div>
            ) : null}

            {/* JUDGMENT PHASE (VICTORY) */}
            {gameState.result && gameState.result.winner === 'LEADER' && (
                <div className="screen-container">
                    <div className="victory-icon">♛</div>
                    <div className="judgment-title" style={{ fontSize: '3rem', margin: 0 }}>REGIME SECURED</div>
                    <p className="leader-sub-header">Rebellion Crushed</p>

                    <div className="stat-box">
                        <div className="stat">
                            <span className="stat-label">Loyalist Support</span>
                            <span className="stat-val" style={{ color: '#4CAF50' }}>{gameState.result.stats?.loyal || 100}%</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Rebel Threat</span>
                            <span className="stat-val" style={{ color: '#ff3333' }}>{gameState.result.stats?.rebel || 0}%</span>
                        </div>
                    </div>

                    <div className="judgment-section">
                        <div className="judgment-title">JUDGMENT AWAITING</div>

                        {(gameState.result.betrayers || []).length === 0 ? (
                            <p style={{ color: '#888', fontStyle: 'italic', padding: '20px' }}>None. The Council is Loyal.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(gameState.result.betrayers || []).map(b => {
                                    // Handle object or string
                                    const name = b.name || b;
                                    const status = traitorStatus[name] || 'PENDING';
                                    const isExecuted = status === 'EXECUTED';
                                    const isPardoned = status === 'PARDONED';

                                    return (
                                        <div key={name} className={`traitor-card ${isExecuted ? 'executed' : ''} ${isPardoned ? 'pardoned' : ''}`}>
                                            <div className="traitor-info">
                                                <span className="traitor-name">{name}</span>
                                                <span className="traitor-role">COUNCIL TRAITOR</span>
                                            </div>
                                            <div className="action-buttons">
                                                <button className="btn-action btn-keep" onClick={() => {
                                                    setTraitorStatus(prev => ({ ...prev, [name]: 'PARDONED' }));
                                                    const newSet = new Set(executionTargets);
                                                    newSet.delete(name);
                                                    setExecutionTargets(newSet);
                                                }}>PARDON</button>

                                                <button className="btn-action btn-kill" onClick={() => {
                                                    setTraitorStatus(prev => ({ ...prev, [name]: 'EXECUTED' }));
                                                    // Trigger Shake
                                                    const container = document.getElementById('main-content');
                                                    if (container) {
                                                        container.style.animation = 'none';
                                                        void container.offsetWidth;
                                                        container.style.animation = 'shakeScreen 0.5s';
                                                    }
                                                    const newSet = new Set(executionTargets);
                                                    newSet.add(name);
                                                    setExecutionTargets(newSet);
                                                }}>EXECUTE</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* CITIZEN DISSIDENTS SECTION */}
                        {(gameState.result.protesters || []).length > 0 && (
                            <>
                                <div className="judgment-title" style={{ marginTop: '40px', color: '#ff8800' }}>DISSIDENT CITIZENS</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(gameState.result.protesters || []).map(p => {
                                        const name = p.name;
                                        const cls = p.role || 'Citizen';

                                        const status = traitorStatus[name] || 'PENDING';
                                        const isExecuted = status === 'EXECUTED';
                                        const isPardoned = status === 'PARDONED';

                                        return (
                                            <div key={name} className={`traitor-card ${isExecuted ? 'executed' : ''} ${isPardoned ? 'pardoned' : ''}`} style={{ borderColor: '#ff8800' }}>
                                                <div className="traitor-info">
                                                    <span className="traitor-name">{name}</span>
                                                    <span className="traitor-role">{cls.toUpperCase()} AGITATOR</span>
                                                </div>
                                                <div className="action-buttons">
                                                    <button className="btn-action btn-keep" style={{ borderColor: '#4CAF50', color: '#4CAF50' }} onClick={() => {
                                                        setTraitorStatus(prev => ({ ...prev, [name]: 'PARDONED' }));
                                                        const newSet = new Set(executionTargets);
                                                        newSet.delete(name);
                                                        setExecutionTargets(newSet);
                                                    }}>IGNORE</button>

                                                    <button className="btn-action btn-kill" style={{ borderColor: '#ff3333', color: '#ff3333' }} onClick={() => {
                                                        setTraitorStatus(prev => ({ ...prev, [name]: 'EXECUTED' }));
                                                        // Trigger Shake
                                                        const container = document.getElementById('main-content');
                                                        if (container) {
                                                            container.style.animation = 'none';
                                                            void container.offsetWidth;
                                                            container.style.animation = 'shakeScreen 0.5s';
                                                        }
                                                        const newSet = new Set(executionTargets);
                                                        newSet.add(name);
                                                        setExecutionTargets(newSet);
                                                    }}>PURGE</button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {judgmentSent ? (
                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                <h2 style={{ color: '#4CAF50', fontFamily: 'Cinzel', letterSpacing: '4px' }}>JUDGMENT SENT</h2>
                                <p style={{ color: '#888' }}>The Executions will be carried out.</p>
                            </div>
                        ) : (
                            <button
                                className="btn-continue"
                                style={{ display: 'block' }}
                                onClick={() => {
                                    setJudgmentSent(true); // UI Feedback
                                    emit('GAME_MESSAGE', {
                                        type: 'EXECUTION_ORDER',
                                        targets: Array.from(executionTargets)
                                    });
                                }}
                            >
                                CONFIRM JUDGMENT
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* DEFEAT SCREEN */}
            {gameState.result && gameState.result.winner !== 'LEADER' && (
                <div className="screen-container" style={{ borderColor: '#ff0000' }}>
                    <div className="pulse-overlay"></div>
                    <div className="crack c1"></div>
                    <div className="crack c2"></div>

                    <div className="icon-dead">☠</div>
                    <div className="judgment-title" style={{ fontSize: '3rem', color: '#ff3333' }}>REGIME FALLEN</div>
                    <p className="leader-sub-header" style={{ color: '#ff3333' }}>Coup Successful</p>

                    <div className="stat-box">
                        <div className="stat">
                            <span className="stat-label">Loyalist Support</span>
                            <span className="stat-val" style={{ color: '#555' }}>{gameState.result.stats?.loyal || 0}%</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Rebel Threat</span>
                            <span className="stat-val" style={{ color: '#ff0000' }}>{gameState.result.stats?.rebel || 100}%</span>
                        </div>
                    </div>

                    <div className="defeat-msg">
                        "The Leader has been detained. A new era begins."
                    </div>
                </div>
            )}

            {!isSubmitted && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h1 className="judgment-title">SUPREME COMMANDER</h1>
                        <p className="leader-sub-header">Allocation Protocol</p>
                    </div>
                    {/* ... FORM ... */}
                    <div className="allocation-form">
                        {/* Sticky Pool Display (Now part of Grid) */}
                        <div className={`pool-display ${isOverBudget ? 'error' : ''}`}>
                            <span className="pool-label">TREASURY RESERVES</span>
                            <span className="pool-value" style={{ color: isOverBudget ? '#ff3333' : '#4CAF50' }}>
                                {poolRemaining}%
                            </span>
                        </div>

                        {/* COLUMN 1: PERSONAL */}
                        <div className="section-column">
                            <h3 className="section-title" style={{ textAlign: 'center', color: '#FFD700' }}>Personal Reserve</h3>
                            <div className="allocation-item">
                                <div className="label-row"><span>The Leader (You)</span></div>
                                <div className="control-row">
                                    <input
                                        type="range" min="0" max="100"
                                        value={allocation.personal}
                                        onChange={(e) => handleInput('personal', e.target.value)}
                                    />
                                    <input
                                        type="number" min="0" max="100"
                                        value={allocation.personal}
                                        onChange={(e) => handleInput('personal', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 2: ELITES */}
                        <div className="section-column">
                            <h3 className="section-title" style={{ textAlign: 'center', color: '#00e5ff' }}>Elite Ministries</h3>
                            {[
                                { key: 'military', label: 'Military Command' },
                                { key: 'intelligence', label: 'Intelligence Bureau' },
                                { key: 'interior', label: 'Interior Ministry' },
                                { key: 'economy', label: 'Central Bank' },
                                { key: 'media', label: 'State Media' }
                            ].map(item => (
                                <div className="allocation-item" key={item.key}>
                                    <div className="label-row"><span>{item.label}</span></div>
                                    <div className="control-row">
                                        <input
                                            type="range" min="0" max="100"
                                            value={allocation[item.key]}
                                            onChange={(e) => handleInput(item.key, e.target.value)}
                                        />
                                        <input
                                            type="number" min="0" max="100"
                                            value={allocation[item.key]}
                                            onChange={(e) => handleInput(item.key, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* COLUMN 3: CITIZENS */}
                        <div className="section-column">
                            <h3 className="section-title" style={{ textAlign: 'center', color: '#ff4444' }}>Public Classes</h3>
                            {[
                                { key: 'upper', label: 'Upper Class' },
                                { key: 'middle', label: 'Middle Class' },
                                { key: 'labor', label: 'Labor Class' }
                            ].map(item => (
                                <div className="allocation-item" key={item.key}>
                                    <div className="label-row"><span>{item.label}</span></div>
                                    <div className="control-row">
                                        <input
                                            type="range" min="0" max="100"
                                            value={allocation[item.key]}
                                            onChange={(e) => handleInput(item.key, e.target.value)}
                                        />
                                        <input
                                            type="number" min="0" max="100"
                                            value={allocation[item.key]}
                                            onChange={(e) => handleInput(item.key, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn-submit"
                            onClick={handleSubmit}
                            disabled={poolRemaining !== 0}
                            style={{
                                opacity: poolRemaining === 0 ? 1 : 0.5,
                                cursor: poolRemaining === 0 ? 'pointer' : 'not-allowed',
                                marginTop: '30px'
                            }}
                        >
                            CONFIRM BUDGET
                        </button>

                    </div>
                </>
            )}
        </div>
    );
};

export default LeaderView;
