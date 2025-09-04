/**
 * Modern Program Quiz Selector with descriptions and immediate quiz start
 */
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Trophy, 
  Zap, 
  ArrowRight,
  PlayCircle,
  Target,
  Briefcase,
  BarChart3,
  Rocket
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface Program {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  skills: string[];
  icon: string;
  color: string;
  gradient: string;
  estimatedHours: number;
  learningOutcomes: string[];
}

interface ProgramQuizSelectorProps {
  onStartQuiz: (programName: string, programData: Program) => void;
  className?: string;
}

const BUSINESS_ANALYSIS_PROGRAMS: Program[] = [
  {
    id: 'ba-foundations',
    name: 'Business Analysis Foundations',
    description: 'Master the fundamentals of business analysis including requirements gathering, stakeholder management, and process documentation. Perfect for beginners looking to enter the BA field.',
    shortDescription: 'Learn BA fundamentals, requirements gathering, and stakeholder management',
    duration: '6-8 weeks',
    level: 'Beginner',
    skills: ['Requirements Elicitation', 'Stakeholder Analysis', 'Process Mapping', 'Documentation'],
    icon: '🎯',
    color: 'from-blue-500 to-cyan-600',
    gradient: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    estimatedHours: 40,
    learningOutcomes: [
      'Understand the role of a Business Analyst',
      'Master requirements gathering techniques',
      'Create effective stakeholder maps',
      'Document business processes clearly'
    ]
  },
  {
    id: 'advanced-ba',
    name: 'Advanced Business Analysis',
    description: 'Dive deep into advanced BA techniques including gap analysis, traceability matrices, and complex stakeholder management. Ideal for experienced professionals.',
    shortDescription: 'Advanced techniques, gap analysis, and complex stakeholder management',
    duration: '8-10 weeks',
    level: 'Advanced',
    skills: ['Gap Analysis', 'Traceability Matrix', 'Complex Modeling', 'Strategic Analysis'],
    icon: '🚀',
    color: 'from-purple-500 to-pink-600',
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-600',
    estimatedHours: 60,
    learningOutcomes: [
      'Perform comprehensive gap analysis',
      'Create detailed traceability matrices',
      'Handle complex stakeholder scenarios',
      'Drive strategic business decisions'
    ]
  },
  {
    id: 'agile-ba',
    name: 'Agile Business Analysis',
    description: 'Learn how to be an effective Business Analyst in Agile environments. Cover user stories, acceptance criteria, and agile ceremonies.',
    shortDescription: 'Agile methodologies, user stories, and sprint planning',
    duration: '6-8 weeks',
    level: 'Intermediate',
    skills: ['User Stories', 'Acceptance Criteria', 'Sprint Planning', 'Agile Ceremonies'],
    icon: '⚡',
    color: 'from-green-500 to-emerald-600',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
    estimatedHours: 45,
    learningOutcomes: [
      'Write effective user stories',
      'Define clear acceptance criteria',
      'Facilitate agile ceremonies',
      'Collaborate in cross-functional teams'
    ]
  },
  {
    id: 'product-ownership',
    name: 'Product Ownership',
    description: 'Transition from BA to Product Owner. Learn product strategy, backlog management, and value maximization techniques.',
    shortDescription: 'Product strategy, backlog management, and value optimization',
    duration: '8-10 weeks',
    level: 'Intermediate',
    skills: ['Product Strategy', 'Backlog Management', 'Value Optimization', 'Roadmap Planning'],
    icon: '🎯',
    color: 'from-orange-500 to-red-600',
    gradient: 'bg-gradient-to-r from-orange-500 to-red-600',
    estimatedHours: 55,
    learningOutcomes: [
      'Develop product strategy',
      'Manage product backlogs effectively',
      'Maximize business value',
      'Create compelling product roadmaps'
    ]
  },
  {
    id: 'data-for-bas',
    name: 'Data for Business Analysts',
    description: 'Leverage data to drive business decisions. Learn SQL basics, data modeling, and analytics tools essential for modern BAs.',
    shortDescription: 'SQL, data modeling, and analytics for business insights',
    duration: '10-12 weeks',
    level: 'Intermediate',
    skills: ['SQL Basics', 'Data Modeling', 'Analytics Tools', 'Data Visualization'],
    icon: '📊',
    color: 'from-indigo-500 to-purple-600',
    gradient: 'bg-gradient-to-r from-indigo-500 to-purple-600',
    estimatedHours: 65,
    learningOutcomes: [
      'Write basic SQL queries',
      'Create effective data models',
      'Use analytics tools confidently',
      'Present data insights clearly'
    ]
  },
  {
    id: 'career-accelerator',
    name: 'Career Accelerator',
    description: 'Fast-track your BA career with interview preparation, portfolio building, and networking strategies. Get job-ready quickly.',
    shortDescription: 'Interview prep, portfolio building, and job search strategies',
    duration: '4-6 weeks',
    level: 'Beginner',
    skills: ['Interview Skills', 'Portfolio Creation', 'Networking', 'Job Search Strategy'],
    icon: '🏆',
    color: 'from-yellow-500 to-orange-600',
    gradient: 'bg-gradient-to-r from-yellow-500 to-orange-600',
    estimatedHours: 30,
    learningOutcomes: [
      'Ace BA interviews',
      'Build impressive portfolios',
      'Network effectively',
      'Land your dream BA role'
    ]
  }
];

const ProgramQuizSelector: React.FC<ProgramQuizSelectorProps> = ({ onStartQuiz, className = '' }) => {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailablePrograms();
  }, []);

  const loadAvailablePrograms = async () => {
    try {
      const programs = await apiService.get('/quiz/programs');
      setAvailablePrograms(programs || []);
    } catch (error) {
      console.error('Error loading available programs:', error);
      // Show all programs if API fails
      setAvailablePrograms(BUSINESS_ANALYSIS_PROGRAMS.map(p => p.name));
    }
  };

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
  };

  const handleStartQuiz = async (program: Program) => {
    setLoading(true);
    try {
      onStartQuiz(program.name, program);
      toast.success(`Starting ${program.name} quiz!`);
    } catch (error) {
      toast.error('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconComponent = (iconString: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '🎯': <Target className="w-8 h-8" />,
      '🚀': <Rocket className="w-8 h-8" />,
      '⚡': <Zap className="w-8 h-8" />,
      '📊': <BarChart3 className="w-8 h-8" />,
      '🏆': <Trophy className="w-8 h-8" />,
      '💼': <Briefcase className="w-8 h-8" />
    };
    return iconMap[iconString] || <BookOpen className="w-8 h-8" />;
  };

  if (selectedProgram) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        {/* Program Detail View */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`${selectedProgram.gradient} p-8 text-white`}>
            <button
              onClick={() => setSelectedProgram(null)}
              className="mb-4 text-white/80 hover:text-white transition-colors"
            >
              ← Back to Programs
            </button>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl backdrop-blur-sm">
                {selectedProgram.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{selectedProgram.name}</h1>
                <p className="text-xl text-white/90">{selectedProgram.shortDescription}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Description */}
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Program</h2>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  {selectedProgram.description}
                </p>

                <h3 className="text-xl font-bold text-gray-900 mb-4">Learning Outcomes</h3>
                <ul className="space-y-3">
                  {selectedProgram.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                      </div>
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Program Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Program Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">{selectedProgram.duration}</div>
                        <div className="text-sm text-gray-600">{selectedProgram.estimatedHours} hours</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(selectedProgram.level)}`}>
                        {selectedProgram.level}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Key Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProgram.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-white rounded-lg text-sm text-gray-700 border">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Start Quiz Button */}
                <button
                  onClick={() => handleStartQuiz(selectedProgram)}
                  disabled={loading}
                  className={`w-full ${selectedProgram.gradient} text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting Quiz...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-6 h-6" />
                      Start Quiz & Learn
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Learning Path
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Select a Business Analysis program to start an interactive quiz session. 
          Track your progress, earn certificates, and build your expertise.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {BUSINESS_ANALYSIS_PROGRAMS.map((program) => (
          <div
            key={program.id}
            onClick={() => handleProgramSelect(program)}
            className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 overflow-hidden border border-gray-100"
          >
            {/* Program Header */}
            <div className={`${program.gradient} p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
                {getIconComponent(program.icon)}
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{program.icon}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    program.level === 'Beginner' ? 'bg-white/20' :
                    program.level === 'Intermediate' ? 'bg-yellow-400/20' :
                    'bg-red-400/20'
                  }`}>
                    {program.level}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{program.name}</h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {program.shortDescription}
                </p>
              </div>
            </div>

            {/* Program Content */}
            <div className="p-6">
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {program.duration}
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {program.estimatedHours}h
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {program.skills.slice(0, 3).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                    {skill}
                  </span>
                ))}
                {program.skills.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">
                    +{program.skills.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {availablePrograms.includes(program.name) ? 'Quiz Available' : 'Coming Soon'}
                </span>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgramQuizSelector;

