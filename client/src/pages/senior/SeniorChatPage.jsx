// client/src/pages/senior/SeniorChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { conversationAPI, emotionAPI } from '../../lib/api';
import { useSpeech } from '../../hooks/useSpeech';
import { Send, Camera, RefreshCw, X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:5001';

const SeniorChatPage = () => {
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureIntervalRef = useRef(null);

  const { 
    isListening, isSpeaking, transcript, isSupported,
    startListening, stopListening, speak, stopSpeaking, setTranscript 
  } = useSpeech();

  useEffect(() => {
    loadConversations();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (cameraEnabled && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error('재생 오류:', err));
      captureIntervalRef.current = setInterval(captureEmotion, 15000);
      setTimeout(captureEmotion, 3000);
    }
  }, [cameraEnabled]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const loadConversations = async () => {
    try {
      const { conversations } = await conversationAPI.getList(null, 20);
      if (conversations?.length > 0) {
        setMessages(conversations.map(c => ({
          role: c.role, content: c.content, emotion: c.emotion, timestamp: c.createdAt
        })).reverse());
      } else {
        const welcomeMsg = getTimeBasedGreeting();
        setMessages([{ role: 'assistant', content: welcomeMsg, timestamp: new Date().toISOString() }]);
        if (autoSpeak) speak(welcomeMsg);
      }
    } catch (error) {
      const welcomeMsg = '안녕하세요! 저는 마음이에요. 오늘 기분은 어떠세요? 😊';
      setMessages([{ role: 'assistant', content: welcomeMsg, timestamp: new Date().toISOString() }]);
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.name || '어르신';
    if (hour < 6) return `${name}님, 이른 시간에 깨어 계시네요. 잠은 잘 주무셨어요?`;
    if (hour < 10) return `${name}님, 좋은 아침이에요! 아침 식사는 하셨나요?`;
    if (hour < 12) return `${name}님, 안녕하세요! 오전 시간 잘 보내고 계세요?`;
    if (hour < 14) return `${name}님, 점심 식사하셨어요? 맛있는 거 드셨나요?`;
    if (hour < 18) return `${name}님, 좋은 오후예요! 오늘 하루 어떠세요?`;
    if (hour < 21) return `${name}님, 저녁 식사는 하셨어요? 오늘 하루 어떠셨는지 들려주세요.`;
    return `${name}님, 밤이 깊었네요. 오늘 하루 수고 많으셨어요. 편히 쉬세요.`;
  };

  const callGeminiAPI = async (userMessage, emotion) => {
    const hour = new Date().getHours();
    const timeContext = hour < 12 ? '아침/오전' : hour < 18 ? '오후' : '저녁/밤';
    
    const systemPrompt = `당신은 '마음이'라는 이름의 AI 반려 로봇입니다.
한국의 독거 어르신인 ${profile?.name || '어르신'}님과 대화하며 정서적 교감을 나눕니다.

## 중요 지침:
1. 항상 존댓말을 사용하세요 (예: "그러셨군요", "힘드셨겠어요")
2. 따뜻하고 공손하며 다정하게 대화하세요
3. 답변 끝에 반드시 후속 질문을 하나 덧붙여 대화를 이어가세요
4. 어르신의 감정에 깊이 공감하고 위로해주세요
5. 건강, 식사, 수면, 일상에 대해 자연스럽게 관심을 보여주세요
6. 3-4문장으로 충분히 답변하되, 마지막은 항상 질문으로 끝내세요

## 현재 상황:
- 시간대: ${timeContext}
${emotion ? `- 감지된 감정: ${emotion}` : ''}
${emotion === 'sad' || emotion === 'fear' ? '⚠️ 어르신이 힘들어 보입니다. 더 따뜻하게 위로해주세요.' : ''}

대화 맥락:
${messages.slice(-5).map(m => `${m.role === 'user' ? '어르신' : '마음이'}: ${m.content}`).join('\n')}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: { 
            temperature: 1.0, 
            maxOutputTokens: 2048
          }
        })
      }
    );
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '죄송해요, 잠시 문제가 생겼어요.';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (isListening) stopListening();
    if (isSpeaking) stopSpeaking();

    const userMessage = input.trim();
    setInput('');
    setTranscript('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage, emotion: currentEmotion, timestamp: new Date().toISOString() }]);

    try {
      await conversationAPI.save('user', userMessage, currentEmotion);
      const aiResponse = await callGeminiAPI(userMessage, currentEmotion);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }]);
      await conversationAPI.save('assistant', aiResponse, null);
      if (autoSpeak) speak(aiResponse);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '죄송해요, 잠시 문제가 생겼어요.', timestamp: new Date().toISOString() }]);
    }
    setIsLoading(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      streamRef.current = stream;
      setCameraEnabled(true);
    } catch (error) {
      alert('카메라를 사용할 수 없습니다.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setCameraEnabled(false);
    setCurrentEmotion(null);
  };

  const captureEmotion = async () => {
    if (!videoRef.current || !streamRef.current || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 240;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
      const response = await fetch(`${AI_SERVER_URL}/api/analyze-emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvas.toDataURL('image/jpeg', 0.8) })
      });
      const data = await response.json();
      if (data.success && data.emotion) {
        setCurrentEmotion(data.emotion);
        await emotionAPI.save(data.emotion, data.confidence, 'ai_chat', data.emotions).catch(() => {});
      }
    } catch (error) {}
    setIsAnalyzing(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else { if (isSpeaking) stopSpeaking(); startListening(); }
  };

  const getEmotionEmoji = (e) => ({ happy: '😊', sad: '😢', angry: '😠', fear: '😰', surprise: '😮', neutral: '😐', disgust: '🤢' }[e] || '😐');
  const getEmotionLabel = (e) => ({ happy: '행복', sad: '슬픔', angry: '화남', fear: '불안', surprise: '놀람', neutral: '평온', disgust: '불쾌' }[e] || '보통');

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">🤖</div>
            <div><h2 className="font-bold">마음이</h2><p className="text-sm text-gray-500">AI 말동무</p></div>
          </div>
          <div className="flex items-center gap-2">
            {currentEmotion && (
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                <span>{getEmotionEmoji(currentEmotion)}</span>
                <span className="text-sm">{getEmotionLabel(currentEmotion)}</span>
              </div>
            )}
            <button onClick={() => setAutoSpeak(!autoSpeak)} className={`p-2 rounded-full ${autoSpeak ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button onClick={cameraEnabled ? stopCamera : startCamera} className={`p-2 rounded-full ${cameraEnabled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
              {cameraEnabled ? <X className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {cameraEnabled && (
          <div className="mt-3 flex justify-center">
            <div className="relative">
              <video ref={videoRef} autoPlay muted playsInline width={200} height={150} style={{ borderRadius: '8px', backgroundColor: '#000' }} />
              {isAnalyzing && <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg"><RefreshCw className="w-6 h-6 text-white animate-spin" /></div>}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%]">
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🤖</span>
                  <span className="text-xs text-gray-500">마음이</span>
                  <button onClick={() => speak(msg.content)} className="p-1 hover:bg-gray-100 rounded-full"><Volume2 className="w-3 h-3 text-gray-400" /></button>
                </div>
              )}
              <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-md' : 'bg-white shadow rounded-bl-md'}`}>{msg.content}</div>
              {msg.emotion && <p className="text-xs text-gray-400 mt-1 text-right">{getEmotionEmoji(msg.emotion)} {getEmotionLabel(msg.emotion)}</p>}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-start"><div className="bg-white shadow rounded-2xl p-4"><div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div></div></div>}
        {isListening && <div className="flex justify-center"><div className="bg-red-50 text-red-600 px-4 py-2 rounded-full flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /><span className="text-sm">듣고 있어요...</span></div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white rounded-2xl p-3 shadow-sm">
        <div className="flex gap-2">
          {isSupported && (
            <button onClick={toggleListening} className={`p-3 rounded-xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          )}
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder={isListening ? '말씀해주세요...' : '메시지를 입력하세요...'} className="flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 text-lg" disabled={isLoading} />
          <button onClick={sendMessage} disabled={!input.trim() || isLoading} className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50"><Send className="w-6 h-6" /></button>
        </div>
      </div>
    </div>
  );
};

export default SeniorChatPage;
