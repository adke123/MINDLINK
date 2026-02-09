import { useState, useEffect, useCallback } from 'react';
import { gamesAPI } from '../../lib/api';
import { Trophy, Eye, EyeOff } from 'lucide-react';

const NumberMemoryGame = ({ difficulty = 'easy' }) => {
  const [numbers, setNumbers] = useState('');
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('show'); // show, input, result
  const [score, setScore] = useState(0);
  // 초기 레벨 설정
  const [level, setLevel] = useState(difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const maxRounds = 10;

  // 숫자 생성 함수를 useCallback으로 감싸 중복 생성을 방지하고, 새로운 레벨을 인자로 받을 수 있게 합니다.
  const generateNumbers = useCallback((currentLevel) => {
    const targetLevel = currentLevel || level;
    const nums = Array.from({ length: targetLevel }, () => Math.floor(Math.random() * 10)).join('');
    setNumbers(nums);
    setAnswer('');
    setPhase('show');
  }, [level]);

  useEffect(() => { 
    generateNumbers(); 
  }, []); // 초기 1회 실행

  // 숫자를 보여주는 시간 설정
  useEffect(() => {
    if (phase === 'show') {
      const displayTime = 1500 + (level * 400); // 자릿수에 따라 보여주는 시간 조절
      const timer = setTimeout(() => setPhase('input'), displayTime);
      return () => clearTimeout(timer);
    }
  }, [phase, level]);

  const handleSubmit = async () => {
    if (phase !== 'input') return;

    const isCorrect = answer === numbers;
    setPhase('result');
    
    let nextLevel = level;
    if (isCorrect) {
      setScore(s => s + (level * 10));
      // 정답일 경우 다음 라운드를 위해 레벨업 준비
      if (level < 12) {
        nextLevel = level + 1;
        setLevel(nextLevel);
      }
    }

    setTimeout(() => {
      if (round >= maxRounds) {
        endGame();
      } else {
        setRound(r => r + 1);
        // 다음 라운드 시작 시 업데이트된 레벨을 즉시 반영
        generateNumbers(nextLevel);
      }
    }, 1500);
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      await gamesAPI.saveResult({
        gameType: 'number',
        score,
        duration,
        difficulty
      });
    } catch (e) { 
      console.error('결과 저장 실패:', e); 
    }
  };

  const resetGame = () => {
    const initialLevel = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    setScore(0);
    setRound(1);
    setLevel(initialLevel);
    setGameOver(false);
    generateNumbers(initialLevel);
  };

  if (gameOver) {
    return (
      <div className="text-center py-10 bg-white rounded-3xl shadow-sm">
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">게임 종료!</h2>
        <p className="text-4xl font-bold text-indigo-600 mt-4">{score}점</p>
        <p className="text-gray-500 mt-2">도달한 최종 자릿수: {level}자리</p>
        <button onClick={resetGame} className="mt-8 px-8 py-3 bg-indigo-500 text-white rounded-2xl font-bold text-lg">다시 하기</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <span className="text-lg font-medium text-gray-500">라운드 {round}/{maxRounds}</span>
        <span className="text-2xl font-bold text-indigo-600">{score}점</span>
      </div>

      <div className="bg-white rounded-3xl p-10 text-center shadow-md border-2 border-indigo-50">
        <div className="flex items-center justify-center gap-2 mb-6 text-indigo-400 font-bold">
          {phase === 'show' ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
          <span className="text-xl">{level}자리 숫자 기억하기</span>
        </div>

        {phase === 'show' && (
          <p className="text-6xl font-black tracking-[0.3em] text-indigo-600 animate-pulse">
            {numbers}
          </p>
        )}

        {phase === 'input' && (
          <div className="space-y-6">
            <input 
              type="text" 
              value={answer} 
              onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))} 
              onKeyPress={(e) => e.key === 'Enter' && answer.length > 0 && handleSubmit()}
              placeholder="숫자를 입력하세요" 
              className="text-5xl font-bold text-center border-b-4 border-indigo-500 focus:outline-none w-full py-2 placeholder:text-gray-100" 
              autoFocus 
            />
            <p className="text-gray-400 text-sm">입력을 마치고 확인 버튼이나 엔터를 누르세요.</p>
          </div>
        )}

        {phase === 'result' && (
          <div className="py-4">
            <p className={`text-5xl font-black ${answer === numbers ? 'text-green-500' : 'text-red-500'} animate-bounce`}>
              {answer === numbers ? '정답입니다! 🎉' : '아쉬워요!'}
            </p>
            {answer !== numbers && (
              <div className="mt-4 space-y-1">
                <p className="text-gray-400 text-lg">나의 입력: <span className="line-through">{answer}</span></p>
                <p className="text-indigo-600 text-2xl font-bold">정답: {numbers}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {phase === 'input' && (
        <button 
          onClick={handleSubmit} 
          disabled={answer.length === 0} 
          className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-2xl font-bold shadow-lg transition-all disabled:bg-gray-200"
        >
          확인
        </button>
      )}
    </div>
  );
};

export default NumberMemoryGame;