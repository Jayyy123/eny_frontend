/**
 * Public Homepage with lead capture and public chat
 */
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  BookOpen, 
  Users, 
  Award, 
  CheckCircle, 
  ArrowRight,
  Star,
  Clock,
  DollarSign,
  Target,
  Play
} from 'lucide-react';
import { PublicChat } from '../components/PublicChat';
import { apiService } from '../services/api';
import { LeadCreate } from '../types';
import { sessionService } from '../services/sessionService';
import toast from 'react-hot-toast';

export const HomePage: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [leadForm, setLeadForm] = useState<LeadCreate>({
    name: '',
    email: '',
    phone: '',
    program_interest: '',
    notes: '',
    source: 'form',
  });

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    try {
      const [programsData, statsData] = await Promise.all([
        apiService.getPublicPrograms(),
        apiService.getPublicStats(),
      ]);
      setPrograms(programsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading public data:', error);
      // Fallback to static data
      setPrograms([
        {
          id: '1',
          title: 'Business Analysis Fundamentals',
          description: 'Master the core principles of business analysis and requirements gathering.',
          duration: '12 weeks',
          cost: 2999,
          level: 'Beginner',
          features: ['Requirements Analysis', 'Stakeholder Management', 'Process Modeling', 'Documentation'],
          popular: true
        },
        {
          id: '2',
          title: 'Advanced Business Analysis with Agile',
          description: 'Learn advanced BA techniques with agile methodologies and user stories.',
          duration: '16 weeks',
          cost: 3999,
          level: 'Intermediate',
          features: ['Agile Methodologies', 'User Stories', 'Sprint Planning', 'Scrum Master Skills'],
          popular: false
        },
        {
          id: '3',
          title: 'Data Analysis for Business',
          description: 'Combine business analysis with data analytics for data-driven decisions.',
          duration: '14 weeks',
          cost: 3499,
          level: 'Intermediate',
          features: ['Data Visualization', 'SQL Basics', 'Business Intelligence', 'Analytics Tools'],
          popular: false
        }
      ]);
      setStats({
        students_trained: 500,
        job_placement_rate: 95,
        industry_partners: 50,
        student_rating: 4.9
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create lead with session information
      const leadData = {
        ...leadForm,
        session_id: sessionService.getSessionId(),
        conversation_id: sessionService.getData('conversationId')
      };
      
      const lead = await apiService.createPublicLead(leadData);
      
      // Update session with lead ID
      if (lead.id) {
        sessionService.setLeadId(lead.id);
        sessionService.setData('leadName', leadForm.name);
        sessionService.setData('leadEmail', leadForm.email);
      }
      
      toast.success('Thank you for your interest! We\'ll be in touch soon. You can continue our conversation anytime - we\'ll remember where we left off!');
      setShowLeadForm(false);
      setLeadForm({
        name: '',
        email: '',
        phone: '',
        program_interest: '',
        notes: '',
        source: 'form',
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to submit information. Please try again.');
    }
  };

  const statsArray = [
    { number: `${stats.students_trained || 500}+`, label: 'Students Trained' },
    { number: `${stats.job_placement_rate || 95}%`, label: 'Job Placement Rate' },
    { number: `${stats.industry_partners || 50}+`, label: 'Industry Partners' },
    { number: `${stats.student_rating || 4.9}/5`, label: 'Student Rating' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Business Analyst at TechCorp',
      content: 'The Business Analysis program transformed my career. The practical approach and real-world projects prepared me perfectly for my current role.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Senior BA at FinanceFirst',
      content: 'Excellent curriculum and supportive instructors. I landed my dream job within 3 months of completing the program.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Product Owner at StartupXYZ',
      content: 'The agile methodologies course was game-changing. I now lead product development teams with confidence.',
      rating: 5
    }
  ];

  if (showChat) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <button
              onClick={() => setShowChat(false)}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Homepage</span>
            </button>
          </div>
          <div className="h-[calc(100vh-120px)]">
            <PublicChat onLeadCreated={() => setShowLeadForm(true)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Business Analysis School</h1>
                <p className="text-sm text-gray-600">AI-Powered Learning Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowChat(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with AI</span>
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Login</span>
              </button>
              <button
                onClick={() => setShowLeadForm(true)}
                className="px-4 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Master Business Analysis with AI-Powered Learning
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Get personalized guidance, instant support, and career-ready skills with our AI-powered business analysis programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowLeadForm(true)}
                className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  // Load session data when opening chat
                  sessionService.loadFromBackend();
                  setShowChat(true);
                }}
                className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Ask AI Assistant</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsArray.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our comprehensive business analysis programs designed for every career stage.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading programs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {programs.map((program, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-8 relative">
                {program.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{program.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Level</span>
                    <span className="font-medium">{program.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-medium text-primary-600">${program.cost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">What you'll learn:</h4>
                  <ul className="space-y-2">
                    {program.features.map((feature: string, featureIndex: number) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setShowLeadForm(true)}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    program.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'border border-primary-600 text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Learn More
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from successful graduates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-medium text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Business Analysis Career?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful graduates and get personalized AI support throughout your learning journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowLeadForm(true)}
              className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Apply Now
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Chat with AI
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="ml-2">
                  <h3 className="font-semibold">Business Analysis School</h3>
                </div>
              </div>
              <p className="text-gray-400">
                AI-powered business analysis education for the modern professional.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Programs</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Business Analysis Fundamentals</li>
                <li>Advanced Business Analysis</li>
                <li>Data Analysis for Business</li>
                <li>Agile Methodologies</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>AI Chat Support</li>
                <li>Career Guidance</li>
                <li>Technical Support</li>
                <li>Community Forum</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>info@businessanalysisschool.com</li>
                <li>+1 (555) 123-4567</li>
                <li>Mon-Fri 9AM-6PM EST</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Business Analysis School. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Get Started Today
              </h3>
            </div>
            
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={leadForm.name}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={leadForm.email}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Interest
                </label>
                <select
                  value={leadForm.program_interest}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, program_interest: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a program</option>
                  <option value="Business Analysis Fundamentals">Business Analysis Fundamentals</option>
                  <option value="Advanced Business Analysis">Advanced Business Analysis</option>
                  <option value="Data Analysis for Business">Data Analysis for Business</option>
                  <option value="Agile Methodologies">Agile Methodologies</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLeadForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
