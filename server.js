const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static('public'));

const rooms = new Map();

// Endpoint para cargar contenido guardado
app.get('/api/rooms/:room', async (req, res) => {
  try {
    const data = await fs.readFile(
      path.join(__dirname, 'savedContent', `${req.params.room}.json`)
    );
    const { content } = JSON.parse(data);
    res.json({ exists: true, content });
  } catch (error) {
    res.json({ exists: false, content: '' });
  }
});

// Endpoint para guardar contenido
app.post('/api/rooms/:room', async (req, res) => {
  try {
    await fs.writeFile(
      path.join(__dirname, 'savedContent', `${req.params.room}.json`),
      JSON.stringify({ content: req.body.content })
    );
    res.json({ success: true, content: req.body.content });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar' });
  }
});

io.on('connection', (socket) => {
  let currentRoom = null;
  let username = null;

  socket.on('join-room', (roomName, user) => {
    username = user;
    currentRoom = roomName;
    socket.join(roomName);

    if (!rooms.has(roomName)) {
      rooms.set(roomName, {
        content: '',
        users: new Set(),
        history: []
      });
    }

    const room = rooms.get(roomName);
    room.users.add(user);
    socket.emit('content-update', room.content);
  });

  socket.on('text-change', (delta) => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      socket.to(currentRoom).emit('text-change', delta);
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.users.delete(username);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
  fs.mkdir(path.join(__dirname, 'savedContent'), { recursive: true });
});


exports.server = server;