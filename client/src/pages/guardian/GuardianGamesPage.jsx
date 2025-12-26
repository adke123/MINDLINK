import { useState, useEffect } from 'react';
import { gamesAPI, connectionAPI } from '../../lib/api';
import { Gamepad2, Trophy, Clock, Loader2 } from 'lucide-react';

const GuardianGamesPage = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const seniorData = await connectionAPI.getConnectedSenior();
      if (seniorData?.senior) {
        const [historyData, statsData] = await Promise.all([
          gamesAPI.getHistory(seniorData.senior.id, 30),
          gamesAPI.getStats(seniorData.senior.id)
        ]);
        setHistory(historyData.games || []);
        setStats(statsData);
      }
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const gameNames = { memory: '카드 짝 맞추기', calculation: '암산 게임', initial: '초성 퀴즈', number: '숫자 기억' };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🎮 게임 기록</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm"><Trophy className="w-8 h-8 text-yellow-500 mb-2" /><p className="text-2xl font-bold">{stats?.totalGames || 0}</p><p className="text-sm text-gray-500">총 게임 수</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm"><Clock className="w-8 h-8 text-blue-500 mb-2" /><p className="text-2xl font-bold">{stats?.totalTime || 0}분</p><p className="text-sm text-gray-500">총 플레이 시간</p></div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold mb-4">최근 기록</h3>
        {history.length === 0 ? <p className="text-gray-400 text-center py-8">게임 기록이 없습니다</p> : (
          <div className="space-y-3">
            {history.slice(0, 10).map((g, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div><p className="font-medium">{gameNames[g.gameType] || g.gameType}</p><p className="text-xs text-gray-400">{new Date(g.createdAt).toLocaleDateString()}</p></div>
                <div className="text-right"><p className="font-bold text-indigo-600">{g.score}점</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardianGamesPage;
