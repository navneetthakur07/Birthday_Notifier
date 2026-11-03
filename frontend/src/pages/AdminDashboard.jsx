import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Shield,
  Users,
  Activity,
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Mail,
  Key,
  ExternalLink,
  Send,
  Unlink,
  Check,
  Stethoscope,
  Info
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('oauth2'); // default to oauth2 for easy access
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [oauthStatus, setOauthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [testingOAuth, setTestingOAuth] = useState(false);
  const [savingOAuth, setSavingOAuth] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Manual OAuth config form
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [refreshTokenInput, setRefreshTokenInput] = useState('');
  const [connectedEmailInput, setConnectedEmailInput] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes, configsRes, oauthRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/logs?limit=50'),
        api.get('/api/admin/configs'),
        api.get('/api/oauth2/status'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setLogs(logsRes.data || []);
      setConfigs(configsRes.data || []);
      setOauthStatus(oauthRes.data || null);

      if (oauthRes.data) {
        setConnectedEmailInput(oauthRes.data.connectedEmail || '');
        if (!testEmailTarget) {
          setTestEmailTarget(oauthRes.data.connectedEmail || '');
        }
      }
    } catch (err) {
      console.error('Error fetching admin details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.put(`/api/admin/users/${userId}/toggle-status`);
      setFeedback({ type: 'success', text: res.data.message });
      fetchAdminData();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update user status.' });
    }
  };

  const handleTriggerScheduler = async () => {
    try {
      setTriggering(true);
      setFeedback(null);
      const res = await api.post('/api/admin/trigger-scheduler');
      setFeedback({ type: 'success', text: res.data.message });
      fetchAdminData();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to trigger scheduler execution.' });
    } finally {
      setTriggering(false);
    }
  };

  const handleStartOAuthFlow = async () => {
    try {
      const redirectUri = window.location.origin + '/oauth2/callback';
      const res = await api.get(`/api/oauth2/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`);
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to start Google OAuth flow. Please ensure Client ID is entered below first.',
      });
    }
  };

  const handleSaveOAuthCredentials = async (e) => {
    e.preventDefault();
    try {
      setSavingOAuth(true);
      const res = await api.post('/api/oauth2/config', {
        clientId: clientIdInput,
        clientSecret: clientSecretInput,
        refreshToken: refreshTokenInput,
        connectedEmail: connectedEmailInput,
      });
      setFeedback({ type: 'success', text: res.data.message || 'OAuth 2.0 credentials updated successfully!' });
      setClientIdInput('');
      setClientSecretInput('');
      setRefreshTokenInput('');
      await fetchAdminData();
      // Auto-run diagnosis after saving
      handleDiagnose();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to save OAuth credentials.' });
    } finally {
      setSavingOAuth(false);
    }
  };

  const handleDiagnose = async () => {
    try {
      setDiagnosing(true);
      setDiagnosticReport(null);
      const res = await api.get('/api/oauth2/diagnose');
      setDiagnosticReport(res.data);
      if (res.data.success) {
        setFeedback({ type: 'success', text: res.data.message });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Diagnostic check failed.' });
    } finally {
      setDiagnosing(false);
    }
  };

  const handleTestOAuthEmail = async (e) => {
    if (e) e.preventDefault();
    try {
      setTestingOAuth(true);
      setFeedback(null);
      const res = await api.post('/api/oauth2/test', {
        targetEmail: testEmailTarget.trim() || undefined,
      });
      setFeedback({ type: 'success', text: res.data.message });
      fetchAdminData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'OAuth 2.0 test email failed.' });
    } finally {
      setTestingOAuth(false);
    }
  };

  const handleDisconnectOAuth = async () => {
    if (window.confirm('Disconnect Google OAuth 2.0? Scheduled reminders will fall back to simulation or SMTP.')) {
      try {
        const res = await api.post('/api/oauth2/disconnect');
        setFeedback({ type: 'success', text: res.data.message });
        setDiagnosticReport(null);
        fetchAdminData();
      } catch (err) {
        setFeedback({ type: 'error', text: 'Failed to disconnect OAuth.' });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Admin Title & Quick Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Admin Maintenance &amp; System Portal</h1>
              {oauthStatus?.connected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  OAuth 2.0 Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  OAuth 2.0 Setup Needed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Google OAuth 2.0 email dispatch, users, delivery audit logs, and scheduled jobs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            title="Refresh statistics"
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleTriggerScheduler}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {triggering ? 'Executing Job...' : 'Trigger 23:50 Scheduler Now'}
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span className="pr-4">{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-base">
            &times;
          </button>
        </div>
      )}

      {/* High-level KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">Total Users</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">Birthdays Tracked</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalBirthdays}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-medium text-slate-500">Total Notifications</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalNotifications}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-medium text-emerald-600">Delivered Successfully</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{stats.successfulNotifications}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-medium text-rose-600">Failed Deliveries</p>
            <p className="text-xl font-black text-rose-700 mt-0.5">{stats.failedNotifications}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl">
        <button
          onClick={() => setActiveTab('oauth2')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'oauth2'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          Google OAuth 2.0 Engine
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          User Maintenance ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Delivery &amp; Audit Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('configs')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'configs'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          System Configs
        </button>
      </div>

      {/* Tab: Google OAuth 2.0 Engine */}
      {activeTab === 'oauth2' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-6 shadow-sm">
          
          {/* Status Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            oauthStatus?.connected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${oauthStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <h3 className="text-sm font-bold">
                  {oauthStatus?.connected
                    ? 'Google OAuth 2.0 Email Engine: Ready & Configured'
                    : 'Google OAuth 2.0 Email Engine: Action Required'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                {oauthStatus?.connected
                  ? `Emails are dispatched directly via Google's official Gmail REST API (v1) using scoped OAuth 2.0 tokens from ${oauthStatus.connectedEmail || 'your authorized Google Account'}. Outbound SMTP ports (587, 465) are bypassed completely.`
                  : 'Modern email delivery uses Google OAuth 2.0 (Gmail REST API) instead of legacy passwords. Enter your credentials below or use the 1-Click Connect flow.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDiagnose}
                disabled={diagnosing}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                {diagnosing ? 'Diagnosing...' : 'Diagnose Connection'}
              </button>

              {oauthStatus?.connected && (
                <button
                  onClick={handleDisconnectOAuth}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              )}

              {!oauthStatus?.connected && (
                <button
                  onClick={handleStartOAuthFlow}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  1-Click Google Connect
                </button>
              )}
            </div>
          </div>

          {/* Diagnostic Report Card (if run) */}
          {diagnosticReport && (
            <div className={`p-5 rounded-2xl border ${
              diagnosticReport.success
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/90 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${diagnosticReport.success ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                  {diagnosticReport.success ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {diagnosticReport.success ? '✅ Diagnostic Passed — Connection Healthy' : '❌ Diagnostic Failed — Google Rejected Token'}
                  </h4>
                  <p className="text-xs">{diagnosticReport.message}</p>
                  {diagnosticReport.connectedEmail && (
                    <p className="text-[11px] font-semibold mt-1">
                      Authorized Sender Account: <span className="underline">{diagnosticReport.connectedEmail}</span>
                    </p>
                  )}
                  {diagnosticReport.grantedScopes && (
                    <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                      Verified OAuth Scope: <span className="text-emerald-700 font-semibold">{diagnosticReport.grantedScopes}</span>
                    </p>
                  )}
                  {diagnosticReport.status === 'GOOGLE_API_ERROR' && (
                    <div className="mt-2 p-3 bg-white/80 rounded-xl text-[11px] space-y-1 text-slate-800 border border-rose-200">
                      <p className="font-bold text-rose-700">How to fix this issue:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        <li>If error says <strong>invalid_grant</strong>: The Refresh Token is expired or was generated with a different Client ID. Follow the OAuth Playground steps below with your EXACT Client ID &amp; Secret.</li>
                        <li>If error says <strong>invalid_client</strong>: Verify the Client Secret does not contain extra spaces and matches Google Cloud Console.</li>
                        <li>Ensure your email is added to <strong>Test Users</strong> under Google Cloud Console &gt; OAuth Consent Screen.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Stored Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Client ID</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1 truncate">
                {oauthStatus?.clientId || '(Not configured)'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Refresh Token</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1 truncate">
                {oauthStatus?.refreshToken || '(Not configured)'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Authorized Sender</p>
              <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                {oauthStatus?.connectedEmail || '(None)'}
              </p>
            </div>
          </div>

          {/* Test Live Email Section */}
          <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                Send Live Test Email to Any Inbox
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter your real Gmail address below and click send. This tests the complete OAuth 2.0 access token exchange and Gmail API delivery to your real inbox:
              </p>
            </div>

            <form onSubmit={handleTestOAuthEmail} className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <input
                type="email"
                required
                placeholder="your.real.email@gmail.com"
                value={testEmailTarget}
                onChange={(e) => setTestEmailTarget(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={testingOAuth}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {testingOAuth ? 'Dispatching via Google API...' : 'Send Live Test Email'}
              </button>
            </form>
          </div>

          {/* Credentials Setup Form */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  ⚙️ Google OAuth 2.0 Credentials Form
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update or paste your Google Cloud Console credentials below:
                </p>
              </div>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveOAuthCredentials} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Google Client ID</label>
                  <input
                    type="text"
                    placeholder="xxxx.apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Google Client Secret</label>
                  <input
                    type="password"
                    placeholder="GOCSPX-xxxx"
                    value={clientSecretInput}
                    onChange={(e) => setClientSecretInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Refresh Token (starts with 1//0...)
                  </label>
                  <input
                    type="password"
                    placeholder="1//0xxxx (from Google OAuth Playground)"
                    value={refreshTokenInput}
                    onChange={(e) => setRefreshTokenInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Email Address</label>
                  <input
                    type="email"
                    placeholder="your-account@gmail.com"
                    value={connectedEmailInput}
                    onChange={(e) => setConnectedEmailInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingOAuth}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingOAuth ? 'Saving...' : 'Save OAuth 2.0 Credentials'}
                </button>
              </div>
            </form>

            {/* Step-by-Step Educational Callout */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <Info className="w-4 h-4 text-amber-700" />
                How to generate a Refresh Token in 60 seconds (Google OAuth Playground):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                <li>Go to <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" className="text-amber-800 font-semibold underline">developers.google.com/oauthplayground</a>.</li>
                <li>Click the <strong>Gear icon ⚙️ (OAuth 2.0 configuration)</strong> in the top right corner.</li>
                <li>Check the box: <strong>"Use your own OAuth credentials"</strong>.</li>
                <li>Paste your <strong>OAuth Client ID</strong> and <strong>OAuth Client Secret</strong>.</li>
                <li>Under Step 1 on the left, scroll down to <strong>Gmail API v1</strong> and select <code className="bg-white px-1 py-0.5 rounded text-indigo-700 font-mono">https://www.googleapis.com/auth/gmail.send</code>.</li>
                <li>Click the blue <strong>"Authorize APIs"</strong> button and log into your Gmail account.</li>
                <li>Under Step 2, click <strong>"Exchange authorization code for tokens"</strong>.</li>
                <li>Copy the <strong>Refresh token</strong> (starts with <code className="font-mono font-bold">1//0...</code>) and paste it into the form above!</li>
              </ol>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: User Maintenance */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Roles</th>
                  <th className="px-6 py-3.5">Birthdays Tracked</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Registered On</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{u.fullName}</p>
                      <p className="text-slate-500 text-[11px]">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {u.roles?.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r === 'ROLE_ADMIN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.replace('ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-bold">
                      {u.totalBirthdays} entries
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          u.active
                            ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Delivery & Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Delivery Method &amp; Status</th>
                  <th className="px-6 py-3.5">Person Name</th>
                  <th className="px-6 py-3.5">Recipient User &amp; Email</th>
                  <th className="px-6 py-3.5">Sent Timestamp</th>
                  <th className="px-6 py-3.5">Message ID / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No notification logs recorded yet. Use "Trigger 23:50 Scheduler Now" to test.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status?.includes('SUCCESS')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.status === 'SIMULATED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.status?.includes('SUCCESS') && <CheckCircle className="w-3 h-3" />}
                          {log.status === 'SIMULATED' && <Clock className="w-3 h-3" />}
                          {log.status?.includes('FAILED') && <XCircle className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{log.personName}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{log.userName || 'User'}</p>
                        <p className="text-slate-500 text-[11px]">{log.recipientEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px] max-w-xs truncate" title={log.errorMessage}>
                        {log.errorMessage || 'Delivered without errors.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Configurations */}
      {activeTab === 'configs' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-4 shadow-sm">
          <p className="text-xs text-slate-600">
            System configuration variables controlling the 23:50 scheduler and notification properties:
          </p>
          <div className="space-y-3">
            {configs.map((cfg) => (
              <div
                key={cfg.configKey}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 font-mono">{cfg.configKey}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{cfg.description}</p>
                </div>
                <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-brand-700 font-bold max-w-xs truncate">
                  {cfg.configKey.includes('SECRET') || cfg.configKey.includes('TOKEN')
                    ? '********'
                    : cfg.configValue}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
