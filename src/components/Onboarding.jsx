import { useState } from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState('');
  const { setUser } = useStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      setUser({ name: name.trim() });
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 max-w-md w-full text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl mb-6"
        >
          🎓
        </motion.div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Bem-vindo ao StudyBuddy IA!
        </h1>
        
        <p className="text-gray-300 mb-8">
          Seu copiloto inteligente de estudos com IA
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você se chama?"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg"
            autoFocus
          />
          
          <button
            type="submit"
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Começar Jornada
          </button>
        </form>

        <div className="mt-8 grid grid-cols-3 gap-4 text-xs text-gray-400">
          <div>
            <div className="text-2xl mb-1">🧠</div>
            IA Integrada
          </div>
          <div>
            <div className="text-2xl mb-1">🎯</div>
            Gamificação
          </div>
          <div>
            <div className="text-2xl mb-1">📊</div>
            Analytics
          </div>
        </div>
      </motion.div>
    </div>
  );
}
