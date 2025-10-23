import { useState } from 'react';
import { Brain, Plus, Trash2, RotateCcw, Sparkles, Check, X, Loader2, FolderOpen, Edit2, Layers, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { generateFlashcardsWithAI } from '../services/claudeService';

export default function Flashcards() {
  const { flashcards, decks, addFlashcard, deleteFlashcard, addXP, createDeck, deleteDeck, updateDeck } = useStore();
  
  // Estados
  const [view, setView] = useState('decks'); // decks, cards, study
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showManualCreator, setShowManualCreator] = useState(false);
  const [showDeckCreator, setShowDeckCreator] = useState(false);
  const [theme, setTheme] = useState('');
  const [numberOfCards, setNumberOfCards] = useState(5);
  const [loading, setLoading] = useState(false);
  
  // Manual Card Creator
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  
  // Deck Creator
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckColor, setNewDeckColor] = useState('#8b5cf6');
  
  // Study Mode
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyStats, setStudyStats] = useState({ easy: 0, medium: 0, hard: 0 });

  const colors = [
    '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4', '#a855f7'
  ];

  // Criar novo deck
  const handleCreateDeck = () => {
    if (!newDeckName.trim()) {
      alert('Digite um nome para o deck!');
      return;
    }
    
    createDeck({
      name: newDeckName.trim(),
      color: newDeckColor,
    });
    
    setNewDeckName('');
    setNewDeckColor('#8b5cf6');
    setShowDeckCreator(false);
    addXP(10, 'deck_created');
  };

  // Gerar flashcards
  const generateFlashcards = async () => {
    if (!theme.trim()) {
      alert('Digite um tema primeiro!');
      return;
    }
    
    if (!selectedDeck) {
      alert('Selecione um deck primeiro!');
      return;
    }
    
    setLoading(true);
    
    try {
      const generatedCards = await generateFlashcardsWithAI(theme, numberOfCards);
      
      generatedCards.forEach((card) => {
        addFlashcard({
          question: card.question,
          answer: card.answer,
          deckId: selectedDeck.id,
          difficulty: 'medium',
          nextReview: new Date().toISOString(),
          reviews: 0,
        });
      });
      
      setTheme('');
      setShowGenerator(false);
      addXP(50, 'flashcards_generated');
      alert(`🎉 ${generatedCards.length} flashcards adicionados ao deck "${selectedDeck.name}"!`);
      setView('cards');
    } catch (error) {
      console.error('Erro:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Criar card manualmente
  const createManualCard = () => {
    if (!manualQuestion.trim() || !manualAnswer.trim()) {
      alert('Preencha pergunta e resposta!');
      return;
    }
    
    if (!selectedDeck) {
      alert('Selecione um deck primeiro!');
      return;
    }
    
    addFlashcard({
      question: manualQuestion.trim(),
      answer: manualAnswer.trim(),
      deckId: selectedDeck.id,
      difficulty: 'medium',
      nextReview: new Date().toISOString(),
      reviews: 0,
    });
    
    setManualQuestion('');
    setManualAnswer('');
    setShowManualCreator(false);
    addXP(5, 'flashcard_manual');
    alert(`✅ Card adicionado ao deck "${selectedDeck.name}"!`);
  };

  // Study mode
  const startStudy = (deck) => {
    const deckCards = flashcards.filter(card => card.deckId === deck.id);
    if (deckCards.length === 0) {
      alert('Este deck não tem cards ainda!');
      return;
    }
    setSelectedDeck(deck);
    setStudyMode(true);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyStats({ easy: 0, medium: 0, hard: 0 });
  };

  const handleDifficulty = (difficulty) => {
    setStudyStats(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }));
    const xpMap = { hard: 30, medium: 20, easy: 10 };
    addXP(xpMap[difficulty], 'flashcard_study');
    
    const deckCards = flashcards.filter(card => card.deckId === selectedDeck.id);
    
    if (currentCardIndex < deckCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setStudyMode(false);
      const total = studyStats.easy + studyStats.medium + studyStats.hard + 1;
      const totalXP = (studyStats.easy * 10) + (studyStats.medium * 20) + (studyStats.hard * 30) + xpMap[difficulty];
      alert(`🎉 Deck completo!\n\n✅ Fácil: ${studyStats.easy + (difficulty === 'easy' ? 1 : 0)}\n🔄 Médio: ${studyStats.medium + (difficulty === 'medium' ? 1 : 0)}\n❌ Difícil: ${studyStats.hard + (difficulty === 'hard' ? 1 : 0)}\n\n⭐ ${totalXP} XP ganhos!`);
      setView('decks');
    }
  };

  const deckCards = selectedDeck ? flashcards.filter(card => card.deckId === selectedDeck.id) : [];
  const currentCard = deckCards[currentCardIndex];

  // VIEW: Study Mode
  if (studyMode) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold">{selectedDeck.name}</h3>
              <p className="text-gray-400 text-sm">Card {currentCardIndex + 1} de {deckCards.length}</p>
            </div>
            <button onClick={() => setStudyMode(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">
              Sair
            </button>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${((currentCardIndex + 1) / deckCards.length) * 100}%`,
                backgroundColor: selectedDeck.color 
              }}
            />
          </div>

          <div className="perspective-1000 mb-8">
            <motion.div
              className="relative w-full h-80 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="absolute inset-0 backdrop-blur-lg border border-white/20 rounded-3xl p-8 flex items-center justify-center"
                style={{ 
                  backfaceVisibility: 'hidden',
                  background: `linear-gradient(135deg, ${selectedDeck.color}20 0%, ${selectedDeck.color}10 100%)`
                }}
              >
                <div className="text-center">
                  <Brain size={48} className="mx-auto mb-6" style={{ color: selectedDeck.color }} />
                  <h3 className="text-2xl font-bold mb-4">{currentCard?.question}</h3>
                  <p className="text-gray-400">Clique para ver a resposta</p>
                </div>
              </div>

              <div
                className="absolute inset-0 backdrop-blur-lg border border-white/20 rounded-3xl p-8 flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: `linear-gradient(135deg, ${selectedDeck.color}30 0%, ${selectedDeck.color}20 100%)`
                }}
              >
                <div className="text-center">
                  <Check size={48} className="mx-auto mb-6 text-green-400" />
                  <p className="text-xl">{currentCard?.answer}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {isFlipped && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
              <button onClick={() => handleDifficulty('hard')} className="flex-1 py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl">
                <X size={20} className="inline mr-2" />Difícil (+30 XP)
              </button>
              <button onClick={() => handleDifficulty('medium')} className="flex-1 py-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-xl">
                <RotateCcw size={20} className="inline mr-2" />Médio (+20 XP)
              </button>
              <button onClick={() => handleDifficulty('easy')} className="flex-1 py-4 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-xl">
                <Check size={20} className="inline mr-2" />Fácil (+10 XP)
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // VIEW: Cards dentro de um deck
  if (view === 'cards' && selectedDeck) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8">
          <button onClick={() => { setView('decks'); setSelectedDeck(null); }} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft size={20} />Voltar
          </button>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedDeck.color }}>
                <Layers size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedDeck.name}</h2>
                <p className="text-gray-400">{deckCards.length} cards</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGenerator(true)} className="btn-primary flex items-center gap-2">
                <Sparkles size={18} />Gerar com IA
              </button>
              <button onClick={() => setShowManualCreator(true)} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-xl flex items-center gap-2">
                <Plus size={18} />Criar Manual
              </button>
              <button onClick={() => startStudy(selectedDeck)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl">
                Estudar Deck
              </button>
            </div>
          </div>

          {showGenerator && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Gerar Cards com IA</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Fotossíntese, Revolução Francesa..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select value={numberOfCards} onChange={(e) => setNumberOfCards(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value={5}>5 cards</option>
                  <option value={10}>10 cards</option>
                  <option value={15}>15 cards</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={generateFlashcards} disabled={loading} className="flex-1 btn-primary">
                    {loading ? <><Loader2 className="animate-spin inline mr-2" size={20} />Gerando...</> : <><Sparkles size={20} className="inline mr-2" />Gerar Cards</>}
                  </button>
                  <button onClick={() => setShowGenerator(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl">Cancelar</button>
                </div>
              </div>
            </motion.div>
          )}

          {showManualCreator && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Criar Card Manualmente</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Pergunta:</label>
                  <textarea
                    value={manualQuestion}
                    onChange={(e) => setManualQuestion(e.target.value)}
                    placeholder="Digite a pergunta do card..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Resposta:</label>
                  <textarea
                    value={manualAnswer}
                    onChange={(e) => setManualAnswer(e.target.value)}
                    placeholder="Digite a resposta do card..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={createManualCard} className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-xl py-3 flex items-center justify-center gap-2">
                    <Plus size={20} />Criar Card
                  </button>
                  <button onClick={() => setShowManualCreator(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl">Cancelar</button>
                </div>
              </div>
            </motion.div>
          )}

          {deckCards.length === 0 ? (
            <div className="text-center py-12">
              <Brain size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold mb-2">Nenhum card ainda</h3>
              <p className="text-gray-400">Gere cards com IA para começar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deckCards.map((card, index) => (
                <motion.div key={card.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="glass p-6 relative group">
                  <button onClick={() => deleteFlashcard(card.id)} className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                  <div className="mb-4">
                    <span className="text-xs text-gray-400">Pergunta:</span>
                    <p className="font-semibold">{card.question}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Resposta:</span>
                    <p className="text-gray-300 text-sm">{card.answer}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // VIEW: Lista de Decks (padrão)
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Meus Decks</h2>
              <p className="text-gray-400">{decks.length} decks criados</p>
            </div>
          </div>
          <button onClick={() => setShowDeckCreator(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />Novo Deck
          </button>
        </div>

        {showDeckCreator && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Criar Novo Deck</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="Nome do deck (ex: História do Brasil)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <label className="block text-sm mb-2">Escolha uma cor:</label>
                <div className="flex gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewDeckColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${newDeckColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateDeck} className="flex-1 btn-primary">Criar Deck</button>
                <button onClick={() => setShowDeckCreator(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl">Cancelar</button>
              </div>
            </div>
          </motion.div>
        )}

        {decks.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2">Nenhum deck ainda</h3>
            <p className="text-gray-400 mb-6">Crie seu primeiro deck para organizar seus estudos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck, index) => {
              const deckCardCount = flashcards.filter(c => c.deckId === deck.id).length;
              return (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass p-6 cursor-pointer hover:scale-105 transition-all relative group"
                  onClick={() => { setSelectedDeck(deck); setView('cards'); }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                    className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="w-16 h-16 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: deck.color }}>
                    <Layers size={32} />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{deck.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{deckCardCount} cards</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); startStudy(deck); }}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                    >
                      Estudar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedDeck(deck); setView('cards'); }}
                      className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                    >
                      Ver Cards
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}