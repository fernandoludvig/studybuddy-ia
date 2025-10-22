import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // User data
      user: {
        name: '',
        level: 1,
        xp: 0,
        totalStudyTime: 0,
        streak: 0,
        lastStudyDate: null,
      },
      
      // Study plans
      studyPlans: [],
      currentPlan: null,
      
      // Pomodoro
      pomodoroStats: {
        completed: 0,
        totalMinutes: 0,
      },
      
      // Timer global do Pomodoro
      pomodoroTimer: {
        timeLeft: 25 * 60, // 25 minutos em segundos
        isRunning: false,
        isBreak: false,
        sessionsCompleted: 0,
        soundEnabled: true,
        startTime: null,
        lastUpdateTime: null,
      },
      
          // Flashcards
          flashcards: [],
          
          // Decks
          decks: [],
          
          // Cache de respostas do Claude AI
          claudeCache: {},
          
          // Histórico de atividades
          activityHistory: [],
          studySessions: [],
          achievements: [],
      
      // Actions
      setUser: (userData) => set({ user: { ...get().user, ...userData } }),
      
      addXP: (amount) => set((state) => {
        const newXP = state.user.xp + amount;
        const newLevel = Math.floor(newXP / 100) + 1;
        return {
          user: {
            ...state.user,
            xp: newXP,
            level: newLevel,
          }
        };
      }),
      
      addStudyTime: (minutes) => set((state) => ({
        user: {
          ...state.user,
          totalStudyTime: state.user.totalStudyTime + minutes,
        }
      })),
      
      updateStreak: () => set((state) => {
        const today = new Date().toDateString();
        const lastStudy = state.user.lastStudyDate;
        
        if (lastStudy === today) return state;
        
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastStudy === yesterday ? state.user.streak + 1 : 1;
        
        return {
          user: {
            ...state.user,
            streak: newStreak,
            lastStudyDate: today,
          }
        };
      }),
      
      addStudyPlan: (plan) => set((state) => ({
        studyPlans: [...state.studyPlans, { ...plan, id: crypto.randomUUID() }],
      })),
      
      setCurrentPlan: (plan) => set({ currentPlan: plan }),
      
      // Actions para interação com planos
      markDayComplete: (planId, weekIndex, dayIndex) => set((state) => {
        const updatedPlans = state.studyPlans.map(plan => {
          if (plan.id === planId) {
            const newSchedule = [...plan.schedule];
            const newWeek = { ...newSchedule[weekIndex] };
            const newDays = [...newWeek.days];
            newDays[dayIndex] = {
              ...newDays[dayIndex],
              completed: !newDays[dayIndex].completed,
              completedAt: !newDays[dayIndex].completed ? new Date().toISOString() : null
            };
            newWeek.days = newDays;
            newSchedule[weekIndex] = newWeek;
            return { ...plan, schedule: newSchedule };
          }
          return plan;
        });

        // Atualiza o currentPlan se for o mesmo plano ou se currentPlan for null/undefined
        const updatedCurrentPlan = (state.currentPlan?.id === planId || !state.currentPlan) 
          ? updatedPlans.find(plan => plan.id === planId)
          : state.currentPlan;

        console.log('🔍 Store - markDayComplete saída:', { 
          updatedCurrentPlan: updatedCurrentPlan?.id,
          updatedPlansCount: updatedPlans.length,
          originalCurrentPlan: state.currentPlan?.id
        });

        return {
          studyPlans: updatedPlans,
          currentPlan: updatedCurrentPlan
        };
      }),
      
      toggleTopicComplete: (planId, weekIndex, dayIndex, topicIndex) => set((state) => {
        console.log('🔍 Store - toggleTopicComplete entrada:', { 
          planId, 
          currentPlanId: state.currentPlan?.id, 
          isSamePlan: state.currentPlan?.id === planId 
        });
        
        const updatedPlans = state.studyPlans.map(plan => {
          if (plan.id === planId) {
            const newSchedule = [...plan.schedule];
            const newWeek = { ...newSchedule[weekIndex] };
            const newDays = [...newWeek.days];
            const day = { ...newDays[dayIndex] };
            
            if (!day.completedTopics) day.completedTopics = [];
            
            const isCompleted = day.completedTopics.includes(topicIndex);
            if (isCompleted) {
              day.completedTopics = day.completedTopics.filter(t => t !== topicIndex);
            } else {
              day.completedTopics = [...day.completedTopics, topicIndex];
            }
            
            newDays[dayIndex] = day;
            newWeek.days = newDays;
            newSchedule[weekIndex] = newWeek;
            return { ...plan, schedule: newSchedule };
          }
          return plan;
        });

        // Atualiza o currentPlan se for o mesmo plano ou se currentPlan for null/undefined
        const updatedCurrentPlan = (state.currentPlan?.id === planId || !state.currentPlan) 
          ? updatedPlans.find(plan => plan.id === planId)
          : state.currentPlan;

        console.log('🔍 Store - toggleTopicComplete saída:', { 
          updatedCurrentPlan: updatedCurrentPlan?.id,
          updatedPlansCount: updatedPlans.length,
          originalCurrentPlan: state.currentPlan?.id
        });

        return {
          studyPlans: updatedPlans,
          currentPlan: updatedCurrentPlan
        };
      }),
      
      addNoteToDay: (planId, weekIndex, dayIndex, note) => set((state) => {
        console.log('🔍 Store - addNoteToDay entrada:', { 
          planId, 
          currentPlanId: state.currentPlan?.id, 
          isSamePlan: state.currentPlan?.id === planId 
        });
        
        const updatedPlans = state.studyPlans.map(plan => {
          if (plan.id === planId) {
            const newSchedule = [...plan.schedule];
            const newWeek = { ...newSchedule[weekIndex] };
            const newDays = [...newWeek.days];
            newDays[dayIndex] = {
              ...newDays[dayIndex],
              notes: note
            };
            newWeek.days = newDays;
            newSchedule[weekIndex] = newWeek;
            return { ...plan, schedule: newSchedule };
          }
          return plan;
        });

        // Atualiza o currentPlan se for o mesmo plano ou se currentPlan for null/undefined
        const updatedCurrentPlan = (state.currentPlan?.id === planId || !state.currentPlan) 
          ? updatedPlans.find(plan => plan.id === planId)
          : state.currentPlan;

        console.log('🔍 Store - addNoteToDay saída:', { 
          updatedCurrentPlan: updatedCurrentPlan?.id,
          updatedPlansCount: updatedPlans.length,
          originalCurrentPlan: state.currentPlan?.id
        });

        return {
          studyPlans: updatedPlans,
          currentPlan: updatedCurrentPlan
        };
      }),
      
      deleteStudyPlan: (planId) => set((state) => ({
        studyPlans: state.studyPlans.filter(p => p.id !== planId),
        currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan,
      })),
      
      completePomodoroSession: () => set((state) => ({
        pomodoroStats: {
          completed: state.pomodoroStats.completed + 1,
          totalMinutes: state.pomodoroStats.totalMinutes + 25,
        }
      })),
      
      // Ações do timer global do Pomodoro
      startPomodoroTimer: () => set((state) => ({
        pomodoroTimer: {
          ...state.pomodoroTimer,
          isRunning: true,
          startTime: Date.now(),
          lastUpdateTime: Date.now(),
        }
      })),
      
      pausePomodoroTimer: () => set((state) => {
        if (!state.pomodoroTimer.isRunning) return state;
        
        const now = Date.now();
        const elapsed = Math.floor((now - state.pomodoroTimer.lastUpdateTime) / 1000);
        const newTimeLeft = Math.max(0, state.pomodoroTimer.timeLeft - elapsed);
        
        return {
          pomodoroTimer: {
            ...state.pomodoroTimer,
            isRunning: false,
            timeLeft: newTimeLeft,
            lastUpdateTime: now,
          }
        };
      }),
      
      updatePomodoroTimer: () => set((state) => {
        if (!state.pomodoroTimer.isRunning) return state;
        
        const now = Date.now();
        const elapsed = Math.floor((now - state.pomodoroTimer.lastUpdateTime) / 1000);
        const newTimeLeft = Math.max(0, state.pomodoroTimer.timeLeft - elapsed);
        
        return {
          pomodoroTimer: {
            ...state.pomodoroTimer,
            timeLeft: newTimeLeft,
            lastUpdateTime: now,
          }
        };
      }),
      
      resetPomodoroTimer: () => set((state) => ({
        pomodoroTimer: {
          ...state.pomodoroTimer,
          timeLeft: 25 * 60,
          isRunning: false,
          isBreak: false,
          startTime: null,
          lastUpdateTime: null,
        }
      })),
      
      setPomodoroBreak: (isBreak) => set((state) => ({
        pomodoroTimer: {
          ...state.pomodoroTimer,
          isBreak,
          timeLeft: isBreak ? 5 * 60 : 25 * 60,
          isRunning: false,
          startTime: null,
          lastUpdateTime: null,
        }
      })),
      
      incrementPomodoroSessions: () => set((state) => ({
        pomodoroTimer: {
          ...state.pomodoroTimer,
          sessionsCompleted: state.pomodoroTimer.sessionsCompleted + 1,
        }
      })),
      
      togglePomodoroSound: () => set((state) => ({
        pomodoroTimer: {
          ...state.pomodoroTimer,
          soundEnabled: !state.pomodoroTimer.soundEnabled,
        }
      })),
      
      addFlashcard: (flashcard) => set((state) => {
        const newCard = { ...flashcard, id: crypto.randomUUID() };
        
        // Atualiza contagem do deck
        const updatedDecks = state.decks.map(deck => 
          deck.id === flashcard.deckId 
            ? { ...deck, cardsCount: deck.cardsCount + 1 }
            : deck
        );
        
        return {
          flashcards: [...state.flashcards, newCard],
          decks: updatedDecks,
        };
      }),
      
      deleteFlashcard: (id) => set((state) => ({
        flashcards: state.flashcards.filter(card => card.id !== id),
      })),
      
      clearAllFlashcards: () => set({ flashcards: [] }),
      
      // Ações dos Decks
      createDeck: (deck) => set((state) => ({
        decks: [...state.decks, {
          id: crypto.randomUUID(),
          name: deck.name,
          color: deck.color || '#8b5cf6',
          createdAt: new Date().toISOString(),
          cardsCount: 0,
        }],
      })),
      
      deleteDeck: (deckId) => set((state) => ({
        decks: state.decks.filter(d => d.id !== deckId),
        flashcards: state.flashcards.filter(card => card.deckId !== deckId),
      })),
      
      updateDeck: (deckId, updates) => set((state) => ({
        decks: state.decks.map(d => 
          d.id === deckId ? { ...d, ...updates } : d
        ),
      })),
      
      // Cache do Claude AI
      getCachedResponse: (theme, numberOfCards) => {
        const cacheKey = `${theme.toLowerCase()}_${numberOfCards}`;
        return get().claudeCache[cacheKey] || null;
      },
      
      setCachedResponse: (theme, numberOfCards, flashcards) => {
        const cacheKey = `${theme.toLowerCase()}_${numberOfCards}`;
        set((state) => ({
          claudeCache: {
            ...state.claudeCache,
            [cacheKey]: {
              flashcards,
              timestamp: Date.now(),
              theme,
              numberOfCards
            }
          }
        }));
      },
      
      clearCache: () => set({ claudeCache: {} }),
      
      // Actions para histórico
      addActivityToHistory: (activity) => set((state) => ({
        activityHistory: [
          ...state.activityHistory,
          {
            ...activity,
            date: new Date().toISOString(),
            id: crypto.randomUUID(),
          }
        ].slice(-100), // Mantém últimas 100 atividades
      })),
      
      addStudySession: (session) => set((state) => ({
        studySessions: [
          ...state.studySessions,
          {
            ...session,
            date: new Date().toISOString(),
            id: crypto.randomUUID(),
          }
        ],
      })),
      
      unlockAchievement: (achievement) => set((state) => {
        const alreadyUnlocked = state.achievements.some(a => a.id === achievement.id);
        if (alreadyUnlocked) return state;
        
        return {
          achievements: [...state.achievements, { ...achievement, unlockedAt: new Date().toISOString() }],
        };
      }),
    }),
    {
      name: 'studybuddy-storage',
    }
  )
);

export default useStore;
