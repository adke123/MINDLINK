// server/src/index.js에 추가할 내용

// 라우트 import에 추가
const proactiveAIRoutes = require('./routes/proactiveAI');

// 라우트 등록에 추가
app.use('/api/ai', proactiveAIRoutes);

// ============================================
// 스케줄러 설정 (선택사항)
// 매일 오전 9시에 배치 분석 실행
// ============================================

// node-cron 설치 필요: npm install node-cron
// const cron = require('node-cron');
// const proactiveAI = require('./services/proactiveAI');

// cron.schedule('0 9 * * *', async () => {
//   console.log('🤖 능동적 AI 배치 분석 시작 (09:00)');
//   await proactiveAI.runBatchAnalysis();
// });

// cron.schedule('0 19 * * *', async () => {
//   console.log('🤖 능동적 AI 배치 분석 시작 (19:00)');
//   await proactiveAI.runBatchAnalysis();
// });
