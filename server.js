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
    
    // Генерируем случайное имя
    const username = `User_${Math.floor(Math.random() * 10000)}`;
    connectedUsers[socket.id] = username;
    
    // Отправляем историю рисования новому пользователю
    socket.emit('loadHistory', drawingHistory);
    
    // Сообщаем всем о новом участнике
    socket.broadcast.emit('userJoined', username);
    
    // Обработка событий рисования
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
    
    // Чат
    socket.on('chatMessage', (msg) => {
        const user = connectedUsers[socket.id];
        io.emit('chatMessage', { username: user, message: msg });
    });
    
    socket.on('disconnect', () => {
        const user = connectedUsers[socket.id];
        if (user) {
            io.emit('userLeft', user);
            delete connectedUsers[socket.id];
        }
        console.log('Пользователь отключился');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
