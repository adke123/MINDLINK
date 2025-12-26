import { useState, useEffect } from 'react';
import { emotionAPI, connectionAPI } from '../../lib/api';
import { Heart, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const GuardianEmotionPage = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const seniorData = await connectionAPI.getConnectedSenior();
      if (seniorData?.senior) {
        const [statsData, historyData] = await Promise.all([
          emotionAPI.getStats(seniorData.senior.id),
          emotionAPI.getHistory(seniorData.senior.id, 30)
        ]);
        setStats(statsData);
        setHistory(historyData.emotions || []);
      }
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
  const getEmotionEmoji = (e) => ({ happy: '😊', sad: '😢', angry: '😠', fear: '😰', surprise: '😮', neutral: '😐' }[e] || '😐');

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">💗 감정 분석</h2>
      
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold mb-4">최근 30일 감정 추이</h3>
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history.slice(-30)}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="positiveScore" stroke="#10b981" strokeWidth={2} name="긍정" />
              <Line type="monotone" dataKey="negativeScore" stroke="#ef4444" strokeWidth={2} name="부정" />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-gray-400 py-8">데이터가 없습니다</p>}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold mb-4">감정 분포</h3>
        <div className="grid grid-cols-3 gap-3">
          {['happy', 'neutral', 'sad', 'angry', 'fear', 'surprise'].map(emotion => (
            <div key={emotion} className="text-center p-3 bg-gray-50 rounded-xl">
              <span className="text-2xl">{getEmotionEmoji(emotion)}</span>
              <p className="text-xs text-gray-500 mt-1">{stats?.distribution?.[emotion] || 0}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuardianEmotionPage;
