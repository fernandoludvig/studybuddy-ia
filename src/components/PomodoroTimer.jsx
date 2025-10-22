import { useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer, Zap, Star, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import usePomodoroTimer from '../hooks/usePomodoroTimer';

export default function PomodoroTimer() {
  const {
    timeLeft,
    isRunning,
    isBreak,
    sessionsCompleted,
    soundEnabled,
    toggleTimer,
    resetTimer,
    formatTime,
    progress,
    toggleSound,
  } = usePomodoroTimer();

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="space-y-6">
      {/* Timer Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-12 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
            isBreak ? 'from-green-500 to-emerald-600' : 'from-red-500 to-pink-600'
          } flex items-center justify-center`}>
            <Timer size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {isBreak ? '☕ Pausa' : '🎯 Foco Total'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isBreak ? 'Relaxe um pouco!' : 'Mantenha o foco!'}
            </p>
          </div>
        </div>

        {/* Círculo de Progresso */}
        <div className="relative w-72 h-72 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="144"
              cy="144"
              r="120"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="16"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="144"
              cy="144"
              r="120"
              stroke={isBreak ? '#10b981' : '#f43f5e'}
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progress / 100) }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          
          {/* Timer no centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div>
              <div className="text-6xl font-bold mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="text-gray-400">
                {isBreak ? 'Pausa' : 'Foco'}
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleTimer}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg"
          >
            {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>
          
          <button
            onClick={resetTimer}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300"
          >
            <RotateCcw size={24} />
          </button>
          
          <button
            onClick={toggleSound}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300"
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </div>

        {/* Mensagem de Incentivo */}
        {isRunning && !isBreak && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-lg text-gray-300"
          >
            💪 Continue assim! Você ganha <span className="text-yellow-400 font-bold">50 XP</span> ao completar!
          </motion.p>
        )}
      </motion.div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Star size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold">{sessionsCompleted}</div>
              <div className="text-gray-400 text-sm">Sessões Hoje</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold">{sessionsCompleted * 50}</div>
              <div className="text-gray-400 text-sm">XP Ganho Hoje</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <Timer size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold">{sessionsCompleted * 25}</div>
              <div className="text-gray-400 text-sm">Minutos de Foco</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dicas de Pomodoro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-6"
      >
        <h3 className="text-xl font-bold mb-4">💡 Dicas para um Pomodoro Eficaz</h3>
        <div className="grid gap-3">
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-gray-200">🎯 <strong>Elimine distrações:</strong> Silencie notificações e feche redes sociais</p>
          </div>
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-gray-200">☕ <strong>Pause ativamente:</strong> Levante, estique-se, hidrate-se</p>
          </div>
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-gray-200">📝 <strong>Planeje antes:</strong> Saiba exatamente o que estudar no próximo pomodoro</p>
          </div>
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
            <p className="text-gray-200">🏆 <strong>Celebre conquistas:</strong> Cada pomodoro completo é uma vitória!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
