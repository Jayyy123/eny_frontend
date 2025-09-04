/**
 * Modern Quiz Interface with clickable options and disabled text input
 */
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy, 
  Target, 
  ArrowRight, 
  Lightbulb,
  RotateCcw,
  Send,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { StreamingText } from './StreamingText';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuizQuestion {
  question_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text_input';
  options?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface QuizSession {
  session_id: string;
  program_name: string;
  total_questions: number;
  current_question: number;
  score: number;
  question?: QuizQuestion;
}

interface QuizResult {
  final_score?: number;
  score?: number;
  total_questions: number;
  percentage: number;
  performance?: string;
  emoji?: string;
  message: string;
  quiz_complete?: boolean;
}

interface ModernQuizInterfaceProps {
  conversationId: string;
  programName: string;
  programData?: any;
  onComplete?: (result: QuizResult) => void;
  onBack?: () => void;
  className?: string;
}

const ModernQuizInterface: React.FC<ModernQuizInterfaceProps> = ({
  conversationId,
  programName,
  programData,
  onComplete,
  onBack,
  className = ''
}) => {
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);
  const [nextQuestionData, setNextQuestionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);

  useEffect(() => {
    // Only start quiz session once when component mounts
    if (!quizSession && !isStartingQuiz) {
      startQuizSession();
    }
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Timer and beforeunload handler
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    // Add beforeunload event listener to warn about leaving during quiz
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isComplete && quizSession) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your quiz progress will be saved.';
        return 'Are you sure you want to leave? Your quiz progress will be saved.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isComplete, quizSession]);

  const startQuizSession = async () => {
    if (isStartingQuiz) {
      console.log('Quiz start already in progress, skipping...');
      return;
    }
    
    try {
      setIsStartingQuiz(true);
      setLoading(true);
      console.log('Starting quiz session for:', programName);
      
      const response = await apiService.post('/quiz/start', {
        conversation_id: conversationId,
        program_name: programName,
        num_questions: 5
      });

      if (response.success) {
        console.log('Quiz session response:', response);
        
        // Ensure options is an array for multiple choice questions
        if (response.question && response.question.question_type === 'multiple_choice') {
          console.log('Multiple choice question options (raw):', response.question.options);
          console.log('Options type:', typeof response.question.options);
          
          if (response.question.options && typeof response.question.options === 'string') {
            try {
              response.question.options = JSON.parse(response.question.options);
              console.log('Parsed options:', response.question.options);
            } catch (e) {
              console.error('Failed to parse options:', response.question.options);
              response.question.options = [];
            }
          } else if (!Array.isArray(response.question.options)) {
            console.log('Options is not an array, setting to empty array');
            response.question.options = [];
          } else {
            console.log('Options is already an array:', response.question.options);
          }
        }
        
        setQuizSession(response);
      } else {
        toast.error(response.error || 'Failed to start quiz');
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz session');
    } finally {
      setLoading(false);
      setIsStartingQuiz(false);
    }
  };

  const submitAnswer = async () => {
    if (!quizSession?.question || isSubmitting) return;

    const answer = quizSession.question.question_type === 'text_input' ? textAnswer : selectedAnswer;
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.post('/quiz/answer', {
        session_id: quizSession.session_id,
        question_id: quizSession.question.question_id,
        user_answer: answer
      });

      if (response.success) {
        setFeedback(response);
        setShowFeedback(true);

        if (response.quiz_complete) {
          setIsComplete(true);
          setFinalResult(response);
          if (onComplete) {
            onComplete(response);
          }
        } else {
          // Store next question data but don't auto-advance
          setNextQuestionData({
            current_question: response.current_question,
            score: response.score,
            question: response.next_question
          });
        }
      } else {
        toast.error(response.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueToNextQuestion = () => {
    if (nextQuestionData) {
      const question = nextQuestionData.question;
      
      // Ensure options is an array for multiple choice questions
      if (question && question.question_type === 'multiple_choice') {
        if (question.options && typeof question.options === 'string') {
          try {
            question.options = JSON.parse(question.options);
          } catch (e) {
            console.error('Failed to parse options:', question.options);
            question.options = [];
          }
        } else if (!Array.isArray(question.options)) {
          question.options = [];
        }
      }
      
      setQuizSession({
        ...quizSession!,
        current_question: nextQuestionData.current_question,
        score: nextQuestionData.score,
        question: question
      });
      setShowFeedback(false);
      setSelectedAnswer('');
      setTextAnswer('');
      setNextQuestionData(null);
    }
  };

  const endQuiz = async () => {
    if (!quizSession) return;
    
    try {
      // End the quiz session and get final results
      const response = await apiService.post('/quiz/end', {
        session_id: quizSession.session_id
      });
      
      if (response.success) {
        setIsComplete(true);
        setFinalResult(response);
        if (onComplete) {
          onComplete(response);
        }
      }
    } catch (error) {
      console.error('Error ending quiz:', error);
      // Fallback: show current progress
      setIsComplete(true);
      setFinalResult({
        quiz_complete: true,
        score: quizSession.score,
        total_questions: quizSession.current_question,
        message: `Quiz ended early. You scored ${quizSession.score} out of ${quizSession.current_question} questions answered.`,
        percentage: Math.round((quizSession.score / quizSession.current_question) * 100) || 0
      });
    }
    setShowExitConfirmation(false);
  };

  const handleExit = () => {
    setShowExitConfirmation(true);
  };

  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  const confirmExit = () => {
    endQuiz();
  };

  const restartQuiz = () => {
    setQuizSession(null);
    setSelectedAnswer('');
    setTextAnswer('');
    setShowFeedback(false);
    setFeedback(null);
    setIsComplete(false);
    setFinalResult(null);
    setTimeSpent(0);
    setNextQuestionData(null);
    setShowExitConfirmation(false);
    startQuizSession();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Preparing Your Quiz</h3>
          <p className="text-gray-600">Setting up personalized questions for {programName}...</p>
        </div>
      </div>
    );
  }

  if (isComplete && finalResult) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-6">{finalResult.emoji}</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {finalResult.final_score}/{finalResult.total_questions}
            </div>
            <div className="text-xl text-gray-700 mb-2">
              {finalResult.percentage}% Correct
            </div>
            <div className="text-lg text-gray-600">
              Time: {formatTime(timeSpent)}
            </div>
          </div>

          <div className="text-left mb-8">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {finalResult.message}
              </ReactMarkdown>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={restartQuiz}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              <RotateCcw className="w-5 h-5" />
              Retake Quiz
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Choose Another Program
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!quizSession?.question) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Quiz Unavailable</h3>
          <p className="text-gray-600 mb-4">No questions available for {programName}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Programs
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Quiz Header */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{programName} Quiz</h2>
            <p className="text-gray-600">Question {quizSession.current_question + 1} of {quizSession.total_questions}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(timeSpent)}
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                {quizSession.score}/{quizSession.current_question}
              </div>
            </div>
            <button
              onClick={handleExit}
              className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-900 rounded-lg transition-colors font-medium"
            >
              End Quiz
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((quizSession.current_question) / quizSession.total_questions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {showFeedback && feedback ? (
          // Feedback View
          <div className="p-8">
            <div className={`flex items-center gap-4 mb-6 ${feedback.is_correct ? 'text-green-600' : 'text-red-600'}`}>
              {feedback.is_correct ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
              <div>
                <h3 className="text-2xl font-bold">
                  {feedback.is_correct ? 'Correct!' : 'Not quite right'}
                </h3>
                <p className="text-gray-600">
                  Score: {feedback.score}/{feedback.current_question}
                </p>
              </div>
            </div>

            {feedback.feedback && (
              <div className="bg-blue-50 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {feedback.feedback}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!feedback.quiz_complete && nextQuestionData && (
              <div className="mt-6 text-center">
                <button
                  onClick={continueToNextQuestion}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  Continue to Next Question →
                </button>
              </div>
            )}
          </div>
        ) : (
          // Question View
          <div className="p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(quizSession.question.difficulty)}`}>
                  {quizSession.question.difficulty.charAt(0).toUpperCase() + quizSession.question.difficulty.slice(1)}
                </span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">
                    {quizSession.question.question_type === 'multiple_choice' ? 'Multiple Choice' :
                     quizSession.question.question_type === 'true_false' ? 'True/False' :
                     'Text Answer'}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                {quizSession.question.question_text}
              </h3>
            </div>

            {/* Answer Options */}
            {quizSession.question.question_type === 'multiple_choice' && quizSession.question.options && Array.isArray(quizSession.question.options) && (
              <div className="space-y-3 mb-8">
                {quizSession.question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(option)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md ${
                      selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === option
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === option && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {quizSession.question.question_type === 'true_false' && (
              <div className="flex gap-4 mb-8">
                {['True', 'False'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedAnswer(option)}
                    className={`flex-1 p-6 rounded-2xl border-2 font-semibold transition-all duration-200 hover:shadow-md ${
                      selectedAnswer === option
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {quizSession.question.question_type === 'text_input' && (
              <div className="mb-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">Text Answer Required</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Provide your answer in the text box below. Our AI will evaluate your response.
                  </p>
                </div>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none resize-none h-32"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={submitAnswer}
              disabled={
                isSubmitting || 
                (quizSession.question.question_type === 'text_input' ? !textAnswer.trim() : !selectedAnswer)
              }
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Answer
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">End Quiz Early?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to end this quiz? Your progress will be saved, but you won't be able to continue from where you left off.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelExit}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Continue Quiz
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                >
                  End Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernQuizInterface;

