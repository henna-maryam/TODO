const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const userRoute = require('./routes/userRoute');
const todoRoute = require('./routes/todoRoute');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Make io accessible to routes
app.set('io', io);

// Store online users
const onlineUsers = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', userRoute);
app.use('/api/todos', todoRoute);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle user joining
    socket.on('join', ({ username }) => {
        onlineUsers.set(socket.id, { id: socket.id, username });
        // Broadcast updated user list to all clients
        io.emit('userList', Array.from(onlineUsers.values()));
        console.log(`${username} joined`);
    });

    // Handle user leaving
    socket.on('leave', ({ username }) => {
        onlineUsers.delete(socket.id);
        // Broadcast updated user list to all clients
        io.emit('userList', Array.from(onlineUsers.values()));
        console.log(`${username} left`);
    });

    socket.on('disconnect', () => {
        const user = onlineUsers.get(socket.id);
        if (user) {
            onlineUsers.delete(socket.id);
            // Broadcast updated user list to all clients
            io.emit('userList', Array.from(onlineUsers.values()));
            console.log(`${user.username} disconnected`);
        }
    });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});