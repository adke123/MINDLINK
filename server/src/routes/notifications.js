const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await req.prisma.notification.findMany({
      where: { toId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { from: { select: { id: true, name: true } } }
    });
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: '알림 조회 실패' });
  }
});

router.post('/:id/read', authMiddleware, async (req, res) => {
  try {
    await req.prisma.notification.update({ where: { id: parseInt(req.params.id) }, data: { isRead: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '읽음 처리 실패' });
  }
});

module.exports = router;
