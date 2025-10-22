import { useState, useMemo } from 'react';
import { Trophy, Target, Flame, Clock, Star, TrendingUp, Award, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useStore from '../store/useStore';

export default function Progress() {
  const { user, pomodoroStats, flashcards, studyPlans, activityHistory, studySessions, achievements } = useStore();
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, all

  // Calcula dados reais para gráficos baseado no histórico do usuário
  const chartData = useMemo(() => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const data = [];
    
    // Se não há dados reais, mostra mensagem
    if (activityHistory.length === 0 && studySessions.length === 0) {
      return [];
    }
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calcula XP real do dia (baseado no histórico)
      const dayActivities = activityHistory.filter(activity => 
        activity.date.startsWith(dateStr)
      );
      const dayXP = dayActivities.reduce((total, activity) => total + (activity.xp || 0), 0);
      
      // Calcula tempo de estudo real do dia
      const daySessions = studySessions.filter(session => 
        session.date.startsWith(dateStr)
      );
      const dayStudyTime = daySessions.reduce((total, session) => total + (session.duration || 0), 0);
      
      // Calcula pomodoros reais do dia
      const dayPomodoros = dayActivities.filter(activity => 
        activity.type === 'pomodoro'
      ).length;
      
      data.push({
        date: dateStr,
        shortDate: `${date.getDate()}/${date.getMonth() + 1}`,
        xp: dayXP,
        studyTime: dayStudyTime,
        pomodoros: dayPomodoros,
      });
    }
    
    return data;
  }, [timeRange, activityHistory, studySessions]);

  // Estatísticas gerais
  const stats = [
    {
      label: 'Nível Atual',
      value: user.level,
      icon: Star,
      color: 'from-yellow-400 to-orange-500',
      subtext: `${user.xp % 100}/100 XP`,
    },
    {
      label: 'Tempo Total',
      value: `${Math.floor(user.totalStudyTime / 60)}h`,
      icon: Clock,
      color: 'from-blue-400 to-cyan-500',
      subtext: `${user.totalStudyTime % 60}min extras`,
    },
    {
      label: 'Sequência',
      value: `${user.streak}`,
      icon: Flame,
      color: 'from-red-400 to-pink-500',
      subtext: 'dias consecutivos',
    },
    {
      label: 'Pomodoros',
      value: pomodoroStats.completed,
      icon: Target,
      color: 'from-green-400 to-emerald-500',
      subtext: `${pomodoroStats.totalMinutes}min focados`,
    },
  ];

  // Conquistas disponíveis
  const allAchievements = [
    { id: 'first_study', name: 'Primeira Sessão', description: 'Complete seu primeiro pomodoro', icon: '🎯', unlocked: pomodoroStats.completed >= 1 },
    { id: 'streak_3', name: 'Consistente', description: 'Estude 3 dias seguidos', icon: '🔥', unlocked: user.streak >= 3 },
    { id: 'streak_7', name: 'Disciplinado', description: 'Estude 7 dias seguidos', icon: '💪', unlocked: user.streak >= 7 },
    { id: 'level_5', name: 'Aprendiz', description: 'Alcance o nível 5', icon: '⭐', unlocked: user.level >= 5 },
    { id: 'level_10', name: 'Estudioso', description: 'Alcance o nível 10', icon: '🌟', unlocked: user.level >= 10 },
    { id: 'flashcards_10', name: 'Memória Ativa', description: 'Crie 10 flashcards', icon: '🎴', unlocked: flashcards.length >= 10 },
    { id: 'pomodoro_10', name: 'Focado', description: 'Complete 10 pomodoros', icon: '🍅', unlocked: pomodoroStats.completed >= 10 },
    { id: 'study_plan', name: 'Planejador', description: 'Crie um plano de estudos', icon: '📚', unlocked: studyPlans.length >= 1 },
  ];

  // Dados reais para gráfico de pizza (distribuição de atividades)
  const activityDistribution = [
    { name: 'Pomodoro', value: pomodoroStats.totalMinutes, color: '#ef4444' },
    { name: 'Flashcards', value: flashcards.length * 2, color: '#8b5cf6' },
    { name: 'Planos', value: studyPlans.length * 10, color: '#3b82f6' },
  ].filter(item => item.value > 0); // Remove itens com valor zero

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Seu Progresso</h2>
              <p className="text-gray-400">Acompanhe sua evolução</p>
            </div>
          </div>

          {/* Filtro de tempo */}
          <div className="flex gap-2">
            {['7days', '30days', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {range === '7days' ? '7 dias' : range === '30days' ? '30 dias' : 'Tudo'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Cards de Estatísticas */}
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
              <stat.icon size={24} />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
            <div className="text-xs text-gray-500">{stat.subtext}</div>
          </motion.div>
        ))}
      </div>

      {/* Gráficos */}
      {chartData.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 text-center"
        >
          <Trophy size={64} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-bold mb-2">Nenhum dado ainda</h3>
          <p className="text-gray-400 mb-6">
            Use o Pomodoro Timer, crie flashcards e planos de estudo para ver seus dados aqui!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="text-sm text-gray-500">
              <div className="font-semibold mb-2">Para gerar dados:</div>
              <div>• Complete sessões de Pomodoro</div>
              <div>• Crie flashcards</div>
              <div>• Gere planos de estudo</div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de XP ao longo do tempo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-400" />
            Evolução de XP
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="shortDate" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="xp"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de tempo de estudo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-400" />
            Tempo de Estudo (minutos)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="shortDate" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="studyTime" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de Pomodoros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target size={20} className="text-green-400" />
            Pomodoros Completos
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="shortDate" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="pomodoros" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribuição de Atividades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-purple-400" />
            Distribuição de Atividades
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={activityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {activityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
        </div>
      )}

      {/* Conquistas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Award size={28} className="text-yellow-400" />
          <div>
            <h3 className="text-2xl font-bold">Conquistas</h3>
            <p className="text-gray-400">
              {allAchievements.filter(a => a.unlocked).length}/{allAchievements.length} desbloqueadas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.05 }}
              className={`p-6 rounded-xl text-center transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/50'
                  : 'bg-white/5 border border-white/10 opacity-50'
              }`}
            >
              <div className="text-4xl mb-3">{achievement.icon}</div>
              <div className="font-bold mb-1">{achievement.name}</div>
              <div className="text-xs text-gray-400">{achievement.description}</div>
              {achievement.unlocked && (
                <div className="mt-3 text-xs text-green-400 flex items-center justify-center gap-1">
                  <Trophy size={14} />
                  Desbloqueado!
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Heatmap de Atividade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="glass p-8"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Flame size={20} className="text-orange-400" />
          Atividade dos Últimos 30 Dias
        </h3>
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 30 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dateStr = date.toISOString().split('T')[0];
            
            // Calcula atividade real do dia
            const dayActivities = activityHistory.filter(activity => 
              activity.date.startsWith(dateStr)
            );
            const daySessions = studySessions.filter(session => 
              session.date.startsWith(dateStr)
            );
            
            const totalActivity = dayActivities.length + daySessions.length;
            const intensity = totalActivity > 5 ? 1 : totalActivity > 2 ? 0.6 : totalActivity > 0 ? 0.3 : 0;
            
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg transition-all hover:scale-110 ${
                  intensity > 0.7
                    ? 'bg-green-500'
                    : intensity > 0.4
                    ? 'bg-green-500/60'
                    : intensity > 0.2
                    ? 'bg-green-500/30'
                    : 'bg-white/10'
                }`}
                title={`Dia ${30 - i} - ${totalActivity} atividades`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
          <span>Menos ativo</span>
          <div className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded bg-white/10" />
            <div className="w-4 h-4 rounded bg-green-500/30" />
            <div className="w-4 h-4 rounded bg-green-500/60" />
            <div className="w-4 h-4 rounded bg-green-500" />
          </div>
          <span>Mais ativo</span>
        </div>
      </motion.div>
    </div>
  );
}