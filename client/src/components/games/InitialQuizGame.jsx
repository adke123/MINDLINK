import { useState, useEffect } from 'react';
import { gamesAPI } from '../../lib/api';
import { Trophy, HelpCircle } from 'lucide-react';

const InitialQuizGame = ({ difficulty = 'easy' }) => {
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const quizzes = [
    { initial: 'ㄱㄴ', answer: '가나', hint: '과자 이름', category: 'food' },
    { initial: 'ㅅㄱ', answer: '사과', hint: '빨간 과일', category: 'food' },
    { initial: 'ㅂㄴ', answer: '바나나', hint: '노란 과일', category: 'food' },
    { initial: 'ㅎㄱ', answer: '학교', hint: '공부하는 곳', category: 'place' },
    { initial: 'ㅂㅇ', answer: '병원', hint: '아플 때 가는 곳', category: 'place' },
    { initial: 'ㄱㅊ', answer: '김치', hint: '한국 음식', category: 'food' },
    { initial: 'ㅌㄹㅂㅈ', answer: '텔레비전', hint: '뉴스를 보는 것', category: 'thing' },
    { initial: 'ㅈㅎㅊ', answer: '자동차', hint: '타고 다니는 것', category: 'thing' },
    { initial: 'ㅂㅎ', answer: '봄하', hint: '계절', category: 'nature' },
    { initial: 'ㄴㅁ', answer: '나무', hint: '숲에 있는 것', category: 'nature' },
    { initial: 'ㅎㄴ', answer: '하늘', hint: '구름이 있는 곳', category: 'nature' },
    { initial: 'ㅂㄷ', answer: '바다', hint: '파도가 치는 곳', category: 'nature' }
  ];

  const maxRounds = 10;

  useEffect(() => { nextQuiz(); }, []);

  const nextQuiz = () => {
    const remaining = quizzes.filter((_, i) => i !== quizzes.indexOf(currentQuiz));
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    setCurrentQuiz(next);
    setAnswer('');
    setFeedback(null);
    setHint(false);
  };

  const handleSubmit = async () => {
    const isCorrect = answer.trim() === currentQuiz.answer;
    setFeedback(isCorrect);
    if (isCorrect) setScore(s => s + (hint ? 5 : 10));

    setTimeout(() => {
      if (round >= maxRounds) {
        endGame();
      } else {
        setRound(r => r + 1);
        nextQuiz();
      }
    }, 1500);
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      await gamesAPI.saveResult('initial', score, duration, difficulty);
    } catch (e) { console.error(e); }
  };

  if (gameOver) {
    return (
      <div className="text-center py-10">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold">게임 종료!</h3>
        <p className="text-4xl font-bold text-indigo-600 mt-4">{score}점</p>
        <button onClick={() => { setScore(0); setRound(1); setGameOver(false); nextQuiz(); }} className="mt-6 px-6 py-3 bg-indigo-500 text-white rounded-xl">다시 하기</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><span className="text-lg">라운드 {round}/{maxRounds}</span><span className="text-lg font-bold text-indigo-600">{score}점</span></div>

      {currentQuiz && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-5xl font-bold mb-4 tracking-widest text-indigo-600">{currentQuiz.initial}</p>
          
          {hint && <p className="text-gray-500 mb-4">힌트: {currentQuiz.hint}</p>}
          
          <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="정답을 입력하세요" className="w-full text-center text-2xl font-bold border-b-4 border-indigo-500 focus:outline-none py-2" autoFocus />

          {feedback !== null && (
            <div className={`mt-4 text-xl ${feedback ? 'text-green-500' : 'text-red-500'}`}>
              {feedback ? '정답! 🎉' : `오답! 정답: ${currentQuiz.answer}`}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setHint(true)} disabled={hint} className="flex-1 py-3 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          <HelpCircle className="w-5 h-5" />힌트
        </button>
        <button onClick={handleSubmit} disabled={!answer} className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50">확인</button>
      </div>
    </div>
  );
};

export default InitialQuizGame;
