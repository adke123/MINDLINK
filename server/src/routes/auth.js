const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role, phone, birthDate } = req.body;
    const prisma = req.prisma;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: '이미 사용 중인 이메일입니다' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const connectionCode = role === 'senior' ? generateCode() : null;

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role, phone, birthDate: birthDate ? new Date(birthDate) : null, connectionCode }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, connectionCode: user.connectionCode } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: '회원가입 실패' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const prisma = req.prisma;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다' });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, connectionCode: user.connectionCode } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '로그인 실패' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true, role: true, phone: true, connectionCode: true } });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: '사용자 정보 조회 실패' });
  }
});

module.exports = router;
