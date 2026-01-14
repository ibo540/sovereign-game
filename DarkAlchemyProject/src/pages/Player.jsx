import React, { useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { useSearchParams } from 'react-router-dom';

// Role Views
import LeaderView from '../components/LeaderView';
import EliteView from '../components/EliteView';
import CitizenView from '../components/CitizenView';

const Player = () => {
    const { gameState, joinSession, emit } = useGameEngine('player'); // Ensure emit is destructured
    const [searchParams] = useSearchParams();

    // Local Form State
    const [name, setName] = useState('');
    const [code, setCode] = useState(searchParams.get('code') || '');

    const handleJoin = (e) => {
        e.preventDefault();
        if (name && code) {
            joinSession(code.toUpperCase().trim(), name.trim());
        }
    };

    // 1. RENDER LOGIN
    if (!gameState.isJoined) {
        return (
            <div className="screen-container">
                <style>{`
                    body {
                        background: #000;
                        font-family: 'Cinzel', serif;
                    }
                    input::placeholder { color: #888; }
                `}</style>
                <h1 style={{ color: '#DC143C', fontFamily: 'Cinzel', fontSize: '2rem', marginBottom: '20px', textShadow: '0 0 10px #DC143C' }}>
                    SOVEREIGN
                </h1>

                <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                    <input
                        type="text"
                        placeholder="SESSION CODE"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid #d4af37',
                            padding: '15px',
                            color: '#fff',
                            fontFamily: 'Roboto Mono',
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            textTransform: 'uppercase',
                            outline: 'none'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="YOUR NAME"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid #fff',
                            padding: '15px',
                            color: '#fff',
                            fontFamily: 'Cinzel',
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            outline: 'none'
                        }}
                    />

                    {gameState.joinError && (
                        <div style={{ color: '#ff4444', fontFamily: 'Roboto Mono', fontSize: '0.9rem', textAlign: 'center' }}>
                            ⚠ {gameState.joinError}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-submit"
                        style={{
                            background: '#d4af37', color: '#000', border: 'none', padding: '15px',
                            fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Cinzel',
                            marginTop: '10px'
                        }}
                    >
                        ENTER SESSION
                    </button>
                </form>
            </div>
        );
    }

    // 1.5 DEATH SCREEN
    if (gameState.status === 'DEAD') {
        return (
            <div className="screen-container" style={{ background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
                <h1 style={{ color: '#ff0000', fontSize: '4rem', fontFamily: 'Cinzel Decorative', textShadow: '0 0 30px #ff0000', margin: 0 }}>
                    ELIMINATED
                </h1>
                <p style={{ color: '#888', marginTop: '20px', fontFamily: 'Cinzel', letterSpacing: '2px', maxWidth: '600px' }}>
                    Thank you for participating.
                </p>
                <p style={{ color: '#666', marginTop: '10px', fontFamily: 'Roboto Mono', fontSize: '0.9rem' }}>
                    You cannot rejoin unless a new game is started.
                </p>
            </div>
        );
    }

    // 2. RENDER WAITING / DASHBOARD
    // Enhanced Role Detection (FLAT MAP: { 'Name': 'ROLE_STRING' })
    const myName = name || gameState.myName; // Fallback
    const roles = gameState.roles || {};

    // Check local storage or gameState for name if missing? 
    // Usually name stays in state.

    let myRole = 'NONE';
    const assignedRole = roles[myName];

    if (assignedRole === 'LEADER') {
        myRole = 'LEADER';
    } else if (assignedRole && assignedRole.startsWith('ELITE')) {
        myRole = 'ELITE';
    } else if (assignedRole && (assignedRole === 'CITIZEN' || assignedRole.startsWith('CITIZEN') || assignedRole === 'PLEB')) {
        myRole = 'CITIZEN';
    }

    // Inject myName back into gameState for components to use
    const enrichedGameState = { ...gameState, myName };

    if (myRole === 'LEADER') {
        return <LeaderView gameState={enrichedGameState} emit={emit} />;
    }
    if (myRole === 'ELITE') {
        return <EliteView gameState={enrichedGameState} emit={emit} />;
    }
    if (myRole === 'CITIZEN') {
        return <CitizenView gameState={enrichedGameState} emit={emit} />;
    }

    // DEFAULT WAITING (No Role Assigned Yet)
    return (
        <div className="screen-container" style={{ textAlign: 'center' }}>
            <div className="status-ring" style={{ width: '80px', height: '80px', margin: '0 auto 30px auto' }}></div>
            <h2 style={{ color: '#d4af37', fontFamily: 'Cinzel' }}>AWAITING ASSIGNMENT</h2>
            <p style={{ color: '#888', fontFamily: 'Roboto Mono' }}>The Mandate has begun...</p>
        </div>
    );
};

export default Player;
