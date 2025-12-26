// server/src/routes/health.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 건강 기록 저장
router.post('/records', authenticate, async (req, res) => {
  try {
    const {
      recordDate,
      bloodPressureHigh,
      bloodPressureLow,
      heartRate,
      bloodSugar,
      weight,
      temperature,
      sleepQuality,
      painLevel,
      energyLevel,
      mood,
      notes
    } = req.body;

    const healthRecord = await prisma.healthRecord.create({
      data: {
        userId: req.user.id,
        recordDate: new Date(recordDate || new Date()),
        bloodPressureHigh,
        bloodPressureLow,
        heartRate,
        bloodSugar,
        weight,
        temperature,
        sleepQuality,
        painLevel,
        energyLevel,
        mood,
        notes
      }
    });

    // 비정상 수치 감지 시 알림
    await checkHealthAlerts(req.user.id, healthRecord);

    res.status(201).json({ healthRecord });
  } catch (error) {
    console.error('건강 기록 저장 오류:', error);
    res.status(500).json({ error: '건강 기록 저장 중 오류가 발생했습니다.' });
  }
});

// 건강 기록 조회
router.get('/records', authenticate, async (req, res) => {
  try {
    const { userId, days = 30 } = req.query;
    const targetUserId = userId || req.user.id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const records = await prisma.healthRecord.findMany({
      where: {
        userId: targetUserId,
        recordDate: { gte: startDate }
      },
      orderBy: { recordDate: 'desc' }
    });

    res.json({ records });
  } catch (error) {
    console.error('건강 기록 조회 오류:', error);
    res.status(500).json({ error: '건강 기록 조회 중 오류가 발생했습니다.' });
  }
});

// 건강 통계 및 트렌드
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { userId, days = 30 } = req.query;
    const targetUserId = userId || req.user.id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const records = await prisma.healthRecord.findMany({
      where: {
        userId: targetUserId,
        recordDate: { gte: startDate }
      },
      orderBy: { recordDate: 'asc' }
    });

    if (records.length === 0) {
      return res.json({ stats: null });
    }

    // 평균값 계산
    const stats = calculateHealthStats(records);

    // 트렌드 분석
    const trends = analyzeHealthTrends(records);

    // 건강 점수 계산
    const healthScore = calculateHealthScore(stats, records[records.length - 1]);

    res.json({
      stats,
      trends,
      healthScore,
      recordCount: records.length
    });
  } catch (error) {
    console.error('건강 통계 오류:', error);
    res.status(500).json({ error: '건강 통계 조회 중 오류가 발생했습니다.' });
  }
});

// 종합 건강 대시보드
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const { userId } = req.query;
    const targetUserId = userId || req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘의 건강 기록
    const todayRecord = await prisma.healthRecord.findFirst({
      where: {
        userId: targetUserId,
        recordDate: { gte: today }
      },
      orderBy: { recordDate: 'desc' }
    });

    // 최근 7일 기록
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekRecords = await prisma.healthRecord.findMany({
      where: {
        userId: targetUserId,
        recordDate: { gte: weekAgo }
      },
      orderBy: { recordDate: 'asc' }
    });

    // 복약 현황
    const medications = await prisma.medication.findMany({
      where: {
        userId: targetUserId,
        isActive: true
      },
      include: {
        records: {
          where: { scheduledFor: { gte: today } }
        }
      }
    });

    // 감정 기록
    const emotions = await prisma.emotionLog.findMany({
      where: {
        userId: targetUserId,
        detectedAt: { gte: weekAgo }
      }
    });

    // 건강 알림
    const alerts = generateHealthAlerts(todayRecord, weekRecords, emotions);

    res.json({
      todayRecord,
      weekRecords,
      medications,
      emotionSummary: summarizeEmotions(emotions),
      alerts,
      lastUpdated: todayRecord?.createdAt || null
    });
  } catch (error) {
    console.error('건강 대시보드 오류:', error);
    res.status(500).json({ error: '건강 대시보드 조회 중 오류가 발생했습니다.' });
  }
});

// 건강 통계 계산
function calculateHealthStats(records) {
  const validRecords = records.filter(r => r.bloodPressureHigh || r.heartRate);
  
  if (validRecords.length === 0) return null;

  const sum = (arr, key) => arr.reduce((s, r) => s + (r[key] || 0), 0);
  const avg = (arr, key) => {
    const valid = arr.filter(r => r[key] !== null);
    return valid.length > 0 ? sum(valid, key) / valid.length : null;
  };

  return {
    avgBloodPressureHigh: Math.round(avg(records, 'bloodPressureHigh')),
    avgBloodPressureLow: Math.round(avg(records, 'bloodPressureLow')),
    avgHeartRate: Math.round(avg(records, 'heartRate')),
    avgBloodSugar: avg(records, 'bloodSugar')?.toFixed(1),
    avgSleepQuality: avg(records, 'sleepQuality')?.toFixed(1),
    avgEnergyLevel: avg(records, 'energyLevel')?.toFixed(1),
    latestWeight: records[records.length - 1]?.weight
  };
}

// 건강 트렌드 분석
function analyzeHealthTrends(records) {
  if (records.length < 2) return null;

  const recent = records.slice(-7);
  const older = records.slice(0, -7);

  if (older.length === 0) return null;

  const avgRecent = (key) => {
    const valid = recent.filter(r => r[key] !== null);
    return valid.length > 0 ? valid.reduce((s, r) => s + r[key], 0) / valid.length : null;
  };

  const avgOlder = (key) => {
    const valid = older.filter(r => r[key] !== null);
    return valid.length > 0 ? valid.reduce((s, r) => s + r[key], 0) / valid.length : null;
  };

  const trend = (key) => {
    const r = avgRecent(key);
    const o = avgOlder(key);
    if (r === null || o === null) return 'stable';
    if (r > o * 1.1) return 'increasing';
    if (r < o * 0.9) return 'decreasing';
    return 'stable';
  };

  return {
    bloodPressure: trend('bloodPressureHigh'),
    heartRate: trend('heartRate'),
    sleepQuality: trend('sleepQuality'),
    energyLevel: trend('energyLevel')
  };
}

// 건강 점수 계산 (0-100)
function calculateHealthScore(stats, latestRecord) {
  if (!stats || !latestRecord) return null;

  let score = 100;
  let factors = [];

  // 혈압 체크
  if (latestRecord.bloodPressureHigh) {
    if (latestRecord.bloodPressureHigh > 140 || latestRecord.bloodPressureHigh < 90) {
      score -= 15;
      factors.push('혈압 이상');
    }
  }

  // 심박수 체크
  if (latestRecord.heartRate) {
    if (latestRecord.heartRate > 100 || latestRecord.heartRate < 50) {
      score -= 10;
      factors.push('심박수 이상');
    }
  }

  // 수면 품질
  if (latestRecord.sleepQuality && latestRecord.sleepQuality < 3) {
    score -= 10;
    factors.push('수면 품질 저하');
  }

  // 에너지 레벨
  if (latestRecord.energyLevel && latestRecord.energyLevel < 3) {
    score -= 10;
    factors.push('에너지 저하');
  }

  // 통증
  if (latestRecord.painLevel && latestRecord.painLevel > 5) {
    score -= 15;
    factors.push('통증');
  }

  return {
    score: Math.max(0, score),
    factors
  };
}

// 건강 알림 생성
function generateHealthAlerts(todayRecord, weekRecords, emotions) {
  const alerts = [];

  // 오늘 기록 없음
  if (!todayRecord) {
    alerts.push({
      type: 'info',
      message: '오늘의 건강 상태를 기록해주세요.'
    });
  }

  // 혈압 이상
  if (todayRecord?.bloodPressureHigh > 140) {
    alerts.push({
      type: 'warning',
      message: '혈압이 높습니다. 안정을 취하시고, 지속되면 의사와 상담하세요.'
    });
  }

  // 부정적 감정 많음
  const negativeEmotions = emotions.filter(e => 
    ['sad', 'angry', 'fear'].includes(e.emotion)
  );
  if (negativeEmotions.length > emotions.length * 0.5) {
    alerts.push({
      type: 'warning',
      message: '최근 부정적인 감정이 많이 감지되었습니다. 대화를 통해 마음을 나눠보세요.'
    });
  }

  return alerts;
}

// 감정 요약
function summarizeEmotions(emotions) {
  if (emotions.length === 0) return null;

  const counts = emotions.reduce((acc, e) => {
    acc[e.emotion] = (acc[e.emotion] || 0) + 1;
    return acc;
  }, {});

  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const positiveCount = emotions.filter(e => 
    ['happy', 'surprise', 'neutral'].includes(e.emotion)
  ).length;

  return {
    total: emotions.length,
    dominant: dominant[0],
    dominantCount: dominant[1],
    positiveRatio: Math.round((positiveCount / emotions.length) * 100)
  };
}

// 건강 이상 알림 체크
async function checkHealthAlerts(userId, record) {
  const alerts = [];

  if (record.bloodPressureHigh > 160 || record.bloodPressureLow > 100) {
    alerts.push('고혈압 위험');
  }

  if (record.heartRate > 120 || record.heartRate < 40) {
    alerts.push('심박수 이상');
  }

  if (record.bloodSugar > 200 || record.bloodSugar < 60) {
    alerts.push('혈당 이상');
  }

  if (alerts.length > 0) {
    const connections = await prisma.connection.findMany({
      where: { seniorId: userId, status: 'accepted' }
    });

    const senior = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    for (const conn of connections) {
      if (conn.guardianId) {
        await prisma.notification.create({
          data: {
            fromUserId: userId,
            toUserId: conn.guardianId,
            type: 'emotion_alert',
            title: '🚨 건강 이상 감지',
            message: `${senior.name}님: ${alerts.join(', ')}`,
            data: { alerts, record }
          }
        });
      }
    }
  }
}

module.exports = router;
