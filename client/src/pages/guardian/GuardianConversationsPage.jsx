import { useState, useEffect } from 'react';
import { conversationAPI, connectionAPI } from '../../lib/api';
import { MessageSquare, Loader2 } from 'lucide-react';

const GuardianConversationsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const seniorData = await connectionAPI.getConnectedSenior();
      if (seniorData?.senior) {
        const data = await conversationAPI.getList(seniorData.senior.id, 50);
        setConversations(data.conversations || []);
      }
    } catch (error) { console.error(error); }
    setIsLoading(false);
  };

  const getEmotionEmoji = (e) => ({ happy: '😊', sad: '😢', angry: '😠', fear: '😰', neutral: '😐' }[e] || '');
  const formatTime = (t) => new Date(t).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">💬 대화 기록</h2>
      {conversations.length === 0 ? (
        <div className="text-center py-16"><MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">대화 기록이 없습니다</p></div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c, idx) => (
            <div key={idx} className={`p-4 rounded-xl ${c.role === 'user' ? 'bg-indigo-50 ml-8' : 'bg-white shadow-sm mr-8'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{c.role === 'user' ? '어르신' : '마음이'}</span>
                <span className="text-xs text-gray-400">{formatTime(c.createdAt)}</span>
              </div>
              <p className="text-gray-700">{c.content}</p>
              {c.emotion && <span className="text-sm">{getEmotionEmoji(c.emotion)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardianConversationsPage;
