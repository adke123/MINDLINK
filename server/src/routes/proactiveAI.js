// server/src/routes/proactiveAI.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth'); // 기존 프로젝트의 미들웨어 파일명에 맞춤
const proactiveAI = require('../services/proactiveAI');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/ai/greeting
 * 사용자 맞춤 AI 인사 메시지 조회
 */
router.get('/greeting', authMiddleware, async (req, res) => {
  try {
    // 기존 authMiddleware는 req.userId에 ID를 저장함
    const message = await proactiveAI.getLoginGreeting(req.userId);
    
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
router.get('/chat-greeting', authMiddleware, async (req, res) => {
  try {
    const message = await proactiveAI.getChatPageGreeting(req.userId);
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
router.get('/analysis', authMiddleware, async (req, res) => {
  try {
    const emotionAnalysis = await proactiveAI.analyzeEmotionPattern(req.userId);
    const activityAnalysis = await proactiveAI.analyzeActivityPattern(req.userId);

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
router.get('/analysis/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = parseInt(userId);

    // 보호자 권한 확인 (authMiddleware가 req.userRole을 설정한다고 가정)
    if (req.userRole === 'guardian') {
      const connection = await req.prisma.connection.findFirst({
        where: {
          guardianId: req.userId,
          seniorId: targetUserId,
          status: 'accepted'
        }
      });

      if (!connection) {
        return res.status(403).json({ error: '접근 권한이 없습니다.' });
      }
    }

    const emotionAnalysis = await proactiveAI.analyzeEmotionPattern(targetUserId);
    const activityAnalysis = await proactiveAI.analyzeActivityPattern(targetUserId);
    const proactiveMessage = await proactiveAI.generateProactiveMessage(targetUserId);

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
 * 배치 분석 실행
 */
router.post('/batch-analysis', authMiddleware, async (req, res) => {
  try {
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
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const seniorCount = await req.prisma.user.count({ where: { role: 'senior' } });
    const todayEmotions = await req.prisma.emotionLog.count({
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