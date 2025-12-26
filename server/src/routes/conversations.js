const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { seniorId, limit = 50 } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const conversations = await req.prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: '대화 조회 실패' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { role, content, emotion } = req.body;
    const conversation = await req.prisma.conversation.create({
      data: { userId: req.userId, role, content, emotion }
    });
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ message: '대화 저장 실패' });
  }
});

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { seniorId, days = 7 } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const count = await req.prisma.conversation.count({ where: { userId, createdAt: { gte: since } } });
    res.json({ totalConversations: count, period: `${days} days` });
  } catch (error) {
    res.status(500).json({ message: '요약 조회 실패' });
  }
});

module.exports = router;
