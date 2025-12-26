// client/src/components/layout/SeniorLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Home, MessageCircle, Users, Gamepad2, Image, Settings } from 'lucide-react';

const SeniorLayout = () => {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 시간대별 인사말
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.name || '어르신';
    
    if (hour < 6) return `${name}님, 안녕히 주무셨어요?`;
    if (hour < 12) return `${name}님, 좋은 아침이에요! ☀️`;
    if (hour < 14) return `${name}님, 점심 식사하셨어요? 🍚`;
    if (hour < 18) return `${name}님, 좋은 오후예요! 🌤️`;
    if (hour < 21) return `${name}님, 저녁 식사하셨어요? 🌙`;
    return `${name}님, 편안한 밤 되세요 🌙`;
  };

  const navItems = [
    { to: '/senior', icon: Home, label: '홈', end: true },
    { to: '/senior/chat', icon: MessageCircle, label: 'AI대화' },
    { to: '/senior/live-chat', icon: Users, label: '채팅' },
    { to: '/senior/games', icon: Gamepad2, label: '게임' },
    { to: '/senior/memory', icon: Image, label: '추억' },
    { to: '/senior/settings', icon: Settings, label: '설정' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-bold text-indigo-600">마음이음</h1>
          </div>
          <div className="text-sm text-gray-600">
            {getGreeting()}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                  isActive 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-gray-500 hover:text-indigo-500'
                }`
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default SeniorLayout;
