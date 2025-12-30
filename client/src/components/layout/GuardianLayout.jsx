// client/src/components/layout/GuardianLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';
import { 
  Home, Heart, MessageSquare, Gamepad2, Image, 
  MessageCircle, Link2, Settings, FileText, Bell, AlertTriangle, Menu, X
} from 'lucide-react';

const GuardianLayout = () => {
  const { profile, logout } = useAuthStore();
  const { onAlert, onNotification } = useSocket();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [showAlertBadge, setShowAlertBadge] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  // 모바일에서 주요 네비게이션 (5개만)
  const mobileNavItems = navItems.slice(0, 5);
  // 더보기 메뉴 아이템
  const moreNavItems = navItems.slice(5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xl sm:text-2xl">🤖</span>
            <h1 className="text-lg sm:text-xl font-bold text-indigo-600">마음이음</h1>
            <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2 hidden xs:inline">보호자</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 알림 아이콘 */}
            <button 
              className="relative p-1.5 sm:p-2 text-gray-500 hover:text-indigo-600"
              onClick={() => setShowAlertBadge(false)}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {showAlertBadge && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            
            <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              {profile?.name}님
            </div>
            
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-gray-500 hover:text-red-500"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 위험 알림 배너 */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            {alerts.slice(-3).map((alert, idx) => (
              <div key={idx} className="flex items-center gap-2 text-red-700 text-xs sm:text-sm">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="line-clamp-1">{alert.message}</span>
                <span className="text-red-400 text-xs hidden sm:inline">
                  {new Date(alert.timestamp).toLocaleTimeString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24">
        <Outlet />
      </main>

      {/* 모바일 더보기 메뉴 오버레이 */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 sm:hidden" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="absolute bottom-16 right-2 bg-white rounded-xl shadow-xl p-2 min-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            {moreNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2.5 px-3 rounded-lg ${
                    isActive 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        {/* 모바일: 5개 + 더보기 버튼 */}
        <div className="sm:hidden flex justify-around items-center py-1.5 px-1">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-2 rounded-lg transition-all ${
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-gray-500'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </NavLink>
          ))}
          {/* 더보기 버튼 */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition-all ${
              showMobileMenu ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'
            }`}
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[10px] mt-0.5">더보기</span>
          </button>
        </div>

        {/* 태블릿/데스크탑: 전체 네비게이션 */}
        <div className="hidden sm:flex max-w-4xl mx-auto justify-around items-center py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
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
