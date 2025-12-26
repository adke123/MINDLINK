import { useState, useEffect } from 'react';
import { gamesAPI } from '../../lib/api';
import { Trophy, Eye, EyeOff } from 'lucide-react';

const NumberMemoryGame = ({ difficulty = 'easy' }) => {
  const [numbers, setNumbers] = useState('');
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('show'); // show, input, result
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const maxRounds = 10;

  useEffect(() => { generateNumbers(); }, []);

  useEffect(() => {
    if (phase === 'show') {
      const timer = setTimeout(() => setPhase('input'), 2000 + level * 500);
      return () => clearTimeout(timer);
    }
  }, [phase, level]);

  const generateNumbers = () => {
    const nums = Array.from({ length: level }, () => Math.floor(Math.random() * 10)).join('');
    setNumbers(nums);
    setAnswer('');
    setPhase('show');
  };

  const handleSubmit = async () => {
    const isCorrect = answer === numbers;
    setPhase('result');
    
    if (isCorrect) {
      setScore(s => s + level * 10);
      if (level < 9) setLevel(l => l + 1);
    }

    setTimeout(() => {
      if (round >= maxRounds) {
        endGame();
      } else {
        setRound(r => r + 1);
        generateNumbers();
      }
    }, 2000);
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      await gamesAPI.saveResult('number', score, duration, difficulty);
    } catch (e) { console.error(e); }
  };

  if (gameOver) {
    return (
      <div className="text-center py-10">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold">게임 종료!</h3>
        <p className="text-4xl font-bold text-indigo-600 mt-4">{score}점</p>
        <p className="text-gray-500 mt-2">최고 레벨: {level}자리</p>
        <button onClick={() => { setScore(0); setRound(1); setLevel(difficulty === 'easy' ? 3 : 4); setGameOver(false); generateNumbers(); }} className="mt-6 px-6 py-3 bg-indigo-500 text-white rounded-xl">다시 하기</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <span className="text-lg">라운드 {round}/{maxRounds}</span>
        <span className="text-lg font-bold text-indigo-600">{score}점</span>
      </div>

      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-4 text-gray-500">
          {phase === 'show' ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          <span>{level}자리 숫자</span>
        </div>

        {phase === 'show' && (
          <p className="text-5xl font-bold tracking-widest text-indigo-600">{numbers}</p>
        )}

        {phase === 'input' && (
          <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            maxLength={level} placeholder="숫자를 입력하세요" className="text-4xl font-bold text-center border-b-4 border-indigo-500 focus:outline-none w-full" autoFocus />
        )}

        {phase === 'result' && (
          <div>
            <p className={`text-4xl font-bold ${answer === numbers ? 'text-green-500' : 'text-red-500'}`}>
              {answer === numbers ? '정답! 🎉' : '오답!'}
            </p>
            {answer !== numbers && <p className="text-gray-500 mt-2">정답: {numbers}</p>}
          </div>
        )}
      </div>

      {phase === 'input' && (
        <button onClick={handleSubmit} disabled={answer.length !== level} className="w-full py-4 bg-indigo-500 text-white rounded-xl text-xl font-bold disabled:opacity-50">확인</button>
      )}
    </div>
  );
};

export default NumberMemoryGame;
