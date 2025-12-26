// src/pages/guardian/GuardianSettingsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { connectionAPI } from '../../lib/api';
import { User, LogOut, Users, Bell, Shield, ChevronRight } from 'lucide-react';

const GuardianSettingsPage = () => {
  const navigate = useNavigate();
  const { profile, logout } = useAuthStore();
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      // ★★★ 수정: getList → getConnections ★★★
      const data = await connectionAPI.getConnections();
      setConnections(data?.connections || []);
    } catch (error) {
      console.log('연결 목록 로드 스킵');
      setConnections([]);
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠어요?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">⚙️ 설정</h1>

      {/* 프로필 */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.name}</h2>
            <p className="text-gray-500">{profile?.email}</p>
            <span className="inline-block px-2 py-1 bg-green-100 text-green-600 rounded text-xs mt-1">보호자</span>
          </div>
        </div>
      </div>

      {/* 연결된 어르신 */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" /> 연결된 어르신
        </h3>
        {connections.filter(c => c.status === 'accepted').length > 0 ? (
          <div className="space-y-3">
            {connections.filter(c => c.status === 'accepted').map(conn => (
              <div key={conn.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl">👴</div>
                <div>
                  <p className="font-medium">{conn.senior?.name}</p>
                  <p className="text-sm text-gray-500">{conn.senior?.email}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-3">연결된 어르신이 없습니다</p>
            <button 
              onClick={() => navigate('/guardian/connect')}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm"
            >
              어르신 연결하기
            </button>
          </div>
        )}
      </div>

      {/* 설정 메뉴 */}
      <div className="bg-white rounded-xl shadow-sm divide-y">
        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <span>알림 설정</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500" />
            <span>개인정보 설정</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* 로그아웃 */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
        <LogOut className="w-5 h-5" /> 로그아웃
      </button>
    </div>
  );
};

export default GuardianSettingsPage;
