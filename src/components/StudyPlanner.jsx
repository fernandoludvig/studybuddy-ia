import { useState, useEffect } from 'react';
import { Sparkles, Calendar, BookOpen, Target, Loader2, CheckCircle, Circle, StickyNote, Trash2, Edit3, X, ChevronDown, ChevronUp, HelpCircle, Play, Trophy, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { generateStudyPlan } from '../services/aiService';

export default function StudyPlanner() {
  const { 
    studyPlans, 
    currentPlan, 
    addStudyPlan, 
    setCurrentPlan, 
    markDayComplete, 
    toggleTopicComplete, 
    addNoteToDay,
    deleteStudyPlan,
    addXP,
    addActivityToHistory,
    addQuizResult
  } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState(currentPlan ? 'plan' : 'create'); // create, plans, plan
  const [expandedWeeks, setExpandedWeeks] = useState([0]);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Estados do Quiz
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Debug: forçar re-renderização quando currentPlan muda
  useEffect(() => {
    console.log('🔄 CurrentPlan atualizado:', currentPlan);
    console.log('📱 View atual:', view);
    setForceUpdate(prev => prev + 1);
    
    // Só atualizar view se currentPlan for null/undefined (não quando é atualizado)
    if (!currentPlan && studyPlans.length > 0) {
      console.log('🔄 Mudando view para plans (currentPlan null)');
      setView('plans');
    } else if (!currentPlan && studyPlans.length === 0) {
      console.log('🔄 Mudando view para create (currentPlan null e sem planos)');
      setView('create');
    } else if (currentPlan) {
      console.log('✅ CurrentPlan existe, mantendo view atual:', view);
    }
    // Se currentPlan existe, manter a view atual (não resetar)
  }, [currentPlan, studyPlans.length]);
  
  const [formData, setFormData] = useState({
    subjects: '',
    subSubjects: '',
    examDate: '',
    hoursPerDay: '',
    difficulty: 'intermediario',
    goal: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const plan = await generateStudyPlan(formData);
      addStudyPlan(plan);
      setCurrentPlan(plan);
      addXP(100, 'study_plan_created');
      setView('plan');
    } catch (error) {
      console.error('Erro ao gerar plano:', error);
      alert('Erro ao gerar plano de estudos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks(prev => 
      prev.includes(weekIndex) 
        ? prev.filter(w => w !== weekIndex)
        : [...prev, weekIndex]
    );
  };

  // Funções do Quiz
  const generateQuiz = async (topic) => {
    console.log('🎯 generateQuiz chamado com tópico:', topic);
    
    if (!topic.trim()) {
      alert('Digite um tópico para o quiz!');
      return;
    }

    console.log('🔄 Iniciando geração de quiz...');
    setQuizLoading(true);
    setQuiz(null);
    setCurrentQuestion(0);
    setQuizAnswers([]);
    setShowQuizResult(false);
    setQuizCompleted(false);
    setQuizTopic(topic);

    try {
      const apiUrl = '/api/generate-quiz';
      console.log('📡 Fazendo requisição para:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic,
          numberOfQuestions: 10
        }),
      });

      console.log('📡 Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Quiz gerado:', data);
      setQuiz(data);
      
      // Mostrar mensagem de sucesso
      alert(`🎉 Quiz criado com sucesso! ${data.quiz.length} questões sobre "${topic}"`);
      
      // Adicionar atividade ao histórico
      addActivityToHistory({
        type: 'quiz_started',
        description: `Iniciou quiz sobre: ${topic}`,
        xp: 0,
        source: 'quiz_generation'
      });

    } catch (error) {
      console.error('❌ Erro ao gerar quiz:', error);
      alert(`❌ Erro ao gerar quiz: ${error.message}`);
    } finally {
      setQuizLoading(false);
      console.log('🏁 Quiz loading finalizado');
    }
  };

  const handleQuizAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    
    const newAnswers = [...quizAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setQuizAnswers(newAnswers);

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
      description: `Completou quiz sobre: ${quizTopic} - ${percentage}% de acerto`,
      xp: xpEarned,
      source: 'quiz_completion'
    });

    // Salvar resultado do quiz
    addQuizResult({
      topic: quizTopic,
      totalQuestions: quiz.quiz.length,
      correctAnswers: correctAnswers,
      percentage: percentage,
      xpEarned: xpEarned,
      answers: finalAnswers,
      quiz: quiz.quiz
    });

    setQuizCompleted(true);
    setShowQuizResult(true);
  };

  const restartQuiz = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setQuizAnswers([]);
    setShowQuizResult(false);
    setQuizCompleted(false);
    setSelectedAnswer(null);
    setQuizTopic('');
  };

  const handleSaveNote = (planId, weekIndex, dayIndex) => {
    console.log('💾 Salvando nota:', { planId, weekIndex, dayIndex, noteText });
    console.log('📊 Estado antes de salvar:', { 
      currentPlan: currentPlan,
      day: currentPlan?.schedule?.[weekIndex]?.days?.[dayIndex]
    });
    
    if (!noteText.trim()) {
      console.log('⚠️ Nota vazia, não salvando');
      return;
    }
    
    addNoteToDay(planId, weekIndex, dayIndex, noteText);
    setEditingNote(null);
    setNoteText('');
    addXP(5);
    
    // Log do estado após salvar
    setTimeout(() => {
      console.log('📊 Estado após salvar nota:', { 
        currentPlan: currentPlan,
        day: currentPlan?.schedule?.[weekIndex]?.days?.[dayIndex]
      });
    }, 100);
    
    console.log('✅ Nota salva com sucesso!');
  };

  const calculateProgress = (plan) => {
    let totalDays = 0;
    let completedDays = 0;
    
    plan.schedule.forEach(week => {
      week.days.forEach(day => {
        totalDays++;
        if (day.completed) completedDays++;
      });
    });
    
    return Math.round((completedDays / totalDays) * 100);
  };

  // Função de exportação removida
  const _removed_exportPlanAsImage = async (planId) => {
    const element = document.getElementById(`plan-${planId}`);
    if (!element) {
      console.error('❌ Elemento não encontrado para exportação');
      return;
    }
    
    try {
      console.log('📸 Iniciando exportação da imagem...');
      console.log('🔍 Elemento encontrado:', element);
      console.log('📏 Dimensões do elemento:', {
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight
      });
      
      // Aguardar um pouco para garantir que o DOM está renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Configurações otimizadas para html2canvas com fundo claro
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff', // Fundo branco
        scale: 1.5, // Reduzir escala para evitar problemas
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: true, // Habilitar logs para debug
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        // Configurações para melhor renderização
        onclone: (clonedDoc) => {
          // Aplicar estilos específicos para exportação com fundo claro
          const exportContainer = clonedDoc.querySelector('.export-container');
          if (exportContainer) {
            exportContainer.style.background = '#ffffff';
            exportContainer.style.minHeight = '100vh';
            exportContainer.style.padding = '2rem';
            exportContainer.style.color = '#1f2937';
          }
          
          // Remover elementos que podem causar problemas na exportação
          const elementsToHide = clonedDoc.querySelectorAll('.hover\\:bg-white\\/5, .group-hover\\:opacity-100, button[onclick*="exportPlanAsImage"], button[onclick*="deleteStudyPlan"]');
          elementsToHide.forEach(el => {
            el.style.display = 'none';
          });
          
          // Converter para tema claro
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            // Converter cores escuras para claras
            if (el.style.backgroundColor && el.style.backgroundColor.includes('rgba(255, 255, 255, 0.1)')) {
              el.style.backgroundColor = '#f8fafc';
              el.style.border = '1px solid #e2e8f0';
            }
            
            // Converter textos escuros para claros
            if (el.style.color === 'rgb(255, 255, 255)' || el.style.color === 'white') {
              el.style.color = '#1f2937';
            }
            if (el.style.color === 'rgb(209, 213, 219)' || el.style.color.includes('rgb(209, 213, 219)')) {
              el.style.color = '#4b5563';
            }
            if (el.style.color === 'rgb(156, 163, 175)' || el.style.color.includes('rgb(156, 163, 175)')) {
              el.style.color = '#6b7280';
            }
          });
          
          // Melhorar visibilidade dos cards com tema claro
          const glassElements = clonedDoc.querySelectorAll('.glass');
          glassElements.forEach(el => {
            el.style.backgroundColor = '#f8fafc';
            el.style.border = '1px solid #e2e8f0';
            el.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          });
        }
      });
      
      console.log('✅ Canvas criado:', canvas.width, 'x', canvas.height);
      
      // Verificar se o canvas tem conteúdo
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
      const data = imageData.data;
      let hasContent = false;
      
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          hasContent = true;
          break;
        }
      }
      
      if (!hasContent) {
        console.warn('⚠️ Canvas parece estar vazio, tentando método alternativo...');
        
        // Método alternativo: capturar o body inteiro
        const bodyCanvas = await html2canvas(document.body, {
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
          allowTaint: true,
          logging: true
        });
        
        // Usar o canvas do body se o elemento específico falhar
        const link = document.createElement('a');
        link.download = `plano-de-estudos-${currentPlan?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'plano'}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = bodyCanvas.toDataURL('image/png', 1.0);
        
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Imagem exportada usando método alternativo!');
        return;
      }
      
      // Criar um canvas final com padding e melhor formatação
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      const padding = 40;
      
      finalCanvas.width = canvas.width + (padding * 2);
      finalCanvas.height = canvas.height + (padding * 2);
      
      // Preencher fundo branco
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Desenhar a imagem original com padding
      finalCtx.drawImage(canvas, padding, padding);
      
      // Adicionar borda sutil
      finalCtx.strokeStyle = '#e2e8f0';
      finalCtx.lineWidth = 2;
      finalCtx.strokeRect(1, 1, finalCanvas.width - 2, finalCanvas.height - 2);
      
      const link = document.createElement('a');
      link.download = `plano-de-estudos-${currentPlan?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'plano'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = finalCanvas.toDataURL('image/png', 1.0);
      
      // Adicionar ao DOM temporariamente para evitar problemas de redirecionamento
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Imagem exportada com sucesso!');
      addXP(20);
    } catch (error) {
      console.error('❌ Erro ao exportar:', error);
      alert('Erro ao exportar imagem. Tente novamente.');
    }
  };

  // Função de exportação removida
  const _removed_exportPlanAsPDF = async (planId) => {
    const element = document.getElementById(`plan-${planId}`);
    if (!element) {
      console.error('❌ Elemento não encontrado para exportação');
      return;
    }
    
    try {
      console.log('📄 Iniciando exportação do PDF...');
      console.log('🔍 Elemento encontrado:', element);
      console.log('📏 Dimensões do elemento:', {
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight
      });
      
      // Aguardar um pouco para garantir que o DOM está renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Configurações para html2canvas com fundo claro
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 1.5, // Reduzir escala para evitar problemas
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: true, // Habilitar logs para debug
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Aplicar tema claro para PDF
          const exportContainer = clonedDoc.querySelector('.export-container');
          if (exportContainer) {
            exportContainer.style.background = '#ffffff';
            exportContainer.style.color = '#1f2937';
            exportContainer.style.padding = '2rem';
          }
          
          // Remover elementos interativos
          const elementsToHide = clonedDoc.querySelectorAll('button, .hover\\:bg-white\\/5, .group-hover\\:opacity-100');
          elementsToHide.forEach(el => {
            el.style.display = 'none';
          });
          
          // Converter para tema claro
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            if (el.style.backgroundColor && el.style.backgroundColor.includes('rgba(255, 255, 255, 0.1)')) {
              el.style.backgroundColor = '#f8fafc';
              el.style.border = '1px solid #e2e8f0';
            }
            if (el.style.color === 'rgb(255, 255, 255)' || el.style.color === 'white') {
              el.style.color = '#1f2937';
            }
          });
        }
      });
      
      console.log('✅ Canvas criado:', canvas.width, 'x', canvas.height);
      
      // Verificar se o canvas tem conteúdo
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
      const data = imageData.data;
      let hasContent = false;
      
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
          hasContent = true;
          break;
        }
      }
      
      if (!hasContent) {
        console.warn('⚠️ Canvas parece estar vazio, tentando método alternativo...');
        
        // Método alternativo: capturar o body inteiro
        const bodyCanvas = await html2canvas(document.body, {
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
          allowTaint: true,
          logging: true
        });
        
        // Usar o canvas do body se o elemento específico falhar
        const imgData = bodyCanvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (bodyCanvas.height * imgWidth) / bodyCanvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        const fileName = `plano-de-estudos-${currentPlan?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'plano'}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        console.log('✅ PDF exportado usando método alternativo!');
        return;
      }
      
      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Salvar PDF
      const fileName = `plano-de-estudos-${currentPlan?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'plano'}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF exportado com sucesso!');
      addXP(25);
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
    }
  };

  // VIEW: Lista de planos
  if (view === 'plans') {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Meus Planos de Estudo</h2>
                <p className="text-gray-400">{studyPlans.length} planos criados</p>
              </div>
            </div>
            <button onClick={() => setView('create')} className="btn-primary">
              <Sparkles size={18} className="inline mr-2" />Novo Plano
            </button>
          </div>

          {studyPlans.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={64} className="mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold mb-2">Nenhum plano ainda</h3>
              <p className="text-gray-400">Crie seu primeiro plano de estudos!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {studyPlans.map((plan, index) => {
                const progress = calculateProgress(plan);
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass p-6 hover:bg-white/5 transition-all cursor-pointer relative group"
                    onClick={() => { setCurrentPlan(plan); setView('plan'); }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteStudyPlan(plan.id); }}
                      className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.overview}</p>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-sm text-gray-400">{plan.schedule.length} semanas</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">{progress}% completo</span>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
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

  // VIEW: Plano específico (interativo)
  if (view === 'plan' && currentPlan) {
    const progress = calculateProgress(currentPlan);
    
    return (
      <div className="space-y-6">
        {/* Header do plano */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setView('plans')} className="text-gray-400 hover:text-white">
              ← Voltar para planos
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const topic = currentPlan.subjects[0] + ' - ' + (currentPlan.schedule[0]?.days[0]?.topics[0] || 'Geral') || currentPlan.subjects[0] || 'Tópico do plano';
                  generateQuiz(topic);
                }}
                className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
                disabled={quizLoading}
              >
                {quizLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <HelpCircle size={16} />
                )}
                Gerar Quiz
              </button>
              <button
                onClick={() => deleteStudyPlan(currentPlan.id)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl flex items-center gap-2"
              >
                <Trash2 size={16} />Deletar
              </button>
            </div>
          </div>
          
          <div id={`plan-${currentPlan.id}`} className="export-container">
            <h2 className="text-3xl font-bold mb-1">{currentPlan.title}</h2>
            <p className="text-gray-300 mb-2">{currentPlan.overview}</p>

            {/* Progresso geral */}
            <div className="mb-2">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Progresso Total</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full"
                />
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-4 gap-4 mb-2">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-indigo-400">{currentPlan.schedule.length}</div>
                <div className="text-sm text-gray-400">Semanas</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {currentPlan.schedule.reduce((acc, week) => acc + week.days.length, 0)}
                </div>
                <div className="text-sm text-gray-400">Dias</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {currentPlan.schedule.reduce((acc, week) => 
                    acc + week.days.filter(d => d.completed).length, 0
                  )}
                </div>
                <div className="text-sm text-gray-400">Completos</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{progress}%</div>
                <div className="text-sm text-gray-400">Progresso</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cronograma por semana */}
        <div className="space-y-1">
          {currentPlan.schedule.map((week, weekIndex) => {
            const isExpanded = expandedWeeks.includes(weekIndex);
            const weekCompleted = week.days.every(d => d.completed);
            const weekProgress = (week.days.filter(d => d.completed).length / week.days.length) * 100;
            
            return (
              <motion.div
                key={weekIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: weekIndex * 0.05 }}
                className="glass overflow-hidden"
              >
                {/* Header da semana */}
                <button
                  onClick={() => toggleWeek(weekIndex)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      weekCompleted ? 'bg-green-500' : 'bg-indigo-500/20'
                    }`}>
                      {weekCompleted ? <CheckCircle size={24} /> : <span className="font-bold">{week.week}</span>}
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold">Semana {week.week}</h3>
                      <p className="text-sm text-gray-400">
                        {week.days.filter(d => d.completed).length}/{week.days.length} dias completos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${weekProgress}%` }}
                      />
                    </div>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </button>

                {/* Dias da semana */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6"
                    >
                      <div className="space-y-3">
                        {week.days.map((day, dayIndex) => {
                          const isEditingThisNote = editingNote?.weekIndex === weekIndex && editingNote?.dayIndex === dayIndex;
                          
                          // Debug: verificar estrutura do day
                          console.log('🔍 Day data:', { 
                            day: day.day, 
                            completedTopics: day.completedTopics, 
                            topics: day.topics 
                          });
                          
                          const completedTopicsCount = day.completedTopics?.length || 0;
                          const topicsProgress = (completedTopicsCount / day.topics.length) * 100;
                          
                          return (
                            <motion.div
                              key={dayIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: dayIndex * 0.05 }}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                day.completed
                                  ? 'bg-green-500/10 border-green-500/50'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              {/* Header do dia */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('📅 Marcando dia como completo:', { planId: currentPlan.id, weekIndex, dayIndex, completed: day.completed });
                                      const wasCompleted = day.completed;
                                      markDayComplete(currentPlan.id, weekIndex, dayIndex);
                                      if (!wasCompleted) {
                                        addXP(25);
                                        console.log('✅ Dia marcado como completo! +25 XP');
                                      } else {
                                        console.log('❌ Dia desmarcado');
                                      }
                                    }}
                                    className="mt-1"
                                  >
                                    {day.completed ? (
                                      <CheckCircle size={24} className="text-green-400" />
                                    ) : (
                                      <Circle size={24} className="text-gray-400 hover:text-white" />
                                    )}
                                  </button>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-lg">{day.day}</h4>
                                      <span className="text-sm bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">
                                        {day.hours}h
                                      </span>
                                    </div>
                                    
                                    {/* Matérias */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {day.subjects.map((subject, i) => (
                                        <span
                                          key={`${day.day}-subject-${i}`}
                                          className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg"
                                        >
                                          {subject}
                                        </span>
                                      ))}
                                    </div>
                                    
                                    {/* Tópicos com checkbox */}
                                    <div className="space-y-2 mb-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Tópicos:</span>
                                        <span className="text-xs text-gray-500">
                                          {completedTopicsCount}/{day.topics.length}
                                        </span>
                                      </div>
                                      {day.topics.map((topic, topicIndex) => {
                                        const isCompleted = day.completedTopics?.includes(topicIndex);
                                        return (
                                          <label
                                            key={`${day.day}-topic-${topicIndex}`}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isCompleted}
                                              onChange={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('🔄 Toggle tópico:', { planId: currentPlan.id, weekIndex, dayIndex, topicIndex, isCompleted });
                                                console.log('📊 Estado antes:', { 
                                                  completedTopics: day.completedTopics,
                                                  completedTopicsCount: day.completedTopics?.length || 0
                                                });
                                                
                                                const wasCompleted = isCompleted;
                                                toggleTopicComplete(currentPlan.id, weekIndex, dayIndex, topicIndex);
                                                
                                                if (!wasCompleted) {
                                                  addXP(5);
                                                  console.log('✅ Tópico marcado como completo! +5 XP');
                                                } else {
                                                  console.log('❌ Tópico desmarcado');
                                                }
                                                
                                                // Log do estado após a mudança
                                                setTimeout(() => {
                                                  console.log('📊 Estado após toggle:', { 
                                                    currentPlan: currentPlan,
                                                    day: currentPlan?.schedule?.[weekIndex]?.days?.[dayIndex]
                                                  });
                                                }, 100);
                                              }}
                                              className="w-4 h-4 rounded accent-indigo-500"
                                            />
                                            <span className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                              {topic}
                                            </span>
                                          </label>
                                        );
                                      })}
                                      
                                      {/* Barra de progresso dos tópicos */}
                                      {day.topics.length > 0 && (
                                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                                          <div
                                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                            style={{ width: `${topicsProgress}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Notas */}
                                    {isEditingThisNote ? (
                                      <div className="bg-white/5 rounded-lg p-3 space-y-2">
                                        <textarea
                                          value={noteText}
                                          onChange={(e) => setNoteText(e.target.value)}
                                          placeholder="Adicione suas anotações..."
                                          className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                          rows="3"
                                          autoFocus
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleSaveNote(currentPlan.id, weekIndex, dayIndex);
                                            }}
                                            className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm"
                                          >
                                            Salvar
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setEditingNote(null);
                                              setNoteText('');
                                            }}
                                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      </div>
                                    ) : day.notes ? (
                                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-2">
                                        <div className="flex items-start gap-2">
                                          <StickyNote size={16} className="text-yellow-400 mt-0.5" />
                                          <p className="text-sm flex-1">{day.notes}</p>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setEditingNote({ weekIndex, dayIndex });
                                              setNoteText(day.notes);
                                            }}
                                            className="text-gray-400 hover:text-white"
                                          >
                                            <Edit3 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setEditingNote({ weekIndex, dayIndex });
                                          setNoteText('');
                                        }}
                                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1 mt-2"
                                      >
                                        <StickyNote size={14} />
                                        Adicionar nota
                                      </button>
                                    )}
                                    
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Interface do Quiz - DENTRO DO PLANO */}
        {console.log('🔍 Estado do quiz no plano:', { quiz: !!quiz, quizCompleted, quizLoading, quizTopic })}
        
        {/* Loading do Quiz */}
        {quizLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 text-center"
          >
            <div className="flex items-center justify-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
              <span>Gerando quiz sobre: {quizTopic}</span>
            </div>
          </motion.div>
        )}
        
        {quiz && !quizCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Quiz: {quizTopic}</h2>
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
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <motion.div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / quiz.quiz.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Questão atual */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold">{quiz.quiz[currentQuestion].question}</h3>
              
              <div className="space-y-3">
                {quiz.quiz[currentQuestion].options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === quiz.quiz[currentQuestion].correct;
                  
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
                      onClick={() => handleQuizAnswer(index)}
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
                  <p className="text-gray-300">{quiz.quiz[currentQuestion].explanation}</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Resultado do Quiz */}
        {quizCompleted && showQuizResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy size={48} className="text-white" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">Quiz Concluído! 🎉</h2>
            
            {(() => {
              const correctAnswers = quiz.quiz.filter((question, index) => 
                question.correct === quizAnswers[index]
              ).length;
              const percentage = Math.round((correctAnswers / quiz.quiz.length) * 100);
              const xpEarned = correctAnswers * 10;

              return (
                <>
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
                      <Play size={18} />
                      Novo Quiz
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* Dicas personalizadas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6"
        >
          <h3 className="text-xl font-bold mb-4">💡 Dicas Personalizadas</h3>
          <div className="grid gap-3">
            {currentPlan.tips.map((tip, idx) => (
              <div
                key={`tip-${idx}`}
                className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4"
              >
                <p className="text-gray-200">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // VIEW: Criar novo plano (formulário)
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8"
      >
        {studyPlans.length > 0 && (
          <button onClick={() => setView('plans')} className="text-gray-400 hover:text-white mb-4">
            ← Ver meus planos
          </button>
        )}
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Gerador de Plano de Estudos com IA</h2>
            <p className="text-gray-400">Crie um cronograma personalizado em segundos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              <BookOpen size={16} className="inline mr-2" />
              Matérias (separadas por vírgula)
            </label>
            <input
              type="text"
              name="subjects"
              value={formData.subjects}
              onChange={handleChange}
              placeholder="Ex: Matemática, Física, Química"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Target size={16} className="inline mr-2" />
              Sub-matérias/Tópicos Específicos (opcional)
            </label>
            <input
              type="text"
              name="subSubjects"
              value={formData.subSubjects}
              onChange={handleChange}
              placeholder="Ex: Biologia - Teoria da Evolução, Matemática - Cálculo Diferencial"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Especifique tópicos específicos para um plano mais detalhado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar size={16} className="inline mr-2" />
                Data da Prova
              </label>
              <input
                type="date"
                name="examDate"
                value={formData.examDate}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Target size={16} className="inline mr-2" />
                Horas Disponíveis por Dia
              </label>
              <input
                type="number"
                name="hoursPerDay"
                value={formData.hoursPerDay}
                onChange={handleChange}
                min="1"
                max="12"
                placeholder="Ex: 4"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nível de Dificuldade</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="basico">Básico</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Objetivo Principal</label>
            <textarea
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              placeholder="Ex: Passar no vestibular, tirar nota alta no ENEM..."
              rows="3"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Gerando plano inteligente...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Gerar Plano com IA
              </>
            )}
          </button>
        </form>
      </motion.div>

    </div>
  );
}