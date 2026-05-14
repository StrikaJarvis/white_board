const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Раздаём статические файлы из папки public
app.use(express.static('public'));

// Хранилище истории рисования (каждый элемент – событие рисования)
let drawingHistory = [];

// Обработка подключений
io.on('connection', (socket) => {
    console.log('Новый пользователь подключился');

    // Отправляем новому пользователю всю историю рисования
    socket.emit('loadHistory', drawingHistory);

    // Когда пользователь рисует
    socket.on('draw', (data) => {
        // Сохраняем событие в истории
        drawingHistory.push(data);
        // Рассылаем всем остальным пользователям
        socket.broadcast.emit('draw', data);
    });

    // Очистка доски
    socket.on('clear', () => {
        drawingHistory = []; // очищаем историю
        io.emit('clear');    // сообщаем всем клиентам очистить доску
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключился');
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});