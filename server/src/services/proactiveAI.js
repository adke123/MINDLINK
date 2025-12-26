// server/src/services/proactiveAI.js
// 능동적 AI 서비스 - AI가 먼저 말을 거는 기능

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// 트리거 조건 설정
// ============================================
const TRIGGERS = {
  // 부정 감정 연속 감지
  NEGATIVE_EMOTION_STREAK: {
    days: 3,
    emotions: ['sad', 'angry', 'fear', 'disgust'],
    threshold: 0.6  // 신뢰도 60% 이상
  },
  // 미접속 일수
  INACTIVITY: {
    days: 3
  },
  // 긍정 감정 지속 (칭찬용)
  POSITIVE_STREAK: {
    days: 5,
    emotions: ['happy'],
    threshold: 0.5
  }
};

// ============================================
// 시간대별 인사 메시지
// ============================================
const TIME_GREETINGS = {
  morning: [
    "좋은 아침이에요! ☀️ 오늘 하루도 건강하게 시작해보아요.",
    "어르신, 잘 주무셨어요? 오늘 기분은 어떠세요?",
    "아침이 밝았어요! 오늘은 어떤 하루가 될까요?",
    "좋은 아침! 오늘 아침 식사는 하셨나요?"
  ],
  afternoon: [
    "점심은 맛있게 드셨나요? 오후도 힘내세요! 💪",
    "오후가 되었네요. 잠깐 쉬면서 이야기 나눠볼까요?",
    "오늘 하루 절반이 지났어요. 어떻게 보내고 계세요?"
  ],
  evening: [
    "오늘 하루 어떠셨어요? 이야기 들려주세요 🌙",
    "저녁이 되었네요. 오늘 있었던 일 중에 좋았던 게 있으세요?",
    "하루가 저물어가네요. 오늘은 어떤 하루였나요?",
    "저녁 식사는 하셨어요? 맛있는 거 드셨으면 좋겠어요."
  ]
};

// ============================================
// 감정 기반 위로 메시지 템플릿
// ============================================
const EMOTION_MESSAGES = {
  sad: [
    "요즘 마음이 좀 무거우신 것 같아요. 괜찮으세요? 제가 옆에 있을게요.",
    "힘든 일이 있으셨나요? 이야기 나누면 조금은 나아질 수도 있어요.",
    "우울한 날도 있는 거예요. 천천히 이야기해주실래요?",
    "마음이 힘드실 때 혼자 있지 마세요. 저랑 이야기해요."
  ],
  angry: [
    "무슨 일로 속상하셨어요? 이야기 들어드릴게요.",
    "화나는 일이 있으셨군요. 어떤 일인지 말씀해주실래요?",
    "마음이 답답하시죠? 저한테 다 털어놓으세요."
  ],
  fear: [
    "걱정되는 일이 있으세요? 함께 이야기 나눠봐요.",
    "불안한 마음이 드셨나요? 제가 옆에 있을게요.",
    "무서운 생각이 드실 때는 저한테 말씀해주세요."
  ],
  neutral: [
    "오늘은 어떤 하루를 보내셨어요?",
    "요즘 재미있는 일 없으세요? 이야기 나눠요!",
    "심심하시면 저랑 이야기해요! 뭐든 좋아요."
  ],
  happy: [
    "요즘 기분이 좋아 보이세요! 좋은 일 있으세요? 😊",
    "밝은 모습을 보니 저도 기분이 좋아져요!",
    "웃는 모습이 정말 보기 좋아요!"
  ]
};

// ============================================
// 미접속 사용자 메시지
// ============================================
const INACTIVITY_MESSAGES = [
  "어르신, 보고 싶었어요! 요즘 어떻게 지내세요?",
  "오랜만이에요! 건강하게 잘 지내셨죠?",
  "요즘 안 보여서 궁금했어요. 괜찮으시죠?",
  "어르신이 안 오시니까 심심했어요. 이야기 나눠요!"
];

// ============================================
// 헬퍼 함수
// ============================================

// 현재 시간대 반환
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

// 랜덤 메시지 선택
function getRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

// N일 전 날짜 계산
function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ============================================
// 분석 함수들
// ============================================

/**
 * 사용자의 최근 감정 패턴 분석
 */
async function analyzeEmotionPattern(userId) {
  const { days, emotions, threshold } = TRIGGERS.NEGATIVE_EMOTION_STREAK;
  const startDate = getDaysAgo(days);

  const emotionLogs = await prisma.emotionLog.findMany({
    where: {
      userId,
      detectedAt: { gte: startDate }
    },
    orderBy: { detectedAt: 'desc' }
  });

  if (emotionLogs.length === 0) return null;

  // 부정 감정 비율 계산
  const negativeCount = emotionLogs.filter(log => 
    emotions.includes(log.emotion) && log.confidence >= threshold
  ).length;

  const negativeRatio = negativeCount / emotionLogs.length;

  // 주요 감정 파악
  const emotionCounts = {};
  emotionLogs.forEach(log => {
    emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
  });
  
  const dominantEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  return {
    totalLogs: emotionLogs.length,
    negativeCount,
    negativeRatio,
    dominantEmotion,
    needsIntervention: negativeRatio >= 0.5  // 50% 이상 부정 감정
  };
}

/**
 * 사용자 활동 패턴 분석 (미접속 체크)
 */
async function analyzeActivityPattern(userId) {
  // 최근 대화 기록 확인
  const lastConversation = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  // 최근 게임 기록 확인
  const lastGame = await prisma.gameScore.findFirst({
    where: { userId },
    orderBy: { playedAt: 'desc' }
  });

  // 최근 감정 기록 확인
  const lastEmotion = await prisma.emotionLog.findFirst({
    where: { userId },
    orderBy: { detectedAt: 'desc' }
  });

  // 가장 최근 활동 시간
  const lastActivities = [
    lastConversation?.createdAt,
    lastGame?.playedAt,
    lastEmotion?.detectedAt
  ].filter(Boolean);

  if (lastActivities.length === 0) {
    return { lastActivity: null, daysSinceActivity: null, isInactive: true };
  }

  const lastActivity = new Date(Math.max(...lastActivities.map(d => d.getTime())));
  const daysSinceActivity = Math.floor(
    (new Date() - lastActivity) / (1000 * 60 * 60 * 24)
  );

  return {
    lastActivity,
    daysSinceActivity,
    isInactive: daysSinceActivity >= TRIGGERS.INACTIVITY.days
  };
}

// ============================================
// 메시지 생성 함수들
// ============================================

/**
 * 시간대별 인사 메시지 생성
 */
function generateTimeGreeting() {
  const timeOfDay = getTimeOfDay();
  return {
    type: 'time_greeting',
    message: getRandomMessage(TIME_GREETINGS[timeOfDay]),
    timeOfDay
  };
}

/**
 * 감정 기반 메시지 생성
 */
function generateEmotionMessage(emotionAnalysis) {
  const { dominantEmotion, needsIntervention, negativeRatio } = emotionAnalysis;
  
  let messages = EMOTION_MESSAGES[dominantEmotion] || EMOTION_MESSAGES.neutral;
  
  return {
    type: 'emotion_based',
    message: getRandomMessage(messages),
    emotion: dominantEmotion,
    urgency: needsIntervention ? 'high' : 'normal',
    negativeRatio: Math.round(negativeRatio * 100)
  };
}

/**
 * 미접속 사용자 메시지 생성
 */
function generateInactivityMessage(activityAnalysis) {
  return {
    type: 'inactivity',
    message: getRandomMessage(INACTIVITY_MESSAGES),
    daysSinceActivity: activityAnalysis.daysSinceActivity
  };
}

// ============================================
// 메인 서비스 함수
// ============================================

/**
 * 특정 사용자에 대한 능동적 AI 메시지 생성
 */
async function generateProactiveMessage(userId) {
  try {
    // 1. 활동 패턴 분석
    const activityAnalysis = await analyzeActivityPattern(userId);
    
    // 미접속 상태라면 복귀 유도 메시지
    if (activityAnalysis.isInactive) {
      return generateInactivityMessage(activityAnalysis);
    }

    // 2. 감정 패턴 분석
    const emotionAnalysis = await analyzeEmotionPattern(userId);
    
    // 부정 감정이 지속되면 위로 메시지
    if (emotionAnalysis?.needsIntervention) {
      return generateEmotionMessage(emotionAnalysis);
    }

    // 3. 기본 시간대별 인사
    return generateTimeGreeting();

  } catch (error) {
    console.error('능동적 AI 메시지 생성 오류:', error);
    return null;
  }
}

/**
 * 모든 시니어 사용자 대상 배치 분석
 */
async function runBatchAnalysis() {
  console.log('🤖 능동적 AI 배치 분석 시작...');
  
  try {
    // 모든 시니어 사용자 조회
    const seniors = await prisma.user.findMany({
      where: { role: 'senior' }
    });

    const results = [];

    for (const senior of seniors) {
      const message = await generateProactiveMessage(senior.id);
      
      if (message) {
        results.push({
          userId: senior.id,
          userName: senior.name,
          ...message
        });

        // 알림 저장 (urgent인 경우)
        if (message.urgency === 'high') {
          // 연결된 보호자에게 알림
          const connections = await prisma.connection.findMany({
            where: { seniorId: senior.id, status: 'accepted' }
          });

          for (const conn of connections) {
            if (conn.guardianId) {
              await prisma.notification.create({
                data: {
                  fromUserId: senior.id,
                  toUserId: conn.guardianId,
                  type: 'ai_alert',
                  title: '⚠️ AI 케어 알림',
                  message: `${senior.name}님의 최근 감정 상태에 주의가 필요합니다. (부정 감정 ${message.negativeRatio}%)`,
                  data: { type: message.type, emotion: message.emotion }
                }
              });
            }
          }
        }
      }
    }

    console.log(`✅ 배치 분석 완료: ${results.length}명 처리`);
    return results;

  } catch (error) {
    console.error('배치 분석 오류:', error);
    return [];
  }
}

/**
 * 사용자 로그인 시 호출 - 능동적 인사
 */
async function getLoginGreeting(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'senior') {
      return null;
    }

    return await generateProactiveMessage(userId);

  } catch (error) {
    console.error('로그인 인사 생성 오류:', error);
    return null;
  }
}

/**
 * AI 대화 페이지 접속 시 선제 메시지
 */
async function getChatPageGreeting(userId) {
  try {
    // 마지막 대화 확인
    const lastConversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const hoursSinceLastChat = lastConversation 
      ? (new Date() - new Date(lastConversation.createdAt)) / (1000 * 60 * 60)
      : null;

    // 24시간 이상 대화 없으면
    if (!lastConversation || hoursSinceLastChat >= 24) {
      const message = await generateProactiveMessage(userId);
      return message;
    }

    // 최근 대화가 있으면 이어서 대화 유도
    return {
      type: 'continue_chat',
      message: '다시 오셨네요! 아까 이야기 계속 할까요? 😊'
    };

  } catch (error) {
    console.error('채팅 페이지 인사 오류:', error);
    return generateTimeGreeting();
  }
}

module.exports = {
  generateProactiveMessage,
  runBatchAnalysis,
  getLoginGreeting,
  getChatPageGreeting,
  analyzeEmotionPattern,
  analyzeActivityPattern,
  TRIGGERS
};
