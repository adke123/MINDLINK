// client/src/pages/senior/SeniorHomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { medicationAPI, scheduleAPI } from '../../lib/api';
import { 
  MessageCircle, Gamepad2, Image, Users, 
  Pill, Calendar, Sun, Cloud, CloudRain,
  Heart, Clock, Bell, ChevronRight
} from 'lucide-react';

const SeniorHomePage = () => {
  const { profile } = useAuthStore();
  const [todayMeds, setTodayMeds] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [weather, setWeather] = useState({ temp: '--', condition: 'sunny' });

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    // ★★★ 수정: 에러를 무시하고 빈 배열 반환 ★★★
    try {
      const medsData = await medicationAPI.getTodayLogs();
      setTodayMeds(medsData?.medications || medsData?.logs || []);
    } catch (error) {
      // 에러 무시 - 빈 배열 유지
      console.log('복약 데이터 로드 스킵');
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const scheduleData = await scheduleAPI.getList(today, today);
      setTodaySchedules(scheduleData?.schedules || []);
    } catch (error) {
      // 에러 무시 - 빈 배열 유지
      console.log('일정 데이터 로드 스킵');
    }
  };

  // 시간대별 인사
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: '좋은 아침이에요!', emoji: '🌅', bg: 'from-orange-100 to-yellow-50' };
    if (hour < 18) return { text: '좋은 오후예요!', emoji: '☀️', bg: 'from-sky-100 to-blue-50' };
    return { text: '편안한 저녁이에요!', emoji: '🌙', bg: 'from-indigo-100 to-purple-50' };
  };

  const greeting = getTimeGreeting();

  // 날씨 아이콘
  const WeatherIcon = () => {
    const icons = {
      sunny: <Sun className="w-8 h-8 text-yellow-500" />,
      cloudy: <Cloud className="w-8 h-8 text-gray-500" />,
      rainy: <CloudRain className="w-8 h-8 text-blue-500" />,
    };
    return icons[weather.condition] || icons.sunny;
  };

  const quickMenus = [
    { 
      to: '/senior/chat', 
      icon: MessageCircle, 
      label: 'AI 대화', 
      desc: '마음이와 대화해요',
      color: 'bg-indigo-500',
      emoji: '🤖'
    },
    { 
      to: '/senior/games', 
      icon: Gamepad2, 
      label: '두뇌 게임', 
      desc: '재미있게 운동해요',
      color: 'bg-green-500',
      emoji: '🧩'
    },
    { 
      to: '/senior/live-chat', 
      icon: Users, 
      label: '가족 채팅', 
      desc: '가족과 대화해요',
      color: 'bg-pink-500',
      emoji: '👨‍👩‍👧'
    },
    { 
      to: '/senior/memory', 
      icon: Image, 
      label: '추억 앨범', 
      desc: '소중한 추억들',
      color: 'bg-amber-500',
      emoji: '📸'
    },
  ];

  return (
    <div className="space-y-6">
      {/* 인사 카드 */}
      <div className={`bg-gradient-to-r ${greeting.bg} rounded-3xl p-6 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl mb-2">{greeting.emoji}</p>
            <h2 className="text-2xl font-bold text-gray-800">
              {profile?.name}님,
            </h2>
            <p className="text-xl text-gray-600">{greeting.text}</p>
          </div>
          <div className="text-center">
            <WeatherIcon />
            <p className="text-lg font-medium text-gray-700 mt-1">
              {weather.temp}°
            </p>
          </div>
        </div>
      </div>

      {/* 오늘의 복약 알림 - 데이터 있을 때만 표시 */}
      {todayMeds.length > 0 && (
        <Link to="/senior/medication" className="block">
          <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Pill className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">오늘의 복약</p>
                  <p className="text-sm text-gray-500">
                    {todayMeds.filter(m => !m.taken).length}개 복용 예정
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </Link>
      )}

      {/* 오늘의 일정 - 데이터 있을 때만 표시 */}
      {todaySchedules.length > 0 && (
        <Link to="/senior/schedule" className="block">
          <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">오늘의 일정</p>
                  <p className="text-sm text-gray-500">
                    {todaySchedules[0]?.title || '일정이 있어요'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </Link>
      )}

      {/* 빠른 메뉴 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">무엇을 할까요?</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickMenus.map((menu) => (
            <Link
              key={menu.to}
              to={menu.to}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className="text-3xl mb-3">{menu.emoji}</div>
              <h4 className="font-bold text-gray-800 text-lg">{menu.label}</h4>
              <p className="text-sm text-gray-500 mt-1">{menu.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* 마음이 메시지 */}
      <div className="bg-indigo-50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🤖</div>
          <div>
            <p className="font-medium text-indigo-800">마음이가 기다리고 있어요!</p>
            <p className="text-sm text-indigo-600 mt-1">
              오늘 하루 어떠셨는지 이야기해주세요. 
              마음이가 항상 곁에 있을게요. 💜
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeniorHomePage;
