const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/chat.html');
});

app.get('/call', (req, res) => {
  res.sendFile(__dirname + '/public/call.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join', (room) => {
    socket.join(room);
    socket.to(room).emit('user joined', socket.id);
  });

  socket.on('chat message', (msg) => {
    io.to(msg.room).emit('chat message', msg);
  });

  socket.on('offer', (offer, room) => {
    socket.to(room).emit('offer', offer, socket.id);
  });

  socket.on('answer', (answer, room) => {
    socket.to(room).emit('answer', answer);
  });

  socket.on('candidate', (candidate, room) => {
    socket.to(room).emit('candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
