import { useState } from 'react';
import { BookOpen, Timer, Brain, Trophy, BarChart3 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import StudyPlanner from './components/StudyPlanner';
import PomodoroTimer from './components/PomodoroTimer';
import Flashcards from './components/Flashcards';
import Progress from './components/Progress';
import Onboarding from './components/Onboarding';
import useStore from './store/useStore';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, pomodoroTimer } = useStore();
  const [showOnboarding, setShowOnboarding] = useState(!user.name);

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'planner', label: 'Plano de Estudos', icon: BookOpen },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
    { id: 'flashcards', label: 'Flashcards', icon: Brain },
    { id: 'progress', label: 'Progresso', icon: Trophy },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'planner': return <StudyPlanner />;
      case 'pomodoro': return <PomodoroTimer />;
      case 'flashcards': return <Flashcards />;
      case 'progress': return <Progress />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            StudyBuddy IA
          </h1>
          <p className="text-gray-300">Seu copiloto inteligente de estudos</p>
        </header>

        {/* Navigation */}
        <nav className="glass p-2 mb-8">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
                
                {/* Indicador do timer ativo */}
                {tab.id === 'pomodoro' && pomodoroTimer.isRunning && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </button>
            ))}
            
            {/* Timer flutuante quando ativo */}
            {pomodoroTimer.isRunning && activeTab !== 'pomodoro' && (
              <div className="ml-auto flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-red-400">
                  {Math.floor(pomodoroTimer.timeLeft / 60)}:{(pomodoroTimer.timeLeft % 60).toString().padStart(2, '0')}
                </span>
                <button
                  onClick={() => setActiveTab('pomodoro')}
                  className="text-xs text-red-300 hover:text-red-200 underline"
                >
                  Ver Timer
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Content */}
        <main>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;