const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/weekly', authMiddleware, async (req, res) => {
  try {
    const { seniorId } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [emotions, conversations, games] = await Promise.all([
      req.prisma.emotionLog.findMany({ where: { userId, detectedAt: { gte: since } } }),
      req.prisma.conversation.count({ where: { userId, createdAt: { gte: since } } }),
      req.prisma.gameResult.findMany({ where: { userId, createdAt: { gte: since } } })
    ]);
    
    const positiveCount = emotions.filter(e => ['happy', 'surprise'].includes(e.emotion)).length;
    const emotionScore = emotions.length ? Math.round(positiveCount / emotions.length * 100) : 50;
    const cognitiveScore = games.length ? Math.round(games.reduce((s, g) => s + g.score, 0) / games.length) : 0;
    
    res.json({
      emotionScore,
      cognitiveScore,
      totalConversations: conversations,
      totalGames: games.length,
      positiveNote: emotionScore > 50 ? '긍정적인 감정 상태를 유지하고 있습니다' : '감정 변화에 주의가 필요합니다',
      warningNote: emotionScore < 30 ? '부정적 감정이 자주 감지되었습니다' : '특별한 주의사항이 없습니다',
      recommendation: '지속적인 대화와 게임 활동을 권장합니다'
    });
  } catch (error) {
    res.status(500).json({ message: '리포트 조회 실패' });
  }
});

router.get('/monthly', authMiddleware, async (req, res) => {
  try {
    const { seniorId } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [emotions, conversations, games] = await Promise.all([
      req.prisma.emotionLog.findMany({ where: { userId, detectedAt: { gte: since } } }),
      req.prisma.conversation.count({ where: { userId, createdAt: { gte: since } } }),
      req.prisma.gameResult.findMany({ where: { userId, createdAt: { gte: since } } })
    ]);
    
    const positiveCount = emotions.filter(e => ['happy', 'surprise'].includes(e.emotion)).length;
    const emotionScore = emotions.length ? Math.round(positiveCount / emotions.length * 100) : 50;
    const cognitiveScore = games.length ? Math.round(games.reduce((s, g) => s + g.score, 0) / games.length) : 0;
    
    res.json({ emotionScore, cognitiveScore, totalConversations: conversations, totalGames: games.length });
  } catch (error) {
    res.status(500).json({ message: '리포트 조회 실패' });
  }
});

module.exports = router;
