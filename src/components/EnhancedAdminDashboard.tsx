import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target, 
  Clock,
  Zap,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

interface ComprehensiveAnalytics {
  overview: {
    total_leads: number;
    lead_status_breakdown: Record<string, number>;
    average_lead_score: number;
    high_quality_leads: number;
    high_quality_percentage: number;
    conversion_rate: number;
    growth_rate: number;
  };
  conversion_funnel: {
    funnel_stages: Array<{
      stage: string;
      count: number;
      conversion_rate: number;
      stage_order: number;
    }>;
    overall_conversion_rate: number;
  };
  lead_scoring_distribution: {
    distribution: Array<{
      range: string;
      category: string;
      count: number;
      percentage: number;
    }>;
    total_leads: number;
  };
  conversation_analytics: {
    total_conversations: number;
    average_messages_per_conversation: number;
    escalation_rate: number;
    escalated_conversations: number;
    topic_analysis: {
      topic_distribution: Record<string, number>;
      topic_percentages: Record<string, number>;
      total_messages_analyzed: number;
      most_discussed_topic: string;
    };
    response_times: {
      avg_first_response_time_seconds: number;
      avg_ai_response_time_seconds: number;
      response_time_trend: string;
    };
  };
  performance_metrics: {
    avg_response_time_ms: number;
    min_response_time_ms: number;
    max_response_time_ms: number;
    total_responses: number;
    cache_stats: {
      memory_cache_size: number;
      hits: number;
      misses: number;
      hit_rate_percent: number;
    };
  };
  cache_performance: {
    memory_cache_size: number;
    hits: number;
    misses: number;
    hit_rate_percent: number;
  };
  temporal_patterns: {
    daily_trends: Array<{
      date: string;
      leads: number;
      avg_score: number;
    }>;
    hourly_patterns: Array<{
      hour: number;
      leads: number;
      percentage: number;
    }>;
    peak_hour: number;
  };
}

export const EnhancedAdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'leads' | 'conversations'>('overview');

  const loadAnalytics = async (showToast = false) => {
    try {
      setRefreshing(true);
      const response = await apiService.get<ComprehensiveAnalytics>(
        `${process.env.REACT_APP_API_URL || '/api/v1'}/admin/analytics/comprehensive?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      setAnalytics(response);
      setError(null);
      
      if (showToast) {
        toast.success('Analytics refreshed successfully');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Add debounce to prevent too many API calls when date range changes rapidly
    const timeoutId = setTimeout(() => {
      loadAnalytics();
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [dateRange]);

  const clearCache = async (cacheType?: string) => {
    try {
      await apiService.post(`${process.env.REACT_APP_API_URL || '/api/v1'}/admin/cache/clear${cacheType ? `?cache_type=${cacheType}` : ''}`);
      toast.success(`Cache cleared: ${cacheType || 'all'}`);
      loadAnalytics(true);
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
    if (value <= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading comprehensive analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => loadAnalytics(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const responseTimeHealth = getHealthStatus(
    analytics.performance_metrics.avg_response_time_ms,
    { good: 1000, warning: 3000 }
  );

  const cacheHitRateHealth = getHealthStatus(
    100 - analytics.cache_performance.hit_rate_percent,
    { good: 20, warning: 50 }
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive system performance and lead conversion analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'performance', label: 'Performance', icon: Zap },
            { id: 'leads', label: 'Lead Analytics', icon: Target },
            { id: 'conversations', label: 'Conversations', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
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
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(analytics.overview.total_leads)}
                  </p>
                  <p className={`text-xs ${analytics.overview.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.overview.growth_rate >= 0 ? '+' : ''}{formatPercentage(analytics.overview.growth_rate)} vs previous period
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(analytics.overview.conversion_rate)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analytics.overview.high_quality_percentage}% high-quality leads
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Lead Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.overview.average_lead_score.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analytics.overview.high_quality_leads} high-scoring leads
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(analytics.conversation_analytics.total_conversations)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPercentage(analytics.conversation_analytics.escalation_rate)} escalation rate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              {analytics.conversion_funnel.funnel_stages.map((stage, index) => (
                <div key={stage.stage} className="flex items-center">
                  <div className="w-32 text-sm font-medium text-gray-600 capitalize">
                    {stage.stage.replace('_', ' ')}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(stage.count / analytics.conversion_funnel.funnel_stages[0].count) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <div className="text-sm font-semibold text-gray-900">{formatNumber(stage.count)}</div>
                    <div className="text-xs text-gray-500">{formatPercentage(stage.conversion_rate)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Overall Conversion Rate: {formatPercentage(analytics.conversion_funnel.overall_conversion_rate)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {selectedTab === 'performance' && (
        <div className="space-y-6">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.performance_metrics.avg_response_time_ms.toFixed(0)}ms
                  </p>
                  <p className="text-xs text-gray-500">
                    Min: {analytics.performance_metrics.min_response_time_ms}ms | 
                    Max: {analytics.performance_metrics.max_response_time_ms}ms
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${responseTimeHealth.bg}`}>
                  <Clock className={`w-6 h-6 ${responseTimeHealth.color}`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(analytics.cache_performance.hit_rate_percent)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(analytics.cache_performance.hits)} hits / 
                    {formatNumber(analytics.cache_performance.misses)} misses
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${cacheHitRateHealth.bg}`}>
                  <Database className={`w-6 h-6 ${cacheHitRateHealth.color}`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(analytics.performance_metrics.total_responses)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Cache size: {analytics.cache_performance.memory_cache_size}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Cache Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Management</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => clearCache('responses')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Clear Response Cache
              </button>
              <button
                onClick={() => clearCache('context')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Clear Context Cache
              </button>
              <button
                onClick={() => clearCache('all')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Clear All Cache
              </button>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Current Cache Stats:</strong> 
                {analytics.cache_performance.memory_cache_size} items in memory, 
                {formatPercentage(analytics.cache_performance.hit_rate_percent)} hit rate
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Analytics Tab */}
      {selectedTab === 'leads' && (
        <div className="space-y-6">
          {/* Lead Scoring Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Scoring Distribution</h3>
            <div className="space-y-3">
              {analytics.lead_scoring_distribution.distribution.map((item) => (
                <div key={item.range} className="flex items-center">
                  <div className="w-24 text-sm font-medium text-gray-600">
                    {item.category}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          item.category === 'Very Hot' ? 'bg-red-500' :
                          item.category === 'Hot' ? 'bg-orange-500' :
                          item.category === 'Warm' ? 'bg-yellow-500' :
                          item.category === 'Lukewarm' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <div className="text-sm font-semibold text-gray-900">{item.count}</div>
                    <div className="text-xs text-gray-500">{formatPercentage(item.percentage)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Temporal Patterns */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Activity Hours</h3>
            <div className="grid grid-cols-12 gap-1">
              {analytics.temporal_patterns.hourly_patterns.map((hour) => (
                <div key={hour.hour} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{hour.hour}:00</div>
                  <div
                    className={`h-16 rounded ${
                      hour.hour === analytics.temporal_patterns.peak_hour
                        ? 'bg-blue-600'
                        : 'bg-blue-200'
                    }`}
                    style={{ height: `${Math.max(hour.percentage * 2, 8)}px` }}
                    title={`${hour.leads} leads (${formatPercentage(hour.percentage)})`}
                  />
                  <div className="text-xs text-gray-600 mt-1">{hour.leads}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Peak Hour:</strong> {analytics.temporal_patterns.peak_hour}:00 - 
                Most leads are generated during this time
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversations Tab */}
      {selectedTab === 'conversations' && (
        <div className="space-y-6">
          {/* Topic Analysis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Discussed Topics</h3>
            <div className="space-y-3">
              {Object.entries(analytics.conversation_analytics.topic_analysis.topic_percentages)
                .sort(([,a], [,b]) => b - a)
                .map(([topic, percentage]) => (
                <div key={topic} className="flex items-center">
                  <div className="w-24 text-sm font-medium text-gray-600 capitalize">
                    {topic.replace('_', ' ')}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm font-semibold text-gray-900">
                    {formatPercentage(percentage)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
              <div className="text-sm text-indigo-800">
                <strong>Most Popular Topic:</strong> {analytics.conversation_analytics.topic_analysis.most_discussed_topic} - 
                Based on {formatNumber(analytics.conversation_analytics.topic_analysis.total_messages_analyzed)} messages analyzed
              </div>
            </div>
          </div>

          {/* Response Time Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.conversation_analytics.response_times.avg_first_response_time_seconds.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">Avg First Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.conversation_analytics.response_times.avg_ai_response_time_seconds.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-600">Avg AI Response</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  analytics.conversation_analytics.response_times.response_time_trend === 'improving'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>
                  {analytics.conversation_analytics.response_times.response_time_trend === 'improving' ? (
                    <CheckCircle className="w-8 h-8 mx-auto" />
                  ) : (
                    <Clock className="w-8 h-8 mx-auto" />
                  )}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {analytics.conversation_analytics.response_times.response_time_trend}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
