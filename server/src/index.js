require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const initSocket = require('./socket');

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ★★★ 정적 파일 서빙 (업로드된 이미지) ★★★
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/emotions', require('./routes/emotions'));
app.use('/api/games', require('./routes/games'));
app.use('/api/memories', require('./routes/memories'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/alerts', require('./routes/alerts'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO
const io = initSocket(server, prisma);
app.set('io', io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Mind Link API Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`📁 Static files served from /uploads`);
});
