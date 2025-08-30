const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  session({
    secret: 'chat-app-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './public/uploads/';
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(express.static('public'));

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/get-username', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.get('/chat', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/logout', (req, res) => {
  const username = req.session.user;
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    io.emit('user logout', username);
    res.redirect('/login');
  });
});

app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  const { username } = req.body;
  if (username && username.trim() && username.length <= 20) {
    req.session.user = username.trim();
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      res.redirect('/chat');
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/upload', isAuthenticated, upload.single('file'), (req, res) => {
  if (req.file) {
    res.json({ filename: req.file.filename });
  } else {
    res.status(400).json({ error: 'File upload failed' });
  }
});

const messages = [];
const readReceipts = {};
const connectedUsers = new Map();

io.on('connection', (socket) => {
  socket.on('register user', (username) => {
    if (username && !Array.from(connectedUsers.values()).includes(username)) {
      connectedUsers.set(socket.id, username);
      io.emit('update users', Array.from(connectedUsers.values()));
    }
  });

  socket.emit('load messages', messages);

  socket.on('chat message', (data) => {
    const msg = {
      id: Date.now(),
      user: data.user,
      content: data.content,
      timestamp: new Date().toISOString(),
      type: data.type || 'text',
      filename: data.filename || null,
    };
    messages.push(msg);
    io.emit('chat message', msg);
  });

  socket.on('typing', (user) => {
    socket.broadcast.emit('typing', user);
  });

  socket.on('read message', (msgId, username) => {
    if (!readReceipts[msgId]) readReceipts[msgId] = new Set();
    if (connectedUsers.get(socket.id) === username) {
      readReceipts[msgId].add(username);
      io.emit('read receipt', { msgId, readBy: Array.from(readReceipts[msgId]) });
    }
  });

  socket.on('delete message', (msgId, username) => {
    const index = messages.findIndex((msg) => msg.id === msgId && msg.user === username);
    if (index !== -1) {
      messages.splice(index, 1);
      io.emit('delete message', msgId);
    }
  });

  socket.on('user logout', (username) => {
    if (connectedUsers.get(socket.id) === username) {
      connectedUsers.delete(socket.id);
      for (const msgId in readReceipts) {
        readReceipts[msgId].delete(username);
        io.emit('read receipt', { msgId, readBy: Array.from(readReceipts[msgId]) });
      }
      io.emit('update users', Array.from(connectedUsers.values()));
    }
  });

  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    if (username) {
      connectedUsers.delete(socket.id);
      for (const msgId in readReceipts) {
        readReceipts[msgId].delete(username);
        io.emit('read receipt', { msgId, readBy: Array.from(readReceipts[msgId]) });
      }
      io.emit('update users', Array.from(connectedUsers.values()));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});