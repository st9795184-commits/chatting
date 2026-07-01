const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let messages = [];
let users = [];

io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // Send chat history
    socket.emit('previous-messages', messages);

    // New user joins
    socket.on('user-join', (username) => {
        socket.username = username;
        users.push({ id: socket.id, username });
        io.emit('user-list', users);
        io.emit('system-message', `${username} joined the chat`);
    });

    // Send message
    socket.on('send-message', (data) => {
        const messageData = {
            id: Date.now(),
            username: data.username,
            message: data.message,
            replyTo: data.replyTo || null,
            timestamp: new Date().toISOString(),
            type: 'text'
        };
        messages.push(messageData);
        io.emit('receive-message', messageData);
    });

    // Voice message
    socket.on('voice-message', (data) => {
        const voiceData = {
            id: Date.now(),
            username: data.username,
            audio: data.audio,
            timestamp: new Date().toISOString(),
            type: 'voice'
        };
        messages.push(voiceData);
        io.emit('receive-voice', voiceData);
    });

    // User typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('user-typing', { username: data.username });
    });

    socket.on('stop-typing', () => {
        socket.broadcast.emit('user-stopped-typing');
    });

    // User disconnects
    socket.on('disconnect', () => {
        console.log('🔴 User disconnected:', socket.id);
        users = users.filter(u => u.id !== socket.id);
        io.emit('user-list', users);
        if (socket.username) {
            io.emit('system-message', `${socket.username} left the chat`);
        }
    });
});

server.listen(3000, () => {
    console.log('💬 Chat server running on http://localhost:3000');
});
