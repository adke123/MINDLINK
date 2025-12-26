import { useState, useEffect } from 'react';
import { gamesAPI } from '../../lib/api';
import { RotateCcw, Trophy } from 'lucide-react';

const MemoryGame = ({ difficulty = 'easy' }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🥭', '🍍', '🥥'];
  const gridSize = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16;

  useEffect(() => { initGame(); }, [difficulty]);

  const initGame = () => {
    const pairs = gridSize / 2;
    const selected = emojis.slice(0, pairs);
    const shuffled = [...selected, ...selected].sort(() => Math.random() - 0.5).map((emoji, i) => ({ id: i, emoji, isFlipped: false }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameOver(false);
    setStartTime(Date.now());
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setMatched(m => [...m, ...newFlipped]);
        setFlipped([]);
        if (matched.length + 2 === cards.length) {
          endGame();
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const score = Math.max(100 - moves * 2, 10);
    try {
      await gamesAPI.saveResult('memory', score, duration, difficulty);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-lg font-bold">이동: {moves}회</p>
        <button onClick={initGame} className="p-2 bg-gray-100 rounded-lg"><RotateCcw className="w-5 h-5" /></button>
      </div>

      <div className={`grid gap-2 ${gridSize === 8 ? 'grid-cols-4' : gridSize === 12 ? 'grid-cols-4' : 'grid-cols-4'}`}>
        {cards.map((card, i) => (
          <button key={card.id} onClick={() => handleCardClick(i)} disabled={flipped.includes(i) || matched.includes(i)}
            className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${flipped.includes(i) || matched.includes(i) ? 'bg-white shadow' : 'bg-indigo-500'}`}>
            {flipped.includes(i) || matched.includes(i) ? card.emoji : '❓'}
          </button>
        ))}
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">축하해요! 🎉</h3>
            <p className="text-gray-500 mt-2">{moves}번 만에 완료!</p>
            <button onClick={initGame} className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-xl">다시 하기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryGame;
