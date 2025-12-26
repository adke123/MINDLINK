// client/src/pages/senior/SeniorSchedulePage.jsx (새로 추가)
import { useState, useEffect } from 'react';
import { scheduleAPI } from '../../lib/api';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';

const SeniorSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadSchedules(); }, [selectedDate]);

  const loadSchedules = async () => {
    try {
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);
      const data = await scheduleAPI.getList(selectedDate, endDate.toISOString().split('T')[0]);
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('일정 로드 오류:', error);
    }
    setIsLoading(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">📅 일정 관리</h2><p className="text-gray-500">이번 주 일정</p></div>

      {schedules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">예정된 일정이 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map(schedule => (
            <div key={schedule.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-green-500">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{schedule.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(schedule.startTime)} {formatTime(schedule.startTime)}</span>
                  </div>
                  {schedule.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{schedule.location}</span>
                    </div>
                  )}
                  {schedule.description && <p className="mt-2 text-sm text-gray-600">{schedule.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeniorSchedulePage;
