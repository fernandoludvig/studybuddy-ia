import { useEffect, useRef } from 'react';
import useStore from '../store/useStore';

export default function usePomodoroTimer() {
  const {
    pomodoroTimer,
    startPomodoroTimer,
    pausePomodoroTimer,
    updatePomodoroTimer,
    resetPomodoroTimer,
    setPomodoroBreak,
    incrementPomodoroSessions,
    togglePomodoroSound,
    addXP,
    completePomodoroSession,
    addStudyTime,
    updateStreak,
    addActivityToHistory,
    addStudySession,
  } = useStore();

  const intervalRef = useRef(null);

  // Atualiza o timer a cada segundo quando está rodando
  useEffect(() => {
    if (pomodoroTimer.isRunning) {
      intervalRef.current = setInterval(() => {
        updatePomodoroTimer();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pomodoroTimer.isRunning, updatePomodoroTimer]);

  // Verifica se o timer chegou a zero
  useEffect(() => {
    if (pomodoroTimer.timeLeft === 0 && pomodoroTimer.isRunning) {
      handleTimerComplete();
    }
  }, [pomodoroTimer.timeLeft, pomodoroTimer.isRunning]);

  const handleTimerComplete = () => {
    pausePomodoroTimer();
    
    if (!pomodoroTimer.isBreak) {
      // Sessão de foco completa
      completePomodoroSession();
      addStudyTime(25);
      addXP(50); // 50 XP por pomodoro
      updateStreak();
      incrementPomodoroSessions();
      
      // Registra atividade no histórico
      addActivityToHistory({
        type: 'pomodoro',
        description: 'Pomodoro completado',
        xp: 50,
        duration: 25
      });
      
      addStudySession({
        type: 'pomodoro',
        duration: 25,
        description: 'Sessão de foco de 25 minutos'
      });
      
      if (pomodoroTimer.soundEnabled) {
        playSound();
      }
      
      // Notificação
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 Pomodoro Completo!', {
          body: 'Parabéns! Você ganhou 50 XP. Hora de fazer uma pausa!',
        });
      }
      
      // Inicia pausa automática
      setPomodoroBreak(true);
    } else {
      // Pausa completa
      if (pomodoroTimer.soundEnabled) {
        playSound();
      }
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏰ Pausa Terminada!', {
          body: 'Hora de voltar aos estudos!',
        });
      }
      
      setPomodoroBreak(false);
    }
  };

  const playSound = () => {
    // Som de conclusão (beep simples)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => {
    if (pomodoroTimer.isRunning) {
      pausePomodoroTimer();
    } else {
      startPomodoroTimer();
    }
  };

  const resetTimer = () => {
    resetPomodoroTimer();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = pomodoroTimer.isBreak 
    ? ((5 * 60 - pomodoroTimer.timeLeft) / (5 * 60)) * 100
    : ((25 * 60 - pomodoroTimer.timeLeft) / (25 * 60)) * 100;

  return {
    ...pomodoroTimer,
    toggleTimer,
    resetTimer,
    formatTime,
    progress,
    toggleSound: togglePomodoroSound,
  };
}
