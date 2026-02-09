// server/src/index.js
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

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ★★★ 정적 파일 서빙 설정 (매우 중요) ★★★
// 브라우저에서 http://localhost:4000/uploads/파일명 으로 접근할 수 있게 합니다.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Prisma 인스턴스를 모든 라우트에서 사용할 수 있게 설정
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// 라우터 등록
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/emotions', require('./routes/emotions'));
app.use('/api/games', require('./routes/games'));
app.use('/api/memories', require('./routes/memories')); // 수정된 메모리 라우터
app.use('/api/connections', require('./routes/connections'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/ai', require('./routes/proactiveAI')); // AI 라우터 추가

// 서버 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO 초기화
const io = initSocket(server, prisma);
app.set('io', io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Mind Link API Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`📁 Static files served from /uploads`);
});