import { TrendingUp, Flame, Clock, Star } from 'lucide-react';
import useStore from '../store/useStore';
import { motion } from 'framer-motion';

export default function Dashboard({ onNavigate }) {
  const { user, pomodoroStats } = useStore();

  const stats = [
    {
      label: 'Nível',
      value: user.level,
      icon: Star,
      color: 'from-yellow-400 to-orange-500',
    },
    {
      label: 'XP',
      value: `${user.xp}/${user.level * 100}`,
      icon: TrendingUp,
      color: 'from-green-400 to-emerald-500',
    },
    {
      label: 'Sequência',
      value: `${user.streak} dias`,
      icon: Flame,
      color: 'from-red-400 to-pink-500',
    },
    {
      label: 'Tempo Total',
      value: `${Math.floor(user.totalStudyTime / 60)}h`,
      icon: Clock,
      color: 'from-blue-400 to-cyan-500',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8"
      >
        <h2 className="text-2xl font-bold mb-6">
          Olá, {user.name || 'Estudante'}! 👋
        </h2>
        <p className="text-gray-300 mb-4">
          Continue assim! Você está no nível {user.level} e já estudou {Math.floor(user.totalStudyTime / 60)} horas.
        </p>
        
        {/* XP Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso até o próximo nível</span>
            <span>{user.xp % 100}/100 XP</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(user.xp % 100)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass p-6"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={24} className="text-white" />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass p-6"
      >
        <h3 className="text-xl font-bold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            className="btn-primary"
            onClick={() => onNavigate && onNavigate('planner')}
          >
            Criar Plano de Estudos
          </button>
          <button 
            className="btn-primary"
            onClick={() => onNavigate && onNavigate('pomodoro')}
          >
            Iniciar Pomodoro
          </button>
          <button 
            className="btn-primary"
            onClick={() => onNavigate && onNavigate('flashcards')}
          >
            Gerar Flashcards
          </button>
        </div>
      </motion.div>
    </div>
  );
}
