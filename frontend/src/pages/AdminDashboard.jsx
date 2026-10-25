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
  Mail
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes, configsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/logs?limit=50'),
        api.get('/api/admin/configs'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setLogs(logsRes.data || []);
      setConfigs(configsRes.data || []);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Admin Title & Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Admin Maintenance &amp; System Portal</h1>
            <p className="text-xs text-slate-500">
              Manage registered users, inspect notification logs, and test scheduler execution.
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
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
          App Configurations
        </button>
      </div>

      {/* Tab 1: User Maintenance */}
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

      {/* Tab 2: Delivery & Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Person Name</th>
                  <th className="px-6 py-3.5">Recipient User &amp; Email</th>
                  <th className="px-6 py-3.5">Sent Timestamp</th>
                  <th className="px-6 py-3.5">Error / Details</th>
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
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : log.status === 'SIMULATED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {log.status === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}
                          {log.status === 'SIMULATED' && <Clock className="w-3 h-3" />}
                          {log.status === 'FAILED' && <XCircle className="w-3 h-3" />}
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
                      <td className="px-6 py-4 text-slate-500 text-[11px] max-w-xs truncate">
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

      {/* Tab 3: App Configurations */}
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
                <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-brand-700 font-bold">
                  {cfg.configValue}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
