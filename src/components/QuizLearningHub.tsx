/**
 * Quiz Learning Hub - Integrates program selection, quiz interface, and progress tracking
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Trophy, Target } from 'lucide-react';
import ProgramQuizSelector from './ProgramQuizSelector';
import ModernQuizInterface from './ModernQuizInterface';
import UltraModernChat from './UltraModernChat';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface QuizLearningHubProps {
  onBack?: () => void;
  className?: string;
}

type ViewState = 'program-selection' | 'quiz-active' | 'chat-mode';

interface ProgramData {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  [key: string]: any;
}

const QuizLearningHub: React.FC<QuizLearningHubProps> = ({ onBack, className = '' }) => {
  const [currentView, setCurrentView] = useState<ViewState>('program-selection');
  const [selectedProgram, setSelectedProgram] = useState<ProgramData | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [learningSession, setLearningSession] = useState({
    startTime: Date.now(),
    totalMinutes: 0,
    quizzesCompleted: 0,
    currentStreak: 0
  });

  useEffect(() => {
    // Track learning session time
    const interval = setInterval(() => {
      setLearningSession(prev => ({
        ...prev,
        totalMinutes: Math.floor((Date.now() - prev.startTime) / 60000)
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleProgramSelect = async (programName: string, programData: ProgramData) => {
    try {
      // Create a conversation for this learning session
      const response = await apiService.post('/chat/conversations/quick', {
        title: `${programName} Learning Session`,
        tags: ['quiz', 'learning', programName.toLowerCase().replace(/\s+/g, '-')],
        first_message: `I want to start learning about ${programName}. Let's begin with a quiz!`
      });

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
        setSelectedProgram(programData);
        setCurrentView('quiz-active');
        
        toast.success(`Starting ${programName} quiz session!`);
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error starting quiz session:', error);
      toast.error('Failed to start quiz session');
    }
  };

  const handleQuizComplete = async (result: any) => {
    try {
      // Update learning session stats
      setLearningSession(prev => ({
        ...prev,
        quizzesCompleted: prev.quizzesCompleted + 1
      }));

      // Record learning time and quiz completion
      await apiService.post('/student/activity', {
        activity_type: 'quiz_completed',
        program_name: selectedProgram?.name,
        quiz_score: result.final_score,
        quiz_percentage: result.percentage,
        learning_minutes: learningSession.totalMinutes,
        session_data: {
          total_questions: result.total_questions,
          time_spent: learningSession.totalMinutes,
          performance_level: result.performance
        }
      });

      toast.success(`Quiz completed! You scored ${result.percentage}%`);
      
      // Offer to continue with chat or try another program
      setTimeout(() => {
        const continueChat = window.confirm(
          `Great job on the quiz! Would you like to continue learning about ${selectedProgram?.name} through chat, or try another program?`
        );
        
        if (continueChat) {
          setCurrentView('chat-mode');
        } else {
          setCurrentView('program-selection');
          setSelectedProgram(null);
        }
      }, 2000);

    } catch (error) {
      console.error('Error recording quiz completion:', error);
      // Don't show error to user, continue with normal flow
    }
  };

  const handleBackToPrograms = () => {
    setCurrentView('program-selection');
    setSelectedProgram(null);
    setConversationId(null);
  };

  const handleBackToQuiz = () => {
    setCurrentView('quiz-active');
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 ${className}`}>
      {/* Header with Learning Session Stats */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {(currentView !== 'program-selection' || onBack) && (
                <button
                  onClick={currentView === 'program-selection' ? onBack : handleBackToPrograms}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {currentView === 'program-selection' ? 'Back to Dashboard' : 'All Programs'}
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentView === 'program-selection' ? 'Learning Hub' :
                   currentView === 'quiz-active' ? `${selectedProgram?.name} Quiz` :
                   `${selectedProgram?.name} Chat`}
                </h1>
                {selectedProgram && (
                  <p className="text-gray-600 text-sm">
                    Interactive learning session in progress
                  </p>
                )}
              </div>
            </div>

            {/* Learning Session Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatTime(learningSession.totalMinutes)}</span>
              </div>
              {learningSession.quizzesCompleted > 0 && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Trophy className="w-4 h-4" />
                  <span>{learningSession.quizzesCompleted} quiz{learningSession.quizzesCompleted !== 1 ? 'es' : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-green-600">
                <Target className="w-4 h-4" />
                <span>Learning</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentView === 'program-selection' && (
          <ProgramQuizSelector
            onStartQuiz={handleProgramSelect}
            className="animate-fadeIn"
          />
        )}

        {currentView === 'quiz-active' && selectedProgram && conversationId && (
          <ModernQuizInterface
            conversationId={conversationId}
            programName={selectedProgram.name}
            programData={selectedProgram}
            onComplete={handleQuizComplete}
            onBack={handleBackToPrograms}
            className="animate-fadeIn"
          />
        )}

        {currentView === 'chat-mode' && selectedProgram && conversationId && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
                  <p className="text-gray-600">
                    Chat with our AI to deepen your understanding of {selectedProgram.name}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBackToQuiz}
                    className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl font-medium hover:bg-blue-200 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Take Another Quiz
                  </button>
                  <button
                    onClick={handleBackToPrograms}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Choose New Program
                  </button>
                </div>
              </div>
            </div>

            <UltraModernChat
              conversationId={conversationId}
              showHeader={false}
              placeholder={`Ask me anything about ${selectedProgram.name}...`}
              className="bg-white rounded-3xl shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {selectedProgram && (
        <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Learning Progress</div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{formatTime(learningSession.totalMinutes)}</div>
              <div className="text-xs text-gray-500">Time Spent</div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{learningSession.quizzesCompleted}</div>
              <div className="text-xs text-gray-500">Quizzes</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizLearningHub;

