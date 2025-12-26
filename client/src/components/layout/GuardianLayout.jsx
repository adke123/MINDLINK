// client/src/components/layout/GuardianLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';
import { 
  Home, Heart, MessageSquare, Gamepad2, Image, 
  MessageCircle, Link2, Settings, FileText, Bell, AlertTriangle 
} from 'lucide-react';

const GuardianLayout = () => {
  const { profile, logout } = useAuthStore();
  const { onAlert, onNotification } = useSocket();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [showAlertBadge, setShowAlertBadge] = useState(false);

  useEffect(() => {
    // 위험 알림 수신
    const unsubAlert = onAlert?.((alert) => {
      setAlerts(prev => [...prev, alert]);
      setShowAlertBadge(true);
      
      // 브라우저 알림
      if (Notification.permission === 'granted') {
        new Notification('⚠️ 마음이음 위험 알림', {
          body: alert.message,
          icon: '/favicon.svg'
        });
      }
    });

    // 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => unsubAlert?.();
  }, [onAlert]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/guardian', icon: Home, label: '홈', end: true },
    { to: '/guardian/emotion', icon: Heart, label: '감정' },
    { to: '/guardian/conversations', icon: MessageSquare, label: '대화' },
    { to: '/guardian/games', icon: Gamepad2, label: '게임' },
    { to: '/guardian/memory', icon: Image, label: '추억' },
    { to: '/guardian/live-chat', icon: MessageCircle, label: '채팅' },
    { to: '/guardian/report', icon: FileText, label: '리포트' },
    { to: '/guardian/connect', icon: Link2, label: '연결' },
    { to: '/guardian/settings', icon: Settings, label: '설정' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-bold text-indigo-600">마음이음</h1>
            <span className="text-sm text-gray-500 ml-2">보호자</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 알림 아이콘 */}
            <button 
              className="relative p-2 text-gray-500 hover:text-indigo-600"
              onClick={() => setShowAlertBadge(false)}
            >
              <Bell className="w-5 h-5" />
              {showAlertBadge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            
            <div className="text-sm text-gray-600">
              {profile?.name}님
            </div>
            
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 위험 알림 배너 */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {alerts.slice(-3).map((alert, idx) => (
              <div key={idx} className="flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{alert.message}</span>
                <span className="text-red-400 text-xs">
                  {new Date(alert.timestamp).toLocaleTimeString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex justify-around items-center py-2 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-2 rounded-lg transition-all min-w-[60px] ${
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-gray-500 hover:text-indigo-500'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default GuardianLayout;
