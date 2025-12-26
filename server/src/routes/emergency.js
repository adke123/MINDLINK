// server/src/routes/emergency.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 비상 연락처 등록
router.post('/contacts', authenticate, async (req, res) => {
  try {
    const { name, phone, relationship, isPrimary } = req.body;

    // 주 연락처로 설정 시 기존 주 연락처 해제
    if (isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: { userId: req.user.id, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        userId: req.user.id,
        name,
        phone,
        relationship,
        isPrimary: isPrimary || false
      }
    });

    res.status(201).json({ contact });
  } catch (error) {
    console.error('비상 연락처 등록 오류:', error);
    res.status(500).json({ error: '비상 연락처 등록 중 오류가 발생했습니다.' });
  }
});

// 비상 연락처 목록 조회
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const { userId } = req.query;
    const targetUserId = userId || req.user.id;

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: targetUserId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }]
    });

    res.json({ contacts });
  } catch (error) {
    console.error('비상 연락처 조회 오류:', error);
    res.status(500).json({ error: '비상 연락처 조회 중 오류가 발생했습니다.' });
  }
});

// 비상 연락처 수정
router.put('/contacts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, relationship, isPrimary } = req.body;

    const contact = await prisma.emergencyContact.findUnique({
      where: { id }
    });

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: '연락처를 찾을 수 없습니다.' });
    }

    // 주 연락처로 설정 시 기존 주 연락처 해제
    if (isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: { userId: req.user.id, isPrimary: true, id: { not: id } },
        data: { isPrimary: false }
      });
    }

    const updated = await prisma.emergencyContact.update({
      where: { id },
      data: { name, phone, relationship, isPrimary }
    });

    res.json({ contact: updated });
  } catch (error) {
    console.error('비상 연락처 수정 오류:', error);
    res.status(500).json({ error: '비상 연락처 수정 중 오류가 발생했습니다.' });
  }
});

// 비상 연락처 삭제
router.delete('/contacts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.emergencyContact.findUnique({
      where: { id }
    });

    if (!contact || contact.userId !== req.user.id) {
      return res.status(404).json({ error: '연락처를 찾을 수 없습니다.' });
    }

    await prisma.emergencyContact.delete({
      where: { id }
    });

    res.json({ message: '연락처가 삭제되었습니다.' });
  } catch (error) {
    console.error('비상 연락처 삭제 오류:', error);
    res.status(500).json({ error: '비상 연락처 삭제 중 오류가 발생했습니다.' });
  }
});

// 🚨 비상 호출 (SOS)
router.post('/sos', authenticate, async (req, res) => {
  try {
    const { message, location } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, phone: true, address: true }
    });

    // 비상 연락처 조회
    const emergencyContacts = await prisma.emergencyContact.findMany({
      where: { userId: req.user.id },
      orderBy: { isPrimary: 'desc' }
    });

    // 연결된 보호자 조회
    const connections = await prisma.connection.findMany({
      where: { seniorId: req.user.id, status: 'accepted' },
      include: {
        guardian: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    // 모든 보호자에게 비상 알림 전송
    const notificationPromises = connections.map(conn => {
      if (conn.guardianId) {
        return prisma.notification.create({
          data: {
            fromUserId: req.user.id,
            toUserId: conn.guardianId,
            type: 'emergency',
            title: '🚨 비상 호출',
            message: `${user.name}님이 비상 호출을 보냈습니다!${message ? ` 메시지: ${message}` : ''}`,
            data: {
              seniorInfo: user,
              location,
              emergencyContacts,
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    });

    await Promise.all(notificationPromises.filter(Boolean));

    // TODO: 실제 서비스에서는 SMS, 전화 등 추가 알림 연동
    // await sendEmergencySMS(emergencyContacts, user, message);
    // await makeEmergencyCall(emergencyContacts[0]?.phone);

    res.json({
      message: '비상 호출이 전송되었습니다.',
      notifiedGuardians: connections.length,
      emergencyContacts: emergencyContacts.length
    });
  } catch (error) {
    console.error('비상 호출 오류:', error);
    res.status(500).json({ error: '비상 호출 중 오류가 발생했습니다.' });
  }
});

// 비상 호출 기록 조회 (보호자용)
router.get('/history', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let where;
    if (req.user.role === 'guardian') {
      where = {
        toUserId: req.user.id,
        type: 'emergency',
        createdAt: { gte: startDate }
      };
    } else {
      where = {
        fromUserId: req.user.id,
        type: 'emergency',
        createdAt: { gte: startDate }
      };
    }

    const emergencies = await prisma.notification.findMany({
      where,
      include: {
        fromUser: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ emergencies });
  } catch (error) {
    console.error('비상 기록 조회 오류:', error);
    res.status(500).json({ error: '비상 기록 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
