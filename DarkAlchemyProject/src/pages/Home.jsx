import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            // background: 'linear-gradient(135deg, #050505 0%, #1a0505 40%, #050505 100%)', // REMOVED to show Background3D
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'Cinzel, serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Pattern Overlay (Optional - kept for texture, but lighter) */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundImage: 'radial-gradient(rgba(220, 20, 60, 0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Glowing Center Effect */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '60vw', height: '60vw',
                background: 'radial-gradient(circle, rgba(0, 0, 0, 0.4) 0%, transparent 70%)', // Darker center to read text
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{ zIndex: 10, textAlign: 'center', maxWidth: '800px', padding: '20px' }}>

                {/* TITLE */}
                <motion.h1
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    style={{
                        fontSize: '6rem',
                        fontFamily: 'Cinzel Decorative',
                        color: '#fff',
                        margin: 0,
                        letterSpacing: '10px',
                        textShadow: '0 0 30px rgba(220, 20, 60, 0.6), 0 0 60px rgba(220, 20, 60, 0.3)'
                    }}
                >
                    <span style={{ color: '#DC143C' }}>SOVEREIGN</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    style={{
                        fontSize: '1.2rem',
                        color: '#aaa',
                        letterSpacing: '4px',
                        marginTop: '10px',
                        borderBottom: '1px solid #DC143C',
                        display: 'inline-block',
                        paddingBottom: '10px',
                        marginBottom: '40px'
                    }}
                >
                    THE HIERARCHY IS ABSOLUTE
                </motion.p>

                {/* DESCRIPTION */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    style={{
                        fontSize: '1rem',
                        color: '#ddd',
                        lineHeight: '1.6',
                        fontFamily: 'Roboto Mono',
                        marginBottom: '60px',
                        maxWidth: '600px',
                        margin: '0 auto 60px auto',
                        background: 'rgba(0,0,0,0.6)', // Readability bg
                        padding: '20px',
                        borderRadius: '10px',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    A social deduction game of power, betrayal, and resource management.
                    Assume your role within the regime, secure your legacy, or burn it all to the ground.
                </motion.p>

                {/* BUTTONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>

                    {/* HOST BUTTON */}
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px #DC143C' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/host')}
                        style={{
                            background: 'linear-gradient(45deg, #8B0000, #DC143C)',
                            border: '1px solid #ff4444',
                            color: '#fff',
                            padding: '20px 60px',
                            fontSize: '1.5rem',
                            fontFamily: 'Cinzel',
                            fontWeight: 'bold',
                            letterSpacing: '4px',
                            cursor: 'pointer',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                            width: '100%',
                            maxWidth: '400px',
                            textTransform: 'uppercase'
                        }}
                    >
                        HOST MANDATE
                    </motion.button>

                    {/* JOIN BUTTON */}
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.5 }}
                        whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)', borderColor: '#fff' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/join')} // Changed to /join
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#aaa',
                            padding: '15px 40px',
                            fontSize: '1.2rem',
                            fontFamily: 'Cinzel',
                            letterSpacing: '3px',
                            cursor: 'pointer',
                            width: '100%',
                            maxWidth: '400px',
                            textTransform: 'uppercase',
                            transition: 'all 0.3s'
                        }}
                    >
                        JOIN SESSION
                    </motion.button>

                </div>

            </div>

            {/* Footer */}
            <div style={{
                position: 'absolute', bottom: '20px',
                color: '#fff', fontSize: '1rem', fontFamily: 'Cinzel', letterSpacing: '2px',
                textAlign: 'center', width: '100%',
                textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(220, 20, 60, 0.5)'
            }}>
                Designed and Developed by IBRAHIM AL-KSIBATI
            </div>

        </div>
    );
};

export default Home;
