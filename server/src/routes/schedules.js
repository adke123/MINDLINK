const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId;
    
    // userId 검증
    if (!userId || typeof userId !== 'number') {
      console.log('Invalid userId for schedules:', userId);
      return res.json({ schedules: [] });
    }

    const schedules = await req.prisma.schedule.findMany({
      where: {
        userId,
        startTime: { 
          gte: new Date(startDate), 
          lte: new Date(endDate + 'T23:59:59.999Z') 
        }
      },
      orderBy: { startTime: 'asc' }
    });
    res.json({ schedules });
  } catch (error) {
    console.error('GET /schedules error:', error.message);
    res.json({ schedules: [] }); // 에러 시 빈 배열 반환
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const schedule = await req.prisma.schedule.create({
      data: { 
        userId, 
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        startTime: new Date(req.body.startTime),
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
        reminder: req.body.reminder
      }
    });
    res.json({ schedule });
  } catch (error) {
    console.error('POST /schedules error:', error.message);
    res.status(500).json({ message: '일정 등록 실패', error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const schedule = await req.prisma.schedule.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
        reminder: req.body.reminder
      }
    });
    res.json({ schedule });
  } catch (error) {
    console.error('PUT /schedules/:id error:', error.message);
    res.status(500).json({ message: '일정 수정 실패', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await req.prisma.schedule.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /schedules/:id error:', error.message);
    res.status(500).json({ message: '일정 삭제 실패', error: error.message });
  }
});

module.exports = router;
