const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let drawingHistory = [];
let connectedUsers = {}; // socket.id -> username

io.on('connection', (socket) => {
    console.log('Новый пользователь подключился');

    socket.on('setUsername', (username) => {
        connectedUsers[socket.id] = username;
        socket.broadcast.emit('userJoined', username);
        socket.emit('loadHistory', drawingHistory);
    });

    socket.on('draw', (data) => {
        drawingHistory.push(data);
        socket.broadcast.emit('draw', data);
    });

    socket.on('fill', (data) => {
        drawingHistory.push(data);
        socket.broadcast.emit('fill', data);
    });

    socket.on('clear', () => {
        drawingHistory = [];
        io.emit('clear');
    });

    socket.on('chatMessage', (data) => {
        // data = { username, message }
        io.emit('chatMessage', data);
    });

    socket.on('disconnect', () => {
        const username = connectedUsers[socket.id];
        if (username) {
            io.emit('userLeft', username);
            delete connectedUsers[socket.id];
        }
        console.log('Пользователь отключился');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
