const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId || typeof userId !== 'number') {
      return res.json({ medications: [] });
    }

    const medications = await req.prisma.medication.findMany({
      where: { userId },
      include: { logs: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
    res.json({ medications });
  } catch (error) {
    console.error('GET /medications error:', error.message);
    res.json({ medications: [] });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const medication = await req.prisma.medication.create({ 
      data: { 
        userId,
        name: req.body.name,
        dosage: req.body.dosage,
        frequency: req.body.frequency,
        times: req.body.times || [],
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        notes: req.body.notes,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      } 
    });
    res.json({ medication });
  } catch (error) {
    console.error('POST /medications error:', error.message);
    res.status(500).json({ message: '복약 등록 실패', error: error.message });
  }
});

router.get('/today', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId || typeof userId !== 'number') {
      return res.json({ logs: [], medications: [] });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const logs = await req.prisma.medicationLog.findMany({
      where: { 
        userId, 
        scheduledFor: { gte: today } 
      },
      include: { medication: true }
    });
    
    // 활성화된 약 목록도 함께 반환
    const medications = await req.prisma.medication.findMany({
      where: { userId, isActive: true }
    });
    
    res.json({ logs, medications });
  } catch (error) {
    console.error('GET /medications/today error:', error.message);
    res.json({ logs: [], medications: [] });
  }
});

router.post('/:id/taken', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const log = await req.prisma.medicationLog.create({
      data: { 
        medicationId: parseInt(req.params.id), 
        userId, 
        scheduledFor: new Date(), 
        takenAt: new Date(), 
        status: 'taken' 
      }
    });
    res.json({ log });
  } catch (error) {
    console.error('POST /medications/:id/taken error:', error.message);
    res.status(500).json({ message: '복용 기록 실패', error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const medication = await req.prisma.medication.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name: req.body.name,
        dosage: req.body.dosage,
        frequency: req.body.frequency,
        times: req.body.times,
        notes: req.body.notes,
        isActive: req.body.isActive
      }
    });
    res.json({ medication });
  } catch (error) {
    console.error('PUT /medications/:id error:', error.message);
    res.status(500).json({ message: '수정 실패', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await req.prisma.medication.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /medications/:id error:', error.message);
    res.status(500).json({ message: '삭제 실패', error: error.message });
  }
});

module.exports = router;
