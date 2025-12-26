// client/src/pages/senior/SeniorLiveChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useSocket } from '../../hooks/useSocket';
import { chatAPI, connectionAPI } from '../../lib/api';
import { Send, Users, UserPlus, MessageCircle, Search, Loader2 } from 'lucide-react';

const SeniorLiveChatPage = () => {
  const { profile } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('chat'); // chat, friends
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendCode, setFriendCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (socket && selectedRoom) {
      socket.emit('join-room', selectedRoom.id);
      
      socket.on('new-message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.emit('leave-room', selectedRoom.id);
        socket.off('new-message');
      };
    }
  }, [socket, selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 채팅방 목록
      const roomsData = await chatAPI.getRooms().catch(() => ({ rooms: [] }));
      setRooms(roomsData?.rooms || []);
      
      // 연락처 (보호자)
      const contactsData = await chatAPI.getContacts?.().catch(() => ({ contacts: [] }));
      setContacts(contactsData?.contacts || []);
      
      // 친구 목록
      const friendsData = await chatAPI.getFriends?.().catch(() => ({ friends: [] }));
      setFriends(friendsData?.friends || []);
    } catch (error) {
      console.log('데이터 로드 오류:', error);
    }
    setIsLoading(false);
  };

  const loadMessages = async (roomId) => {
    try {
      const data = await chatAPI.getMessages(roomId);
      setMessages(data?.messages || []);
    } catch (error) {
      setMessages([]);
    }
  };

  const handleSelectRoom = async (room) => {
    setSelectedRoom(room);
    await loadMessages(room.id);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRoom || !socket) return;
    
    socket.emit('chat-message', {
      roomId: selectedRoom.id,
      message: newMessage.trim()
    });
    setNewMessage('');
  };

  const handleStartChat = async (contact) => {
    try {
      const data = await chatAPI.createRoom([contact.id]);
      if (data?.room) {
        setRooms(prev => {
          if (prev.find(r => r.id === data.room.id)) return prev;
          return [data.room, ...prev];
        });
        handleSelectRoom(data.room);
      }
    } catch (error) {
      alert('채팅방 생성에 실패했습니다.');
    }
  };

  const handleAddFriend = async () => {
    if (!friendCode.trim()) return;
    
    try {
      await chatAPI.addFriend?.(friendCode.trim().toUpperCase());
      alert('친구 요청을 보냈습니다!');
      setFriendCode('');
      loadData();
    } catch (error) {
      alert('친구 추가에 실패했습니다. 코드를 확인해주세요.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 채팅방 선택된 경우 - 대화 화면
  if (selectedRoom) {
    const otherPerson = selectedRoom.participants?.find(p => p.user?.id !== profile?.id)?.user;
    
    return (
      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* 헤더 */}
        <div className="bg-white rounded-t-2xl p-4 shadow-sm flex items-center gap-3">
          <button onClick={() => setSelectedRoom(null)} className="text-gray-500">←</button>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            {otherPerson?.role === 'guardian' ? '👨‍👩‍👧' : '👴'}
          </div>
          <div>
            <h3 className="font-bold">{otherPerson?.name || '채팅'}</h3>
            <p className="text-xs text-gray-500">
              {isConnected ? '🟢 온라인' : '⚪ 오프라인'}
            </p>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              대화를 시작해보세요!
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.senderId === profile?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl ${
                  msg.senderId === profile?.id 
                    ? 'bg-indigo-500 text-white rounded-br-md' 
                    : 'bg-white shadow rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 */}
        <div className="bg-white rounded-b-2xl p-3 shadow-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-lg"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-3 bg-indigo-500 text-white rounded-xl disabled:opacity-50"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 채팅방 목록 화면
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">💬 채팅</h2>
          <p className="text-sm text-gray-500">
            {isConnected ? '🟢 연결됨' : '⚪ 연결 중...'}
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
            activeTab === 'chat' ? 'bg-indigo-500 text-white' : 'bg-gray-100'
          }`}
        >
          <MessageCircle className="w-5 h-5" /> 대화
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
            activeTab === 'friends' ? 'bg-indigo-500 text-white' : 'bg-gray-100'
          }`}
        >
          <Users className="w-5 h-5" /> 친구
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="space-y-3">
          {/* 연락처 (보호자) */}
          {contacts.length > 0 && (
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-medium text-sm text-gray-500 mb-3">👨‍👩‍👧 보호자</h3>
              <div className="space-y-2">
                {contacts.filter(c => c.relation === 'guardian').map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartChat(contact)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-xl">
                      👨‍👩‍👧
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-gray-500">보호자</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 친구 (다른 시니어) */}
          {friends.length > 0 && (
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-medium text-sm text-gray-500 mb-3">👴 친구</h3>
              <div className="space-y-2">
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => handleStartChat(friend)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                      👴
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-gray-500">친구</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 최근 대화 */}
          {rooms.length > 0 && (
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-medium text-sm text-gray-500 mb-3">💬 최근 대화</h3>
              <div className="space-y-2">
                {rooms.map(room => {
                  const otherPerson = room.participants?.find(p => p.user?.id !== profile?.id)?.user;
                  const lastMessage = room.messages?.[0];
                  
                  return (
                    <button
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                        {otherPerson?.role === 'guardian' ? '👨‍👩‍👧' : '👴'}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{otherPerson?.name || room.name || '채팅방'}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {lastMessage?.content || '대화를 시작해보세요'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {contacts.length === 0 && friends.length === 0 && rooms.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">대화 상대가 없어요</p>
              <p className="text-sm text-gray-400 mt-1">친구를 추가해보세요!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 친구 추가 */}
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> 친구 추가하기
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              다른 시니어의 연결 코드를 입력해서 친구를 추가하세요
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                placeholder="친구 코드 입력"
                className="flex-1 px-4 py-3 border rounded-xl text-center uppercase tracking-widest"
                maxLength={6}
              />
              <button
                onClick={handleAddFriend}
                disabled={friendCode.length < 6}
                className="px-4 py-3 bg-indigo-500 text-white rounded-xl disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>

          {/* 내 코드 */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <h3 className="font-medium text-indigo-700 mb-2">내 친구 코드</h3>
            <p className="text-2xl font-bold text-indigo-600 tracking-widest">
              {profile?.connectionCode || 'XXXXXX'}
            </p>
            <p className="text-sm text-indigo-500 mt-2">
              이 코드를 친구에게 알려주세요!
            </p>
          </div>

          {/* 친구 목록 */}
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-medium mb-3">내 친구 ({friends.length}명)</h3>
            {friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map(friend => (
                  <div key={friend.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                      👴
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-gray-500">친구</p>
                    </div>
                    <button
                      onClick={() => handleStartChat(friend)}
                      className="px-3 py-1 bg-indigo-500 text-white text-sm rounded-lg"
                    >
                      대화
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-400">아직 친구가 없어요</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeniorLiveChatPage;
