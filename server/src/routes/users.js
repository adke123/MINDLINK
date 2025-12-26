// server/src/routes/users.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 프로필 수정
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, birthDate, address, profileImage } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        phone,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        address,
        profileImage
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        birthDate: true,
        address: true,
        profileImage: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    res.status(500).json({ error: '프로필 수정 중 오류가 발생했습니다.' });
  }
});

// 활동 시간 업데이트
router.post('/heartbeat', authenticate, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastActiveAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('활동 시간 업데이트 오류:', error);
    res.status(500).json({ error: '업데이트 실패' });
  }
});

module.exports = router;
