// server/src/routes/proactiveAI.js
// 능동적 AI API 라우트

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const proactiveAI = require('../services/proactiveAI');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/ai/greeting
 * 사용자 맞춤 AI 인사 메시지 조회
 */
router.get('/greeting', authenticate, async (req, res) => {
  try {
    const message = await proactiveAI.getLoginGreeting(req.user.id);
    
    if (!message) {
      return res.json({ 
        greeting: null,
        message: '인사 메시지가 없습니다.'
      });
    }

    res.json({ greeting: message });

  } catch (error) {
    console.error('인사 메시지 조회 오류:', error);
    res.status(500).json({ error: '인사 메시지 조회 실패' });
  }
});

/**
 * GET /api/ai/chat-greeting
 * AI 대화 페이지 접속 시 선제 메시지
 */
router.get('/chat-greeting', authenticate, async (req, res) => {
  try {
    const message = await proactiveAI.getChatPageGreeting(req.user.id);
    res.json({ greeting: message });

  } catch (error) {
    console.error('채팅 인사 조회 오류:', error);
    res.status(500).json({ error: '채팅 인사 조회 실패' });
  }
});

/**
 * GET /api/ai/analysis
 * 현재 사용자의 감정/활동 분석 결과
 */
router.get('/analysis', authenticate, async (req, res) => {
  try {
    const emotionAnalysis = await proactiveAI.analyzeEmotionPattern(req.user.id);
    const activityAnalysis = await proactiveAI.analyzeActivityPattern(req.user.id);

    res.json({
      emotion: emotionAnalysis,
      activity: activityAnalysis,
      triggers: proactiveAI.TRIGGERS
    });

  } catch (error) {
    console.error('분석 조회 오류:', error);
    res.status(500).json({ error: '분석 조회 실패' });
  }
});

/**
 * GET /api/ai/analysis/:userId
 * 특정 사용자(시니어)의 분석 결과 - 보호자용
 */
router.get('/analysis/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // 보호자 권한 확인
    if (req.user.role === 'guardian') {
      const connection = await prisma.connection.findFirst({
        where: {
          guardianId: req.user.id,
          seniorId: userId,
          status: 'accepted'
        }
      });

      if (!connection) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }
    }

    const emotionAnalysis = await proactiveAI.analyzeEmotionPattern(userId);
    const activityAnalysis = await proactiveAI.analyzeActivityPattern(userId);
    const proactiveMessage = await proactiveAI.generateProactiveMessage(userId);

    res.json({
      emotion: emotionAnalysis,
      activity: activityAnalysis,
      suggestedMessage: proactiveMessage
    });

  } catch (error) {
    console.error('사용자 분석 조회 오류:', error);
    res.status(500).json({ error: '분석 조회 실패' });
  }
});

/**
 * POST /api/ai/batch-analysis
 * 배치 분석 실행 (관리자용 또는 스케줄러에서 호출)
 */
router.post('/batch-analysis', authenticate, async (req, res) => {
  try {
    // 관리자 권한 체크 (옵션)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ error: '관리자만 실행 가능합니다.' });
    // }

    const results = await proactiveAI.runBatchAnalysis();
    
    res.json({
      success: true,
      analyzed: results.length,
      results
    });

  } catch (error) {
    console.error('배치 분석 오류:', error);
    res.status(500).json({ error: '배치 분석 실패' });
  }
});

/**
 * GET /api/ai/status
 * 능동적 AI 시스템 상태
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const seniorCount = await prisma.user.count({ where: { role: 'senior' } });
    const todayEmotions = await prisma.emotionLog.count({
      where: {
        detectedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    });

    res.json({
      status: 'active',
      monitoredSeniors: seniorCount,
      todayEmotionLogs: todayEmotions,
      triggers: proactiveAI.TRIGGERS
    });

  } catch (error) {
    console.error('상태 조회 오류:', error);
    res.status(500).json({ error: '상태 조회 실패' });
  }
});

module.exports = router;
