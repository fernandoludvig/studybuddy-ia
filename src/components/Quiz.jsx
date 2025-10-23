import { useState } from 'react';
import { Brain, Play, CheckCircle, XCircle, RotateCcw, Trophy, Target, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

export default function Quiz() {
  const { user, studyPlans, addXP, addActivityToHistory, addQuizResult } = useStore();
  
  // Estados
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Extrair tópicos dos planos de estudo
  const availableTopics = [];
  studyPlans.forEach(plan => {
    plan.schedule.forEach(week => {
      week.days.forEach(day => {
        day.topics.forEach(topic => {
          availableTopics.push({
            id: `${plan.id}-${week.week}-${day.day}-${topic}`,
            label: topic,
            plan: plan.title,
            subject: day.subjects[0] || 'Geral'
          });
        });
      });
    });
  });

  // Gerar quiz com IA
  const generateQuiz = async () => {
    if (!selectedTopic) {
      alert('Selecione um tópico primeiro!');
      return;
    }

    setLoading(true);
    setQuiz(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
    setQuizCompleted(false);

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: selectedTopic,
          numberOfQuestions: 10
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setQuiz(data);
      
      // Adicionar atividade ao histórico
      addActivityToHistory({
        type: 'quiz_started',
        description: `Iniciou quiz sobre: ${selectedTopic}`,
        xp: 0,
        source: 'quiz_generation'
      });

    } catch (error) {
      console.error('Erro ao gerar quiz:', error);
      alert(`❌ Erro ao gerar quiz: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Responder questão
  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    // Feedback visual
    setTimeout(() => {
      if (currentQuestion < quiz.quiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        // Quiz finalizado
        finishQuiz(newAnswers);
      }
    }, 1500);
  };

  // Finalizar quiz
  const finishQuiz = (finalAnswers) => {
    const correctAnswers = quiz.quiz.filter((question, index) => 
      question.correct === finalAnswers[index]
    ).length;

    const score = correctAnswers;
    const percentage = Math.round((score / quiz.quiz.length) * 100);
    const xpEarned = score * 10; // 10 XP por questão certa

    // Adicionar XP
    addXP(xpEarned, 'quiz_completed');
    
    // Adicionar atividade ao histórico
    addActivityToHistory({
      type: 'quiz_completed',
      description: `Completou quiz sobre: ${selectedTopic} - ${percentage}% de acerto`,
      xp: xpEarned,
      source: 'quiz_completion'
    });

    // Salvar resultado do quiz
    addQuizResult({
      topic: selectedTopic,
      totalQuestions: quiz.quiz.length,
      correctAnswers: correctAnswers,
      percentage: percentage,
      xpEarned: xpEarned,
      answers: answers,
      quiz: quiz.quiz
    });

    setQuizCompleted(true);
    setShowResult(true);
  };

  // Reiniciar quiz
  const restartQuiz = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
    setQuizCompleted(false);
    setSelectedAnswer(null);
  };

  // Se o quiz foi completado, mostrar resultado
  if (quizCompleted && showResult) {
    const correctAnswers = quiz.quiz.filter((question, index) => 
      question.correct === answers[index]
    ).length;
    const percentage = Math.round((correctAnswers / quiz.quiz.length) * 100);
    const xpEarned = correctAnswers * 10;

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Trophy size={48} className="text-white" />
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Quiz Concluído! 🎉</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">{correctAnswers}</div>
              <div className="text-sm text-gray-400">Acertos</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-indigo-400">{percentage}%</div>
              <div className="text-sm text-gray-400">Precisão</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400">+{xpEarned}</div>
              <div className="text-sm text-gray-400">XP Ganho</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={restartQuiz}
              className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-xl flex items-center gap-2"
            >
              <RotateCcw size={18} />
              Novo Quiz
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Se há um quiz ativo, mostrar as questões
  if (quiz && !quizCompleted) {
    const currentQ = quiz.quiz[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.quiz.length) * 100;

    return (
      <div className="space-y-6">
        {/* Header do Quiz */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Quiz: {selectedTopic}</h2>
              <p className="text-gray-400 text-sm">Questão {currentQuestion + 1} de {quiz.quiz.length}</p>
            </div>
            <button
              onClick={restartQuiz}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
            >
              Cancelar
            </button>
          </div>
          
          {/* Barra de progresso */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Questão atual */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass p-8"
        >
          <h3 className="text-xl font-bold mb-6">{currentQ.question}</h3>
          
          <div className="space-y-3">
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQ.correct;
              
              let bgColor = 'bg-white/5 hover:bg-white/10';
              if (selectedAnswer !== null) {
                if (isCorrect) {
                  bgColor = 'bg-green-500/20 border-green-500/50';
                } else if (isSelected && !isCorrect) {
                  bgColor = 'bg-red-500/20 border-red-500/50';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-xl border border-white/10 text-left transition-all ${bgColor} ${
                    selectedAnswer === null ? 'hover:border-indigo-500/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer !== null && isCorrect
                        ? 'bg-green-500 border-green-500'
                        : selectedAnswer === index && !isCorrect
                        ? 'bg-red-500 border-red-500'
                        : 'border-white/30'
                    }`}>
                      {selectedAnswer !== null && isCorrect && (
                        <CheckCircle size={16} className="text-white" />
                      )}
                      {selectedAnswer === index && !isCorrect && (
                        <XCircle size={16} className="text-white" />
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explicação (após responder) */}
          {selectedAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
            >
              <h4 className="font-semibold text-blue-400 mb-2">💡 Explicação:</h4>
              <p className="text-gray-300">{currentQ.explanation}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // Tela inicial - seleção de tópico
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Quiz Gerado por IA</h2>
            <p className="text-gray-400">Teste seus conhecimentos com questões personalizadas</p>
          </div>
        </div>

        {availableTopics.length === 0 ? (
          <div className="text-center py-12">
            <Target size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2">Nenhum tópico disponível</h3>
            <p className="text-gray-400 mb-6">Crie um plano de estudos primeiro para gerar quizzes!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Selecione um tópico do seu plano de estudos:
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Escolha um tópico...</option>
                {availableTopics.map((topic) => (
                  <option key={topic.id} value={topic.label}>
                    {topic.label} ({topic.subject} - {topic.plan})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateQuiz}
              disabled={loading || !selectedTopic}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Gerando Quiz...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Gerar Quiz (10 questões)
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
