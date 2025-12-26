const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const initSocket = (server, prisma) => {
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    socket.join(`user_${socket.userId}`);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('chat-message', async ({ roomId, message }) => {
      try {
        const saved = await prisma.chatMessage.create({
          data: { roomId, senderId: socket.userId, content: message },
          include: { sender: { select: { id: true, name: true } } }
        });
        io.to(roomId).emit('new-message', saved);
      } catch (err) {
        console.error('Message save error:', err);
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user-typing', { userId: socket.userId, isTyping });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = initSocket;
