// src/pages/guardian/GuardianLiveChatPage.jsx
import { useState, useEffect } from 'react';
import { chatAPI, connectionAPI } from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../stores/authStore';
import { MessageCircle, Users, ArrowLeft, Send, Plus, Loader2 } from 'lucide-react';
import ChatRoom from '../../components/chat/ChatRoom';

const GuardianLiveChatPage = () => {
  const { profile } = useAuthStore();
  const { isConnected, onMessageNotification } = useSocket();
  const [view, setView] = useState('list');
  const [rooms, setRooms] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedForGroup, setSelectedForGroup] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = onMessageNotification?.((data) => {
      loadRooms();
    });
    return unsubscribe;
  }, [onMessageNotification]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadRooms(), loadContacts()]);
    setIsLoading(false);
  };

  const loadRooms = async () => {
    try {
      const data = await chatAPI.getRooms();
      setRooms(data?.rooms || []);
    } catch (e) { 
      console.log('채팅방 로드 스킵');
      setRooms([]);
    }
  };

  const loadContacts = async () => {
    try {
      // ★★★ chatAPI.getContacts 대신 connectionAPI 사용 ★★★
      const data = await connectionAPI.getConnections();
      const seniorList = data?.connections?.filter(c => c.status === 'accepted').map(c => ({
        ...c.senior,
        relation: 'senior'
      })).filter(Boolean) || [];
      setContacts(seniorList);
    } catch (e) { 
      console.log('연락처 로드 스킵');
      setContacts([]);
    }
  };

  const startChat = async (contact) => {
    try {
      const data = await chatAPI.createRoom([contact.id]);
      if (data?.room) {
        setSelectedRoom(data.room);
        setView('chat');
        loadRooms();
      }
    } catch (e) {
      alert('채팅방 생성에 실패했습니다');
    }
  };

  const createGroupChat = async () => {
    if (selectedForGroup.length < 1) {
      alert('최소 1명 이상 선택하세요');
      return;
    }
    try {
      const data = await chatAPI.createRoom(
        selectedForGroup.map(c => c.id),
        groupName || '그룹 채팅',
        'group'
      );
      if (data?.room) {
        setSelectedRoom(data.room);
        setView('chat');
        setShowGroupModal(false);
        setSelectedForGroup([]);
        setGroupName('');
        loadRooms();
      }
    } catch (e) {
      alert('그룹 채팅방 생성에 실패했습니다');
    }
  };

  const toggleGroupMember = (contact) => {
    if (selectedForGroup.find(c => c.id === contact.id)) {
      setSelectedForGroup(prev => prev.filter(c => c.id !== contact.id));
    } else {
      setSelectedForGroup(prev => [...prev, contact]);
    }
  };

  const openRoom = (room) => {
    setSelectedRoom(room);
    setView('chat');
  };

  const getRoomName = (room) => {
    if (room.name) return room.name;
    const other = room.participants?.find(p => p.user?.id !== profile?.id);
    return other?.user?.name || '채팅방';
  };

  const getLastMessage = (room) => {
    return room.messages?.[0]?.content || '새 대화를 시작하세요';
  };

  if (view === 'chat' && selectedRoom) {
    return (
      <div className="h-[calc(100vh-180px)]">
        <button onClick={() => setView('list')} className="flex items-center gap-2 mb-4 text-gray-600">
          <ArrowLeft className="w-5 h-5" /> 뒤로가기
        </button>
        <ChatRoom room={selectedRoom} currentUserId={profile?.id} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💬 실시간 대화</h1>
          <p className="text-sm text-gray-500">
            {isConnected ? '🟢 연결됨' : '🔴 연결 중...'}
          </p>
        </div>
        <button onClick={() => setShowGroupModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl">
          <Plus className="w-4 h-4" /> 그룹 채팅
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        <button onClick={() => setView('list')}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${view === 'list' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>
          <MessageCircle className="w-5 h-5" /> 채팅
        </button>
        <button onClick={() => setView('contacts')}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${view === 'contacts' ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>
          <Users className="w-5 h-5" /> 연결된 어르신
        </button>
      </div>

      {/* 그룹 채팅 생성 모달 */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">그룹 채팅 만들기</h2>
            
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="그룹 이름 (선택)"
              className="w-full px-4 py-3 border rounded-xl mb-4"
            />

            <p className="text-sm text-gray-500 mb-2">참여자 선택</p>
            <div className="space-y-2 mb-4">
              {contacts.length === 0 ? (
                <p className="text-center py-4 text-gray-400">연결된 어르신이 없습니다</p>
              ) : (
                contacts.map(contact => (
                  <button key={contact.id} onClick={() => toggleGroupMember(contact)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 ${
                      selectedForGroup.find(c => c.id === contact.id)
                        ? 'bg-indigo-100 border-2 border-indigo-500'
                        : 'bg-gray-50'
                    }`}>
                    <span className="text-xl">👴</span>
                    <span className="flex-1 text-left">{contact.name}</span>
                    {selectedForGroup.find(c => c.id === contact.id) && (
                      <span className="text-indigo-500">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowGroupModal(false)}
                className="flex-1 py-3 bg-gray-100 rounded-xl">
                취소
              </button>
              <button onClick={createGroupChat}
                disabled={contacts.length === 0}
                className="flex-1 py-3 bg-indigo-500 text-white rounded-xl disabled:opacity-50">
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅 목록 */}
      {view === 'list' && (
        <div className="space-y-3">
          {rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>아직 대화가 없어요</p>
              <p className="text-sm mt-1">연결된 어르신과 대화를 시작해보세요!</p>
            </div>
          ) : (
            rooms.map(room => (
              <button key={room.id} onClick={() => openRoom(room)}
                className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition text-left">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                  {room.type === 'group' ? '👥' : '👴'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{getRoomName(room)}</h3>
                  <p className="text-sm text-gray-500 truncate">{getLastMessage(room)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* 연결된 어르신 */}
      {view === 'contacts' && (
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>연결된 어르신이 없어요</p>
            </div>
          ) : (
            contacts.map(contact => (
              <button key={contact.id} onClick={() => startChat(contact)}
                className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition text-left">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl">
                  👴
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{contact.name}</h3>
                  <p className="text-sm text-gray-500">어르신</p>
                </div>
                <Send className="w-5 h-5 text-indigo-500" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GuardianLiveChatPage;
