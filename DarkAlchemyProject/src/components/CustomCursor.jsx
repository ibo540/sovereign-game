import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

const CustomCursor = () => {
    const cursorRef = useRef(null);
    const cursorDotRef = useRef(null);
    const mouseParams = useRef({ x: -100, y: -100, targetX: -100, targetY: -100 });
    const [mounted, setMounted] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        // Detect if device is primarily a mobile/tablet (not a laptop with touchscreen)
        // We check for: small screen OR primary input is coarse (finger/stylus) AND no hover
        const checkTouchDevice = () => {
            // Check if primary input is coarse (finger/stylus) - this indicates mobile/tablet
            const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
            const hasNoHover = window.matchMedia('(hover: none)').matches;
            
            // Check screen size - mobile devices are typically smaller
            const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
            
            // Only consider it a touch device if:
            // 1. Primary input is coarse (finger) AND no hover capability (mobile/tablet)
            // 2. OR it's a small screen device (likely mobile)
            // This excludes laptops with touchscreens (which have fine pointer + hover)
            return (hasCoarsePointer && hasNoHover) || (isSmallScreen && hasCoarsePointer);
        };

        const touchDevice = checkTouchDevice();
        setIsTouchDevice(touchDevice);

        // Don't initialize custom cursor on touch devices
        if (touchDevice) {
            return;
        }

        setMounted(true);

        // 1. Inject Styles Programmatically (Failsafe)
        const styleId = 'custom-cursor-style-v2';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                /* HIDE SYSTEM CURSOR GLOBALLY (Desktop only) */
                @media (hover: hover) and (pointer: fine) {
                    * { cursor: none !important; }
                }
                
                .custom-cursor-portal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 40px;
                    height: 40px;
                    border: 2px solid #ffd700;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999999999 !important; /* ULTRA HIGH */
                    transition: width 0.2s, height 0.2s, background-color 0.2s;
                    margin-left: -20px;
                    margin-top: -20px;
                    box-shadow: 0 0 15px rgba(255, 215, 0, 0.8), inset 0 0 5px rgba(255, 215, 0, 0.5);
                    /* Hardware Acceleration */
                    transform: translate3d(-100px, -100px, 0); 
                    display: block !important;
                    opacity: 1 !important;
                }

                .cursor-dot-portal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 10px;
                    height: 10px;
                    background-color: #ffd700;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999999999 !important;
                    margin-left: -5px;
                    margin-top: -5px;
                    box-shadow: 0 0 8px #ffd700;
                    transform: translate3d(-100px, -100px, 0);
                    display: block !important;
                    opacity: 1 !important;
                }

                .custom-cursor-portal.active {
                    width: 30px;
                    height: 30px;
                    background-color: rgba(255, 215, 0, 0.4);
                }
                
                /* Hide custom cursor on touch devices */
                @media (hover: none) and (pointer: coarse) {
                    .custom-cursor-portal,
                    .cursor-dot-portal {
                        display: none !important;
                    }
                    * { cursor: auto !important; }
                }
            `;
            document.head.appendChild(style);
        }

        const onMouseMove = (e) => {
            mouseParams.current.targetX = e.clientX;
            mouseParams.current.targetY = e.clientY;

            // Force immediate update for dot to prevent lag
            if (cursorDotRef.current) {
                cursorDotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };

        const onMouseDown = () => {
            if (cursorRef.current) cursorRef.current.classList.add('active');
        };

        const onMouseUp = () => {
            if (cursorRef.current) cursorRef.current.classList.remove('active');
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);

        let rafId;
        const animate = () => {
            const { x, y, targetX, targetY } = mouseParams.current;
            // Smooth lerp for ring
            const newX = x + (targetX - x) * 0.25;
            const newY = y + (targetY - y) * 0.25;

            mouseParams.current.x = newX;
            mouseParams.current.y = newY;

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
            }

            rafId = requestAnimationFrame(animate);
        };
        rafId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            cancelAnimationFrame(rafId);
        };
    }, []);

    // Don't render custom cursor on touch devices
    if (isTouchDevice || !mounted) return null;

    return ReactDOM.createPortal(
        <>
            <div ref={cursorRef} className="custom-cursor-portal"></div>
            <div ref={cursorDotRef} className="cursor-dot-portal"></div>
        </>,
        document.body
    );
};

export default CustomCursor;
