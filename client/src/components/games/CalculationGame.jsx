import { useState, useEffect } from 'react';
import { gamesAPI } from '../../lib/api';
import { Check, X, Trophy } from 'lucide-react';

const CalculationGame = ({ difficulty = 'easy' }) => {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const maxRounds = 10;

  useEffect(() => { generateQuestion(); }, [difficulty]);

  const generateQuestion = () => {
    const max = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 50 : 100;
    const ops = difficulty === 'easy' ? ['+', '-'] : ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * max) + 1;
    let b = Math.floor(Math.random() * max) + 1;
    if (op === '-' && a < b) [a, b] = [b, a];
    const result = op === '+' ? a + b : op === '-' ? a - b : a * b;
    setQuestion({ a, b, op, result });
    setAnswer('');
    setFeedback(null);
  };

  const handleSubmit = async () => {
    const isCorrect = parseInt(answer) === question.result;
    setFeedback(isCorrect);
    if (isCorrect) setScore(s => s + 10);

    setTimeout(() => {
      if (round >= maxRounds) {
        endGame();
      } else {
        setRound(r => r + 1);
        generateQuestion();
      }
    }, 1000);
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    try {
      await gamesAPI.saveResult('calculation', score, duration, difficulty);
    } catch (e) { console.error(e); }
  };

  if (gameOver) {
    return (
      <div className="text-center py-10">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold">게임 종료!</h3>
        <p className="text-4xl font-bold text-indigo-600 mt-4">{score}점</p>
        <button onClick={() => { setScore(0); setRound(1); setGameOver(false); generateQuestion(); }} className="mt-6 px-6 py-3 bg-indigo-500 text-white rounded-xl">다시 하기</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><span className="text-lg">라운드 {round}/{maxRounds}</span><span className="text-lg font-bold text-indigo-600">{score}점</span></div>

      {question && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-4xl font-bold mb-6">{question.a} {question.op} {question.b} = ?</p>
          <input type="number" value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-32 text-center text-3xl font-bold border-b-4 border-indigo-500 focus:outline-none" autoFocus />
          
          {feedback !== null && (
            <div className={`mt-4 flex items-center justify-center gap-2 ${feedback ? 'text-green-500' : 'text-red-500'}`}>
              {feedback ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
              <span className="text-xl">{feedback ? '정답!' : `오답! 정답: ${question.result}`}</span>
            </div>
          )}
        </div>
      )}

      <button onClick={handleSubmit} disabled={!answer} className="w-full py-4 bg-indigo-500 text-white rounded-xl text-xl font-bold disabled:opacity-50">확인</button>
    </div>
  );
};

export default CalculationGame;
