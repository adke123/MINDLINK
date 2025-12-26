// client/src/pages/guardian/GuardianDashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connectionAPI, emotionAPI, conversationAPI, gamesAPI } from '../../lib/api';
import { Heart, MessageSquare, Gamepad2, AlertTriangle, TrendingUp, Clock, ChevronRight, Loader2 } from 'lucide-react';

const GuardianDashboardPage = () => {
  const [senior, setSenior] = useState(null);
  const [emotionStats, setEmotionStats] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const seniorData = await connectionAPI.getConnectedSenior().catch(() => null);
      if (seniorData?.senior) {
        setSenior(seniorData.senior);
        const seniorId = seniorData.senior.id;
        const [emotions, convos] = await Promise.all([
          emotionAPI.getStats(seniorId).catch(() => null),
          conversationAPI.getList(seniorId, 5).catch(() => ({ conversations: [] }))
        ]);
        setEmotionStats(emotions);
        setRecentConversations(convos.conversations || []);
      }
    } catch (error) {
      console.error('대시보드 로드 오류:', error);
    }
    setIsLoading(false);
  };

  const getEmotionEmoji = (e) => ({ happy: '😊', sad: '😢', angry: '😠', fear: '😰', neutral: '😐' }[e] || '😐');

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  if (!senior) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold">연결된 어르신이 없습니다</h3>
        <p className="text-gray-500 mt-2">먼저 어르신과 연결해주세요</p>
        <Link to="/guardian/connect" className="inline-block mt-4 px-6 py-3 bg-indigo-500 text-white rounded-xl">연결하기</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">{senior.name?.[0] || '👤'}</div>
          <div><h2 className="text-xl font-bold">{senior.name}님</h2><p className="text-gray-500">연결됨</p></div>
          <div className="ml-auto text-right"><p className="text-sm text-gray-500">현재 감정</p><span className="text-3xl">{getEmotionEmoji(emotionStats?.currentEmotion)}</span></div>
        </div>
      </div>

      {emotionStats?.alert && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <p className="font-medium text-red-700">{emotionStats.alert.message}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link to="/guardian/emotion" className="bg-white rounded-xl p-4 shadow-sm"><Heart className="w-8 h-8 text-pink-500 mb-2" /><h4 className="font-bold">감정 분석</h4></Link>
        <Link to="/guardian/conversations" className="bg-white rounded-xl p-4 shadow-sm"><MessageSquare className="w-8 h-8 text-blue-500 mb-2" /><h4 className="font-bold">대화 기록</h4></Link>
        <Link to="/guardian/games" className="bg-white rounded-xl p-4 shadow-sm"><Gamepad2 className="w-8 h-8 text-green-500 mb-2" /><h4 className="font-bold">게임 기록</h4></Link>
        <Link to="/guardian/report" className="bg-white rounded-xl p-4 shadow-sm"><TrendingUp className="w-8 h-8 text-purple-500 mb-2" /><h4 className="font-bold">주간 리포트</h4></Link>
      </div>
    </div>
  );
};

export default GuardianDashboardPage;
