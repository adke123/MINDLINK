// src/pages/guardian/GuardianConnectPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectionAPI } from '../../lib/api';
import { Link } from 'lucide-react';

const GuardianConnectPage = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    setIsLoading(true);
    setError('');

    try {
      // ★★★ 수정: acceptInvite → requestConnection ★★★
      await connectionAPI.requestConnection(inviteCode.trim().toUpperCase());
      alert('연결되었습니다!');
      navigate('/guardian');
    } catch (e) {
      setError(e.message || '연결에 실패했습니다. 코드를 확인해주세요.');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Link className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold">어르신과 연결하기</h1>
        <p className="text-gray-500 mt-2">어르신이 생성한 초대 코드를 입력하세요</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">초대 코드</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="w-full px-4 py-3 border rounded-xl text-center text-2xl tracking-widest uppercase"
              maxLength={6}
            />
          </div>
          <button type="submit" disabled={isLoading || inviteCode.length < 6}
            className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50">
            {isLoading ? '연결 중...' : '연결하기'}
          </button>
        </form>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h3 className="font-medium mb-2">💡 초대 코드 받는 방법</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. 어르신이 마음이음 앱에 로그인</li>
          <li>2. 설정 → 보호자 연결</li>
          <li>3. 초대 코드 생성</li>
          <li>4. 생성된 6자리 코드를 여기에 입력</li>
        </ol>
      </div>
    </div>
  );
};

export default GuardianConnectPage;