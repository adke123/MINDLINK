// client/src/pages/senior/SeniorMedicationPage.jsx (새로 추가)
import { useState, useEffect } from 'react';
import { medicationAPI } from '../../lib/api';
import { Pill, Check, Clock, Plus, Loader2 } from 'lucide-react';

const SeniorMedicationPage = () => {
  const [medications, setMedications] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [medsData, logsData] = await Promise.all([
        medicationAPI.getList().catch(() => ({ medications: [] })),
        medicationAPI.getTodayLogs().catch(() => ({ logs: [] }))
      ]);
      setMedications(medsData.medications || []);
      setTodayLogs(logsData.logs || []);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
    setIsLoading(false);
  };

  const handleTaken = async (medicationId) => {
    try {
      await medicationAPI.logTaken(medicationId);
      loadData();
    } catch (error) {
      alert('복용 기록에 실패했습니다.');
    }
  };

  const isTaken = (medId) => todayLogs.some(log => log.medicationId === medId && log.status === 'taken');

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">💊 복약 관리</h2><p className="text-gray-500">오늘의 약 복용 현황</p></div>
      </div>

      {medications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">등록된 약이 없어요</p>
          <p className="text-sm text-gray-400 mt-1">보호자에게 약 등록을 요청하세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.filter(m => m.isActive).map(med => (
            <div key={med.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${isTaken(med.id) ? 'border-green-500' : 'border-blue-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isTaken(med.id) ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {isTaken(med.id) ? <Check className="w-6 h-6 text-green-600" /> : <Pill className="w-6 h-6 text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{med.name}</h3>
                    <p className="text-sm text-gray-500">{med.dosage} · {med.times?.join(', ') || '매일'}</p>
                  </div>
                </div>
                {!isTaken(med.id) && (
                  <button onClick={() => handleTaken(med.id)} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium">복용 완료</button>
                )}
              </div>
              {med.notes && <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">{med.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="bg-indigo-50 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-indigo-700">
          <Clock className="w-5 h-5" />
          <span className="font-medium">복용 시간이 되면 알림을 보내드려요</span>
        </div>
      </div>
    </div>
  );
};

export default SeniorMedicationPage;
