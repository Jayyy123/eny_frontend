/**
 * Public chat component for anonymous users with lead conversion
 */
import React, { useState } from 'react';
import { X, ArrowRight, User, Mail, Phone, BookOpen } from 'lucide-react';
import { apiService } from '../services/api';
import { LeadCreate, UserCreate } from '../types';
import UltraModernChat from './UltraModernChat';
import { sessionService } from '../services/sessionService';
import toast from 'react-hot-toast';

interface PublicChatProps {
  onLeadCreated?: (lead: any) => void;
}

export const PublicChat: React.FC<PublicChatProps> = ({ onLeadCreated }) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  
  // Debug: Log state changes
  React.useEffect(() => {
    console.log('🎯 PublicChat: showLeadForm changed to:', showLeadForm);
  }, [showLeadForm]);
  const [leadForm, setLeadForm] = useState<LeadCreate>({
    name: '',
    email: '',
    phone: '',
    program_interest: '',
    notes: ''
  });
  const [signupForm, setSignupForm] = useState<UserCreate>({
    email: '',
    password: '',
    full_name: '',
    role: 'student' as const
  });

  const handleConversationCreate = (newConversationId: string) => {
    setConversationId(newConversationId);
    // Store conversation ID in session for continuity
    sessionService.setConversationId(newConversationId);
    sessionService.setData('conversationId', newConversationId);
  };

  const handleEnrollmentIntent = (intent: any) => {
    console.log('🎯 Enrollment intent received:', intent);
    if (intent?.should_show_enrollment_form) {
      console.log('🎯 Showing enrollment form');
      // Show enrollment form immediately
      setShowLeadForm(true);
      // Pre-fill with session data if available
      const sessionData = sessionService.getSessionData();
      if (sessionData?.data) {
        setLeadForm(prev => ({
          ...prev,
          program_interest: sessionData.data.programInterest || '',
          notes: `Enrollment intent detected: ${intent.message || 'User expressed interest in enrolling'}`
        }));
      }
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lead = await apiService.createPublicLead({
        ...leadForm,
        conversation_id: conversationId || undefined
      });
      
      onLeadCreated?.(lead);
      setShowLeadForm(false);
      setShowSignupForm(true);
      toast.success('Thanks! We\'ll be in touch soon.');
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to submit. Please try again.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert conversation to user account
      if (conversationId) {
        await apiService.convertConversationToUser(conversationId, signupForm);
      }
      
      setShowSignupForm(false);
      toast.success('Account created! Redirecting to login...');
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Debug: Test enrollment form button */}
      {/* <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => {
            console.log('🎯 Debug: Manual form trigger');
            setShowLeadForm(true);
          }}
          className="bg-red-500 text-white px-3 py-1 rounded text-xs"
        >
          Test Form
        </button>
      </div> */}
      
      {/* Ultra-Modern Chat Interface */}
      <UltraModernChat
        conversationId={conversationId || undefined}
        onConversationCreate={handleConversationCreate}
        onEnrollmentIntent={handleEnrollmentIntent}
        isPublic={true}
        placeholder="Ask me about our programs, enrollment, or anything else..."
        className="flex-1"
      />

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Get Started Today!</h3>
                  <p className="text-slate-600">Let's get your learning journey started</p>
                </div>
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Program Interest
                  </label>
                  <select
                    value={leadForm.program_interest}
                    onChange={(e) => setLeadForm({ ...leadForm, program_interest: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a program</option>
                    <option value="web-development">Web Development</option>
                    <option value="data-science">Data Science</option>
                    <option value="mobile-development">Mobile Development</option>
                    <option value="cybersecurity">Cybersecurity</option>
                    <option value="ai-ml">AI/Machine Learning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any questions or specific interests?"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Signup Form Modal */}
      {showSignupForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Create Your Account</h3>
                  <p className="text-slate-600">Access your learning dashboard</p>
                </div>
                <button
                  onClick={() => setShowSignupForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signupForm.full_name}
                    onChange={(e) => setSignupForm({ ...signupForm, full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a secure password"
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};