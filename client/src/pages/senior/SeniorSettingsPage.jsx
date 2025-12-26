// client/src/pages/senior/SeniorSettingsPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { User, Phone, Key, Bell, Volume2, LogOut, Copy, Check } from 'lucide-react';

const SeniorSettingsPage = () => {
  const { profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠어요?')) {
      logout();
      navigate('/login');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(profile?.connectionCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ 설정</h2>

      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
            {profile?.name?.[0] || '👤'}
          </div>
          <div>
            <h3 className="text-xl font-bold">{profile?.name}</h3>
            <p className="text-gray-500">{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 rounded-2xl p-5">
        <p className="text-sm text-indigo-600 font-medium mb-2">보호자 연결 코드</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-indigo-700">{profile?.connectionCode || 'XXXXXX'}</span>
          <button onClick={copyCode} className="p-2 bg-white rounded-lg">
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
          </button>
        </div>
        <p className="text-xs text-indigo-500 mt-2">이 코드를 보호자에게 알려주세요</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm divide-y">
        <button className="w-full p-4 flex items-center gap-3 text-left">
          <User className="w-5 h-5 text-gray-400" /><span>내 정보 수정</span>
        </button>
        <button className="w-full p-4 flex items-center gap-3 text-left">
          <Bell className="w-5 h-5 text-gray-400" /><span>알림 설정</span>
        </button>
        <button className="w-full p-4 flex items-center gap-3 text-left">
          <Volume2 className="w-5 h-5 text-gray-400" /><span>음성 설정</span>
        </button>
      </div>

      <button onClick={handleLogout} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-2 font-medium">
        <LogOut className="w-5 h-5" />로그아웃
      </button>
    </div>
  );
};

export default SeniorSettingsPage;
