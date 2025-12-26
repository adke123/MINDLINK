import { useState, useEffect } from 'react';
import { reportAPI, connectionAPI } from '../../lib/api';
import { FileText, TrendingUp, Heart, Brain, Loader2 } from 'lucide-react';

const GuardianReportPage = () => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => { loadReport(); }, [period]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const seniorData = await connectionAPI.getConnectedSenior();
      if (seniorData?.senior) {
        const data = period === 'weekly' 
          ? await reportAPI.getWeeklyReport(seniorData.senior.id)
          : await reportAPI.getMonthlyReport(seniorData.senior.id);
        setReport(data);
      }
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📊 리포트</h2>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('weekly')} className={`px-4 py-2 rounded-lg ${period === 'weekly' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>주간</button>
          <button onClick={() => setPeriod('monthly')} className={`px-4 py-2 rounded-lg ${period === 'monthly' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>월간</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <Heart className="w-8 h-8 text-pink-500 mb-2" />
          <p className="text-2xl font-bold">{report?.emotionScore || 0}%</p>
          <p className="text-sm text-gray-500">긍정 감정 비율</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <Brain className="w-8 h-8 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{report?.cognitiveScore || 0}점</p>
          <p className="text-sm text-gray-500">인지 활동 점수</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold mb-4">종합 분석</h3>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-xl">
            <h4 className="font-medium text-green-700">😊 긍정적인 점</h4>
            <p className="text-sm text-green-600 mt-1">{report?.positiveNote || '규칙적인 대화 활동을 하고 있습니다.'}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <h4 className="font-medium text-amber-700">⚠️ 주의할 점</h4>
            <p className="text-sm text-amber-600 mt-1">{report?.warningNote || '특별한 주의사항이 없습니다.'}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <h4 className="font-medium text-blue-700">💡 권장 사항</h4>
            <p className="text-sm text-blue-600 mt-1">{report?.recommendation || '지속적인 대화와 게임 활동을 권장합니다.'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold mb-4">활동 요약</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">총 대화 횟수</span>
            <span className="font-bold">{report?.totalConversations || 0}회</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">게임 플레이</span>
            <span className="font-bold">{report?.totalGames || 0}회</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">평균 대화 시간</span>
            <span className="font-bold">{report?.avgConversationTime || 0}분</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianReportPage;