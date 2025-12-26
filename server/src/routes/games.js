const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/results', authMiddleware, async (req, res) => {
  try {
    const { gameType, score, duration, difficulty } = req.body;
    const result = await req.prisma.gameResult.create({
      data: { userId: req.userId, gameType, score, duration, difficulty }
    });
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: '결과 저장 실패' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { seniorId, limit = 20 } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const games = await req.prisma.gameResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    res.json({ games });
  } catch (error) {
    res.status(500).json({ message: '기록 조회 실패' });
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { seniorId } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const games = await req.prisma.gameResult.findMany({ where: { userId } });
    const totalGames = games.length;
    const totalTime = games.reduce((sum, g) => sum + (g.duration || 0), 0);
    const avgScore = totalGames ? Math.round(games.reduce((sum, g) => sum + g.score, 0) / totalGames) : 0;
    res.json({ totalGames, totalTime: Math.round(totalTime / 60), avgScore });
  } catch (error) {
    res.status(500).json({ message: '통계 조회 실패' });
  }
});

module.exports = router;
