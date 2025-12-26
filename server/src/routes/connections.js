const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId || typeof userId !== 'number') {
      return res.json({ connections: [] });
    }
    
    const where = req.userRole === 'senior' 
      ? { seniorId: userId } 
      : { guardianId: userId };
      
    const connections = await req.prisma.connection.findMany({
      where,
      include: { 
        senior: { select: { id: true, name: true, email: true, connectionCode: true } }, 
        guardian: { select: { id: true, name: true, email: true } } 
      }
    });
    res.json({ connections });
  } catch (error) {
    console.error('GET /connections error:', error.message);
    res.json({ connections: [] });
  }
});

router.get('/senior', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId || typeof userId !== 'number') {
      return res.json({ senior: null });
    }

    const connection = await req.prisma.connection.findFirst({
      where: { guardianId: userId, status: 'accepted' },
      include: { senior: { select: { id: true, name: true, email: true, connectionCode: true } } }
    });
    res.json({ senior: connection?.senior || null });
  } catch (error) {
    console.error('GET /connections/senior error:', error.message);
    res.json({ senior: null });
  }
});

router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { seniorCode } = req.body;
    const guardianId = req.userId;
    
    const senior = await req.prisma.user.findUnique({ 
      where: { connectionCode: seniorCode } 
    });
    
    if (!senior) {
      return res.status(404).json({ message: '연결 코드를 찾을 수 없습니다' });
    }
    
    const existing = await req.prisma.connection.findFirst({ 
      where: { seniorId: senior.id, guardianId } 
    });
    
    if (existing) {
      return res.status(400).json({ message: '이미 연결 요청이 있습니다' });
    }
    
    const connection = await req.prisma.connection.create({
      data: { seniorId: senior.id, guardianId, status: 'accepted' }
    });
    res.json({ connection });
  } catch (error) {
    console.error('POST /connections/request error:', error.message);
    res.status(500).json({ message: '연결 요청 실패', error: error.message });
  }
});

router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const connection = await req.prisma.connection.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'accepted' }
    });
    res.json({ connection });
  } catch (error) {
    console.error('POST /connections/:id/accept error:', error.message);
    res.status(500).json({ message: '승인 실패', error: error.message });
  }
});

router.post('/:id/reject', authMiddleware, async (req, res) => {
  try {
    await req.prisma.connection.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('POST /connections/:id/reject error:', error.message);
    res.status(500).json({ message: '거절 실패', error: error.message });
  }
});

module.exports = router;
