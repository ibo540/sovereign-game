const io = require('socket.io-client');

// Connect 7 clients to ensure 6 players + 1 backup
const CLIENT_COUNT = 7;
const clients = [];
const SESSION_CODE = process.argv[2] || ''; // Pass code as arg

if (!SESSION_CODE) {
    console.error("Please provide session code: node sim_players.js <CODE>");
    process.exit(1);
}

console.log(`🚀 Starting ${CLIENT_COUNT} bots for session: ${SESSION_CODE}`);

for (let i = 0; i < CLIENT_COUNT; i++) {
    const socket = io('https://dark-alchemy-server.onrender.com');
    const name = `SimBot_${i}`;
    clients.push(socket);

    socket.on('connect', () => {
        console.log(`[${name}] Connected! Joining...`);
        socket.emit('JOIN_SESSION', { code: SESSION_CODE, name });
    });

    socket.on('GAME_MESSAGE', (msg) => {
        if (msg.type === 'ROLES_ASSIGNED') {
            const role = msg.roles[name];
            console.log(`[${name}] Role Assigned: ${role}`);

            if (role === 'LEADER') {
                console.log(`[${name}] 👑 I AM THE LEADER! WAITING TO SUBMIT Allocation...`);
                setTimeout(() => {
                    const allocation = {
                        personal: 10,
                        military: 20,
                        intelligence: 10,
                        interior: 10,
                        economy: 20,
                        media: 10,
                        upper: 10,
                        middle: 5,
                        labor: 5
                    };
                    console.log(`[${name}] 💰 Submitting Allocation...`);
                    socket.emit('GAME_MESSAGE', {
                        type: 'ALLOCATION_SUBMIT',
                        allocation
                    });
                }, 5000);
            }
        }
        if (msg.type === 'ALLOCATION_SUBMIT') {
            console.log(`[${name}] Received Allocation Update! Sync Works for me.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[${name}] Disconnected.`);
    });
}
