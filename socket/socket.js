const {Server}= require('socket.io');
const express = require('express');
const http = require('http');
const userSocketMap = {};
const getRecieverSocketId =(recieverId)=>userSocketMap[recieverId];
    



const app = express();
const server = http.createServer(app);

const io = new Server(server, {
        cors: {
        origin: 'https://bond-spheree.vercel.app',
            methods: ['GET', 'POST']
        }
    })

    
    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            userSocketMap[userId] = socket.id;
            console.log(`User connected: userId = ${userId}, SocketId=${socket.id}`);
        }

        io.emit('getOnlineUsers', Object.keys(userSocketMap));

        socket.on('disconnection', () => {
            if (userId) {
                console.log(`User connected: UserId = ${userId}, SocketId=${socket.id}`);
                delete userSocketMap[userId];
            }
            io.emit('getOnlineUsers', Object.keys(userSocketMap));
        });

    })
    
    
   

module.exports = { getRecieverSocketId,io,app,server };




