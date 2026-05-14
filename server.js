const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let drawingHistory = [];
let connectedUsers = {};

io.on('connection', (socket) => {
    console.log('Новый пользователь подключился');

    socket.on('setUsername', (username) => {
        if (connectedUsers[socket.id]) return;
        connectedUsers[socket.id] = { username };
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

    socket.on('undo', () => {
        if (drawingHistory.length > 0) {
            drawingHistory.pop();
            io.emit('loadHistory', drawingHistory);
        }
    });

    socket.on('chatMessage', (data) => {
        io.emit('chatMessage', data);
    });

    socket.on('disconnect', () => {
        const user = connectedUsers[socket.id];
        if (user) {
            io.emit('userLeft', user.username);
            delete connectedUsers[socket.id];
        }
        console.log('Пользователь отключился');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
