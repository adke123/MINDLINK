// client/src/pages/senior/SeniorGamesPage.jsx
import { useState } from 'react';
import { Brain, Calculator, Grid3X3, Hash } from 'lucide-react';
import MemoryGame from '../../components/games/MemoryGame';
import CalculationGame from '../../components/games/CalculationGame';
import InitialQuizGame from '../../components/games/InitialQuizGame';
import NumberMemoryGame from '../../components/games/NumberMemoryGame';

const SeniorGamesPage = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');

  const games = [
    { id: 'memory', name: '카드 짝 맞추기', icon: Grid3X3, color: 'bg-pink-500', desc: '같은 그림을 찾아요', component: MemoryGame },
    { id: 'calculation', name: '암산 게임', icon: Calculator, color: 'bg-blue-500', desc: '계산 실력을 키워요', component: CalculationGame },
    { id: 'initial', name: '초성 퀴즈', icon: Brain, color: 'bg-green-500', desc: '단어를 맞춰보세요', component: InitialQuizGame },
    { id: 'number', name: '숫자 기억하기', icon: Hash, color: 'bg-purple-500', desc: '숫자를 기억해요', component: NumberMemoryGame },
  ];

  if (selectedGame) {
    const GameComponent = games.find(g => g.id === selectedGame)?.component;
    return (
      <div>
        <button onClick={() => setSelectedGame(null)} className="mb-4 text-indigo-600 font-medium">← 게임 목록</button>
        {GameComponent && <GameComponent difficulty={difficulty} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">🧩 두뇌 게임</h2>
        <p className="text-gray-500 mt-1">재미있게 두뇌 운동해요!</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-2">난이도 선택</p>
        <div className="flex gap-2">
          {['easy', 'medium', 'hard'].map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2 rounded-lg font-medium ${difficulty === d ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>
              {d === 'easy' ? '쉬움' : d === 'medium' ? '보통' : '어려움'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {games.map(game => (
          <button key={game.id} onClick={() => setSelectedGame(game.id)} className="bg-white rounded-2xl p-5 shadow-sm text-left hover:shadow-md transition-all active:scale-95">
            <div className={`w-12 h-12 ${game.color} rounded-xl flex items-center justify-center mb-3`}>
              <game.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-800">{game.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{game.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeniorGamesPage;
