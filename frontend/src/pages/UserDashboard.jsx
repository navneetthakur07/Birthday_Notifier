import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AddEditBirthdayModal from '../components/AddEditBirthdayModal';
import {
  Cake,
  Plus,
  Search,
  Calendar,
  Clock,
  Send,
  Edit2,
  Trash2,
  Sparkles,
  Users,
  Bell,
  Heart,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRelationship, setFilterRelationship] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState(null);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/birthdays');
      setBirthdays(res.data || []);
    } catch (err) {
      console.error('Error fetching birthdays', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const handleSave = async (data) => {
    if (editingBirthday) {
      await api.put(`/api/birthdays/${editingBirthday.id}`, data);
      setNotificationMsg({ type: 'success', text: `Updated ${data.personName}'s birthday.` });
    } else {
      await api.post('/api/birthdays', data);
      setNotificationMsg({ type: 'success', text: `Added ${data.personName} to your reminder list!` });
    }
    fetchBirthdays();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from your birthday list?`)) {
      try {
        await api.delete(`/api/birthdays/${id}`);
        setNotificationMsg({ type: 'success', text: `Removed ${name} from reminders.` });
        fetchBirthdays();
      } catch (err) {
        setNotificationMsg({ type: 'error', text: 'Failed to delete birthday entry.' });
      }
    }
  };

  const handleSendTestReminder = async (id, name) => {
    try {
      setNotificationMsg({ type: 'info', text: `Sending test reminder for ${name}...` });
      const res = await api.post(`/api/birthdays/${id}/test-reminder`);
      setNotificationMsg({ type: 'success', text: res.data.message || `Test email dispatched to ${user.email}!` });
    } catch (err) {
      console.error(err);
      setNotificationMsg({ type: 'error', text: 'Failed to trigger test reminder email.' });
    }
  };

  const tomorrowBirthdays = birthdays.filter((b) => b.tomorrow);
  const filteredBirthdays = birthdays.filter((b) => {
    const matchesSearch =
      b.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRel = filterRelationship === 'ALL' || b.relationship === filterRelationship;
    return matchesSearch && matchesRel;
  });

  const getRelationshipColor = (rel) => {
    switch (rel) {
      case 'FAMILY':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'FRIEND':
        return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'COLLEAGUE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Notification Alert */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-sm transition-all animate-in fade-in duration-200 ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : notificationMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {notificationMsg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
            {notificationMsg.type === 'info' && <Clock className="w-4 h-4 text-indigo-600" />}
            <span>{notificationMsg.text}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Hero / Midnight-Eve Alert Banner if Tomorrow is someone's birthday */}
      {tomorrowBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-brand-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                23:50 Midnight-Eve Alert Active!
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                {tomorrowBirthdays.length === 1
                  ? `Tomorrow is ${tomorrowBirthdays[0].personName}'s Birthday! 🎂`
                  : `${tomorrowBirthdays.length} birthdays are coming up tomorrow! 🎂`}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm max-w-xl">
                The reminder engine will dispatch an email to <span className="font-semibold text-white underline">{user?.email}</span> tonight at <strong>23:50 (11:50 PM)</strong> so you have 10 minutes to wish them right at midnight!
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSendTestReminder(tomorrowBirthdays[0].id, tomorrowBirthdays[0].personName)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-brand-600" />
                Send Test Email Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tracked Birthdays</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{birthdays.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <Cake className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Upcoming in 30 Days</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {birthdays.filter((b) => b.daysUntil <= 30).length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Automated 23:50 Reminders</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {birthdays.filter((b) => b.reminderEnabled).length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Bell className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or gift notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'FRIEND', 'FAMILY', 'COLLEAGUE'].map((rel) => (
            <button
              key={rel}
              onClick={() => setFilterRelationship(rel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterRelationship === rel
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rel === 'ALL' ? 'All Contacts' : rel.charAt(0) + rel.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Add Button */}
        <button
          onClick={() => {
            setEditingBirthday(null);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Birthday
        </button>
      </div>

      {/* Birthdays Grid / Empty State */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs font-medium text-slate-500">Loading your birthday calendar...</p>
        </div>
      ) : filteredBirthdays.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center mb-4">
            <Cake className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No birthdays found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No loved ones match your search criteria. Try a different query.'
              : 'Add your friends and family members so you get reminded at 23:50 the night before!'}
          </p>
          <button
            onClick={() => {
              setEditingBirthday(null);
              setModalOpen(true);
            }}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add First Birthday
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBirthdays.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-md flex flex-col justify-between ${
                item.tomorrow
                  ? 'border-amber-300 ring-2 ring-amber-100 shadow-sm'
                  : item.today
                  ? 'border-brand-300 ring-2 ring-brand-100 shadow-sm'
                  : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-snug">{item.personName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRelationshipColor(
                          item.relationship
                        )}`}
                      >
                        {item.relationship}
                      </span>
                      {item.turningAge && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Turning {item.turningAge} 🎉
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      item.today
                        ? 'bg-purple-100 text-purple-800 animate-pulse'
                        : item.tomorrow
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : item.daysUntil <= 7
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.today
                      ? '🎈 Today!'
                      : item.tomorrow
                      ? '⏰ Tomorrow (Alert 23:50)'
                      : `In ${item.daysUntil} days`}
                  </span>
                </div>

                {/* Date display */}
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>{item.formattedBirthday}</span>
                </div>

                {/* Notes snippet */}
                {item.notes && (
                  <p className="mt-3 text-xs text-slate-500 italic bg-slate-50/50 p-2 rounded-lg line-clamp-2">
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleSendTestReminder(item.id, item.personName)}
                  title="Send sample 23:50 reminder email now"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Test Email
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingBirthday(item);
                      setModalOpen(true);
                    }}
                    title="Edit entry"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.personName)}
                    title="Delete entry"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditBirthdayModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBirthday(null);
        }}
        onSave={handleSave}
        editingBirthday={editingBirthday}
      />
    </div>
  );
}
