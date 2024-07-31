const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (room) => {
    socket.join(room);
    socket.to(room).emit('user joined', socket.id);
  });

  socket.on('offer', (offer, room) => {
    socket.to(room).emit('offer', offer, socket.id);
  });

  socket.on('answer', (answer, room) => {
    socket.to(room).emit('answer', answer, socket.id);
  });

  socket.on('candidate', (candidate, room) => {
    socket.to(room).emit('candidate', candidate, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
