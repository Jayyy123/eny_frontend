/**
 * Admin Dashboard with comprehensive system management
 */
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  UserPlus, 
  TrendingUp, 
  AlertCircle,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { apiService } from '../services/api';
import { SystemAnalytics, User, Document, Lead, UserCreate, DocumentUpload } from '../types';
import toast from 'react-hot-toast';
import AdminEscalationView from '../components/AdminEscalationView';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    analytics: false,
    users: false,
    documents: false,
    leads: false
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'documents' | 'leads' | 'escalations'>('overview');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [newUser, setNewUser] = useState<UserCreate>({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
  });
  const [documentUpload, setDocumentUpload] = useState<DocumentUpload>({
    title: '',
    tags: [],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    // Only load analytics on initial load - other data loads when tabs are accessed
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    if (loadingStates.analytics || analytics) return; // Prevent duplicate calls
    
    setLoadingStates(prev => ({ ...prev, analytics: true }));
    setIsLoading(true);
    try {
      const analyticsData = await apiService.getSystemAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load dashboard analytics');
    } finally {
      setIsLoading(false);
      setLoadingStates(prev => ({ ...prev, analytics: false }));
    }
  };

  const loadUsers = async () => {
    if (loadingStates.users || users.length > 0) return; // Prevent duplicate calls
    
    setLoadingStates(prev => ({ ...prev, users: true }));
    try {
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingStates(prev => ({ ...prev, users: false }));
    }
  };

  const loadDocuments = async () => {
    if (loadingStates.documents || documents.length > 0) return; // Prevent duplicate calls
    
    setLoadingStates(prev => ({ ...prev, documents: true }));
    try {
      const documentsData = await apiService.getDocuments();
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoadingStates(prev => ({ ...prev, documents: false }));
    }
  };

  const loadLeads = async () => {
    if (loadingStates.leads || leads.length > 0) return; // Prevent duplicate calls
    
    setLoadingStates(prev => ({ ...prev, leads: true }));
    try {
      const leadsData = await apiService.getLeads();
      setLeads(leadsData);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoadingStates(prev => ({ ...prev, leads: false }));
    }
  };

  // Load data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'users':
        if (users.length === 0) loadUsers();
        break;
      case 'documents':
        if (documents.length === 0) loadDocuments();
        break;
      case 'leads':
        if (leads.length === 0) loadLeads();
        break;
      case 'escalations':
        // Escalations load their own data
        break;
      case 'overview':
        // Overview uses analytics which is already loaded
        break;
    }
  }, [activeTab, users.length, documents.length, leads.length]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createUser(newUser);
      toast.success('User created successfully');
      setShowUserForm(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'student' });
      loadUsers(); // Only reload users, not all data
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      await apiService.uploadDocument(
        selectedFile,
        documentUpload.title,
        documentUpload.tags?.join(',') || ''
      );
      toast.success('Document uploaded successfully');
      setShowDocumentUpload(false);
      setDocumentUpload({ title: '', tags: [] });
      setSelectedFile(null);
      loadDocuments(); // Only reload documents
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await apiService.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      loadDocuments(); // Only reload documents
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleUpdateLead = async (leadId: string, status: string) => {
    try {
      await apiService.updateLead(leadId, { status: status as any });
      toast.success('Lead updated successfully');
      loadLeads(); // Only reload leads
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage your AI Student Support Portal</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'leads', label: 'Leads', icon: UserPlus },
            { id: 'escalations', label: 'Escalations', icon: AlertCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.users.total}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="text-green-600">{analytics.users.students} students</span>
                <span className="mx-2">•</span>
                <span className="text-blue-600">{analytics.users.agents} agents</span>
                <span className="mx-2">•</span>
                <span className="text-purple-600">{analytics.users.admins} admins</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversations</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.conversations.total}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="text-green-600">{analytics.conversations.active} active</span>
                <span className="mx-2">•</span>
                <span className="text-yellow-600">{analytics.conversations.escalated} escalated</span>
                <span className="mx-2">•</span>
                <span className="text-gray-600">{analytics.conversations.resolved} resolved</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.documents.total}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {Object.entries(analytics.documents.by_type).map(([type, count]) => (
                  <span key={type} className="mr-2">
                    {count} {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserPlus className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Leads</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.leads.total}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <span className="text-green-600">{analytics.leads.conversion_rate}% conversion</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowUserForm(true)}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-900">Create User</span>
              </button>
              <button
                onClick={() => setShowDocumentUpload(true)}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-900">Upload Document</span>
              </button>
              <button
                onClick={() => {
                  loadAnalytics();
                  // Reload current tab data
                  switch (activeTab as 'overview' | 'users' | 'documents' | 'leads' | 'escalations') {
                    case 'users': loadUsers(); break;
                    case 'documents': loadDocuments(); break;
                    case 'leads': loadLeads(); break;
                    case 'escalations': break; // Escalations don't need separate reload
                    case 'overview': break; // Overview uses analytics
                  }
                }}
                className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-900">Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <button
              onClick={() => setShowUserForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'agent' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Document Management</h3>
            <button
              onClick={() => setShowDocumentUpload(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {documents.map((document) => (
                <li key={document.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{document.title}</div>
                        <div className="text-sm text-gray-500">
                          {document.file_type} • {document.chunk_count || 0} chunks
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {document.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{document.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Lead Management</h3>
            <div className="flex space-x-2">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <li key={lead.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        {lead.program_interest && (
                          <div className="text-sm text-gray-500">{lead.program_interest}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">Score: {lead.lead_score}</div>
                        <div className="text-sm text-gray-500">{lead.source}</div>
                      </div>
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateLead(lead.id, e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="student">Student</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h3>
            <form onSubmit={handleDocumentUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={documentUpload.title}
                  onChange={(e) => setDocumentUpload(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={documentUpload.tags?.join(', ') || ''}
                  onChange={(e) => setDocumentUpload(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                  placeholder="business-analysis, requirements, agile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDocumentUpload(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalations Tab */}
      {activeTab === 'escalations' && (
        <div className="h-[calc(100vh-200px)]">
          <AdminEscalationView />
        </div>
      )}
    </div>
  );
};
