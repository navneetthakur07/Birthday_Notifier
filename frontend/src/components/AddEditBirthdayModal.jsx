import React, { useState, useEffect } from 'react';
import { X, Calendar, Gift, Heart, Mail, Phone, Bell } from 'lucide-react';

const MONTHS = [
  { value: 1, name: 'January' },
  { value: 2, name: 'February' },
  { value: 3, name: 'March' },
  { value: 4, name: 'April' },
  { value: 5, name: 'May' },
  { value: 6, name: 'June' },
  { value: 7, name: 'July' },
  { value: 8, name: 'August' },
  { value: 9, name: 'September' },
  { value: 10, name: 'October' },
  { value: 11, name: 'November' },
  { value: 12, name: 'December' },
];

export default function AddEditBirthdayModal({ isOpen, onClose, onSave, editingBirthday }) {
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('FRIEND');
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [birthYear, setBirthYear] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingBirthday) {
      setPersonName(editingBirthday.personName || '');
      setRelationship(editingBirthday.relationship || 'FRIEND');
      setBirthMonth(editingBirthday.birthMonth || 1);
      setBirthDay(editingBirthday.birthDay || 1);
      setBirthYear(editingBirthday.birthYear || '');
      setContactEmail(editingBirthday.contactEmail || '');
      setPhoneNumber(editingBirthday.phoneNumber || '');
      setNotes(editingBirthday.notes || '');
      setReminderEnabled(editingBirthday.reminderEnabled ?? true);
    } else {
      setPersonName('');
      setRelationship('FRIEND');
      const today = new Date();
      setBirthMonth(today.getMonth() + 1);
      setBirthDay(today.getDate());
      setBirthYear('');
      setContactEmail('');
      setPhoneNumber('');
      setNotes('');
      setReminderEnabled(true);
    }
    setError('');
  }, [editingBirthday, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim()) {
      setError('Please provide a name');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await onSave({
        personName: personName.trim(),
        relationship,
        birthMonth: Number(birthMonth),
        birthDay: Number(birthDay),
        birthYear: birthYear ? Number(birthYear) : null,
        contactEmail: contactEmail.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        notes: notes.trim() || null,
        reminderEnabled,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save birthday entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">
              {editingBirthday ? 'Edit Birthday Entry' : 'Add Loved One\'s Birthday'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Person's Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Grandma Rose, Alex, Mom"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="FRIEND">Friend</option>
                <option value="FAMILY">Family</option>
                <option value="COLLEAGUE">Colleague</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Birth Year (Optional)</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="e.g. 1995"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Month & Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Birth Month</label>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Birth Day</label>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes / Gift ideas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes &amp; Gift Ideas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Loves espresso, preferred perfume, call them at midnight!"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
            ></textarea>
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-center justify-between p-3 bg-brand-50/50 rounded-xl border border-brand-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-600" />
              <div>
                <p className="text-xs font-semibold text-slate-800">23:50 Midnight Eve Reminder</p>
                <p className="text-[11px] text-slate-500">Send email notification 10 minutes before their birthday</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Saving...' : editingBirthday ? 'Update Birthday' : 'Save Birthday'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

