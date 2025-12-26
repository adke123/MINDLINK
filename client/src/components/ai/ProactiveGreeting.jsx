// client/src/components/ai/ProactiveGreeting.jsx
// 능동적 AI 인사 팝업 컴포넌트

import { useState, useEffect } from 'react';
import { X, MessageCircle, Heart, AlertCircle } from 'lucide-react';

const ProactiveGreeting = ({ greeting, onClose, onStartChat }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 애니메이션을 위해 약간의 딜레이 후 표시
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!greeting) return null;

  const getIcon = () => {
    switch (greeting.type) {
      case 'emotion_based':
        return greeting.urgency === 'high' 
          ? <AlertCircle className="w-8 h-8 text-orange-500" />
          : <Heart className="w-8 h-8 text-pink-500" />;
      case 'inactivity':
        return <span className="text-3xl">👋</span>;
      case 'time_greeting':
        return <span className="text-3xl">
          {greeting.timeOfDay === 'morning' ? '🌅' : 
           greeting.timeOfDay === 'afternoon' ? '☀️' : '🌙'}
        </span>;
      default:
        return <MessageCircle className="w-8 h-8 text-indigo-500" />;
    }
  };

  const getBackgroundColor = () => {
    if (greeting.urgency === 'high') return 'bg-orange-50 border-orange-200';
    if (greeting.type === 'emotion_based') return 'bg-pink-50 border-pink-200';
    if (greeting.type === 'inactivity') return 'bg-blue-50 border-blue-200';
    return 'bg-indigo-50 border-indigo-200';
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 
      transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
      />

      {/* 팝업 카드 */}
      <div className={`relative w-full max-w-sm transform transition-all duration-300
        ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}
        ${getBackgroundColor()} border-2 rounded-2xl shadow-xl p-6`}>
        
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* AI 아바타 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
            {getIcon()}
          </div>

          {/* 메시지 */}
          <p className="text-lg font-medium text-gray-800 mb-2">
            {greeting.message}
          </p>

          {/* 부가 정보 */}
          {greeting.type === 'inactivity' && greeting.daysSinceActivity && (
            <p className="text-sm text-gray-500 mb-4">
              {greeting.daysSinceActivity}일 만이에요!
            </p>
          )}

          {greeting.type === 'emotion_based' && greeting.emotion && (
            <p className="text-sm text-gray-500 mb-4">
              {greeting.urgency === 'high' 
                ? '요즘 힘든 일이 있으셨나 봐요...'
                : '오늘 기분이 어떠세요?'}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={handleClose}
              className="flex-1 py-3 bg-white rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition"
            >
              나중에
            </button>
            <button
              onClick={() => {
                handleClose();
                onStartChat?.();
              }}
              className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              대화하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProactiveGreeting;
