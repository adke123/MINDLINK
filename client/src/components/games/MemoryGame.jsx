import { useState, useEffect, useCallback } from 'react';
import { gamesAPI } from '../../lib/api';
import { RotateCcw, Trophy } from 'lucide-react';

const MemoryGame = ({ difficulty = 'easy' }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // 이모지 세트 확장
  const emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍌', '🥭', '🍍', '🥥', '🍉', '🥑', '🥦', '🥕'];

  // 난이도별 설정: 3x3(9칸), 4x4(16칸), 5x5(25칸)
  const getGridConfig = () => {
    switch (difficulty) {
      case 'easy': return { cols: 3, total: 9, pairs: 4 }; // 1칸 비움
      case 'medium': return { cols: 4, total: 16, pairs: 8 };
      case 'hard': return { cols: 5, total: 25, pairs: 12 }; // 1칸 비움
      default: return { cols: 3, total: 9, pairs: 4 };
    }
  };

  const config = getGridConfig();

  const initGame = useCallback(() => {
    const { total, pairs } = config;
    const selectedEmojis = emojis.slice(0, pairs);
    
    // 짝을 맞춘 카드 리스트 생성
    let gameCards = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, type: 'card' }));

    // 홀수 격자의 경우 정중앙에 '빈 칸(로고/보너스)' 삽입
    if (total % 2 !== 0) {
      const centerIndex = Math.floor(total / 2);
      gameCards.splice(centerIndex, 0, { id: 'center', emoji: '🌟', type: 'empty' });
    }

    setCards(gameCards);
    setFlipped([]);
    setMatched(total % 2 !== 0 ? ['center'] : []); // 빈 칸은 미리 맞춘 것으로 처리
    setMoves(0);
    setGameOver(false);
    setStartTime(Date.now());
  }, [difficulty]);

  useEffect(() => { initGame(); }, [initGame]);

  const handleCardClick = (index) => {
    // 이미 뒤집혔거나, 맞췄거나, 빈 칸인 경우 무시
    if (
      flipped.length === 2 || 
      flipped.includes(index) || 
      matched.includes(cards[index].id) ||
      cards[index].type === 'empty'
    ) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      if (firstCard.emoji === secondCard.emoji) {
        // 일치할 경우 matched에 id 추가
        const newMatched = [...matched, firstCard.id, secondCard.id];
        setMatched(newMatched);
        setFlipped([]);
        
        // 모든 카드를 다 맞췄는지 확인
        if (newMatched.length === cards.length) {
          endGame();
        }
      } else {
        // 불일치 시 1초 후 다시 뒤집기
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const endGame = async () => {
    setGameOver(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const score = Math.max(100 - moves * 2, 10);
    try {
      await gamesAPI.saveResult({
        gameType: 'memory',
        score,
        duration,
        difficulty
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <p className="text-gray-500 text-sm font-medium">난이도: {difficulty === 'easy' ? '쉬움(3x3)' : difficulty === 'medium' ? '보통(4x4)' : '어려움(5x5)'}</p>
          <p className="text-2xl font-bold text-indigo-600">이동: {moves}회</p>
        </div>
        <button 
          onClick={initGame} 
          className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div 
        className="grid gap-3 p-2 bg-indigo-50/50 rounded-3xl"
        style={{ 
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` 
        }}
      >
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i);
          const isMatched = matched.includes(card.id);
          const isEmpty = card.type === 'empty';

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(i)}
              disabled={isMatched || isEmpty}
              className={`aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all duration-300 transform ${
                isFlipped || isMatched 
                  ? 'bg-white rotate-0 shadow-md' 
                  : 'bg-indigo-500 -rotate-180 hover:scale-105'
              } ${isEmpty ? 'bg-indigo-100 opacity-50 cursor-default' : ''}`}
            >
              <span className={`transition-opacity duration-300 ${isFlipped || isMatched || isEmpty ? 'opacity-100' : 'opacity-0'}`}>
                {card.emoji}
              </span>
              {!(isFlipped || isMatched || isEmpty) && (
                <span className="text-white text-2xl absolute">?</span>
              )}
            </button>
          );
        })}
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[32px] p-8 text-center shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800">대단해요!</h3>
            <p className="text-gray-500 mt-2 text-lg">{moves}번 만에 모든 짝을 찾았습니다.</p>
            <button 
              onClick={initGame} 
              className="mt-8 w-full py-4 bg-indigo-500 text-white rounded-2xl text-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all"
            >
              한 번 더 하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryGame;