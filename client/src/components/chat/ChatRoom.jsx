// src/components/chat/ChatRoom.jsx
import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { Send, Loader2 } from 'lucide-react';

const ChatRoom = ({ room, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { 
    joinRoom, 
    leaveRoom, 
    sendMessage: socketSendMessage, 
    sendTyping, 
    onMessage, 
    onTyping,
    isConnected
  } = useSocket();

  useEffect(() => {
    if (room?.id) {
      loadMessages();
      joinRoom?.(room.id);

      return () => {
        leaveRoom?.(room.id);
      };
    }
  }, [room?.id]);

  useEffect(() => {
    const unsubscribe = onMessage?.((message) => {
      if (message.roomId === room?.id) {
        setMessages(prev => [...prev, message]);
      }
    });
    return unsubscribe;
  }, [onMessage, room?.id]);

  useEffect(() => {
    const unsubscribe = onTyping?.((data) => {
      if (data.roomId === room?.id && data.userId !== currentUserId) {
        setTypingUser(data.userName || '상대방');
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 2000);
      }
    });
    return unsubscribe;
  }, [onTyping, room?.id, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await chatAPI.getMessages(room.id);
      setMessages(data?.messages || []);
    } catch (e) { 
      console.log('메시지 로드 스킵');
      setMessages([]);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const messageContent = input.trim();
    setInput('');
    
    // 즉시 UI에 표시
    const tempMessage = {
      id: `temp-${Date.now()}`,
      roomId: room.id,
      senderId: currentUserId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: '나' }
    };
    setMessages(prev => [...prev, tempMessage]);
    
    // 소켓으로 전송
    socketSendMessage?.(room.id, messageContent);
    
    // API로도 저장 시도
    try {
      await chatAPI.sendMessage(room.id, messageContent);
    } catch (e) {
      console.log('메시지 저장 스킵');
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTyping?.(room.id, true);
  };

  const getRoomName = () => {
    if (room?.name) return room.name;
    const other = room?.participants?.find(p => p.user?.id !== currentUserId);
    return other?.user?.name || '채팅방';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
          {room?.type === 'group' ? '👥' : '👴'}
        </div>
        <div className="flex-1">
          <h3 className="font-bold">{getRoomName()}</h3>
          <p className="text-xs text-gray-500">
            {isConnected ? '🟢 온라인' : '⚪ 연결 중...'}
          </p>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">👋</p>
            <p>첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%]`}>
                  {!isMine && (
                    <p className="text-xs text-gray-500 mb-1 ml-1">{msg.sender?.name || '상대방'}</p>
                  )}
                  <div className={`p-3 rounded-2xl ${
                    isMine 
                      ? 'bg-indigo-500 text-white rounded-br-md' 
                      : 'bg-white shadow rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        
        {/* 타이핑 표시 */}
        {typingUser && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-2xl text-sm text-gray-600">
              {typingUser}님이 입력 중...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="p-3 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
          <button onClick={handleSend} disabled={!input.trim()}
            className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
