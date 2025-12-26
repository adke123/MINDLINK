const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { emotion, confidence, context, emotions } = req.body;
    const log = await req.prisma.emotionLog.create({
      data: { userId: req.userId, emotion, confidence, context, emotions }
    });
    
    // 위험 감정 감지 시 알림
    if (['sad', 'fear', 'angry'].includes(emotion) && confidence > 0.7) {
      const connection = await req.prisma.connection.findFirst({ where: { seniorId: req.userId, status: 'accepted' } });
      if (connection) {
        await req.prisma.notification.create({
          data: { fromId: req.userId, toId: connection.guardianId, type: 'danger_alert', message: `어르신의 ${emotion} 감정이 감지되었습니다` }
        });
        req.app.get('io')?.to(`user_${connection.guardianId}`).emit('danger-alert', { emotion, confidence, timestamp: new Date() });
      }
    }
    res.json({ log });
  } catch (error) {
    res.status(500).json({ message: '감정 저장 실패' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { seniorId, days = 7 } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const emotions = await req.prisma.emotionLog.findMany({
      where: { userId, detectedAt: { gte: since } },
      orderBy: { detectedAt: 'desc' }
    });
    res.json({ emotions });
  } catch (error) {
    res.status(500).json({ message: '감정 기록 조회 실패' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { seniorId, days = 30 } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const emotions = await req.prisma.emotionLog.findMany({ where: { userId, detectedAt: { gte: since } } });
    
    const distribution = {};
    emotions.forEach(e => { distribution[e.emotion] = (distribution[e.emotion] || 0) + 1; });
    const total = emotions.length || 1;
    Object.keys(distribution).forEach(k => { distribution[k] = Math.round(distribution[k] / total * 100); });
    
    const current = emotions[0]?.emotion || 'neutral';
    res.json({ currentEmotion: current, distribution, total: emotions.length });
  } catch (error) {
    res.status(500).json({ message: '통계 조회 실패' });
  }
});

module.exports = router;
