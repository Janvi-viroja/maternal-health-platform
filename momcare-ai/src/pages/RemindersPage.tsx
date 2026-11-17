import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { PageId, Reminder } from '../types';

function getTodayLocalYyyyMmDd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

const REMINDER_CATEGORIES = [
  { value: 'All', label: 'All' },
  { value: 'Appointment', label: 'Doctor Visit' },
  { value: 'Prenatal Checkup', label: 'Checkup' },
  { value: 'Supplement', label: 'Vitamins & Pills' },
  { value: 'Vaccination', label: 'Vaccines' },
  { value: 'Hydration', label: 'Water' },
  { value: 'Milestone', label: 'Milestone' },
];

interface RemindersPageProps {
  onNavigate: (page: PageId) => void;
}

export const RemindersPage: React.FC<RemindersPageProps> = ({ onNavigate }) => {
  const { user, apiFetch } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Supplement');
  const [dueDate, setDueDate] = useState(getTodayLocalYyyyMmDd);
  const [dueTime, setDueTime] = useState('09:00 AM');
  const [frequency, setFrequency] = useState('Daily');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ reminders: Reminder[] }>('/api/reminders');
      setReminders(data.reminders || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load reminders.');
    } finally {
      setLoading(false);
    }
  }, [user, apiFetch]);

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in to save personalized reminders.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter a reminder title.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await apiFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          category,
          dueDate,
          dueTime,
          frequency,
          notes: notes.trim() || undefined,
        }),
      });
      setTitle('');
      setNotes('');
      await loadReminders();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item: Reminder) => {
    try {
      await apiFetch(`/api/reminders/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !item.completed }),
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, completed: !item.completed } : r))
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update reminder.');
    }
  };

  const startEdit = (item: Reminder) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDueDate(item.dueDate);
    setEditDueTime(item.dueTime);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editTitle.trim()) {
      setErrorMsg('Reminder title cannot be empty.');
      return;
    }
    setErrorMsg(null);
    setSavingEdit(true);
    try {
      const data = await apiFetch<{ reminder: Reminder }>(`/api/reminders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle.trim(),
          dueDate: editDueDate,
          dueTime: editDueTime.trim() || '09:00 AM',
          notes: editNotes.trim() || null,
        }),
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? data.reminder : r))
      );
      setEditingId(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update reminder.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/reminders/${id}`, { method: 'DELETE' });
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete reminder.');
    }
  };

  const visible = reminders.filter((r) => filter === 'All' || r.category === filter);

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-[#8E2F4C]">
          Daily Vitamins, Doctor Checkups & Vaccines
        </p>
        <h1 className="text-3xl font-semibold text-[#231B24]">
          Pills & Checkup Reminders
        </h1>
        <p className="text-sm text-[#5E4E5E]">
          Never miss your daily vitamins, doctor checkups, vaccines, water breaks, or pregnancy milestones.
        </p>
      </div>

      {!user && (
        <div className="p-5 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-[#3F3142]">
            Sign in to save your daily pill, checkup, and vaccine reminders.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-4 py-2 rounded-xl bg-[#6E56A3] text-white text-xs font-semibold hover:bg-[#59438B] whitespace-nowrap cursor-pointer"
          >
            Sign In / Try Demo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleAdd}
          className="lg:col-span-4 rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#8E2F4C]" />
            <h2 className="text-lg font-semibold text-[#231B24]">Add Reminder</h2>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              What do you need to remember? *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Iron & Calcium tablet"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
            >
              {REMINDER_CATEGORIES.filter((c) => c.value !== 'All').map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Time
              </label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="09:00 AM"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              How Often
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
            >
              <option value="Daily">Every Day</option>
              <option value="Weekly">Every Week</option>
              <option value="Once">Just Once</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Extra Note (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Take after lunch with water"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !user}
            className="w-full py-2.5 px-4 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Reminder'}
          </button>
        </form>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5]">
            {REMINDER_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFilter(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  filter === cat.value
                    ? 'bg-white text-[#231B24] shadow-xs'
                    : 'text-[#6E5C6B] hover:text-[#231B24]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] animate-pulse"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] text-center space-y-2">
              <p className="text-sm font-semibold text-[#231B24]">
                No reminders here yet
              </p>
              <p className="text-xs text-[#6E5C6B]">
                Add your daily vitamins, vaccine dates, or checkups on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    item.completed
                      ? 'bg-[#FDF8F6] border-[#EDE1E5] opacity-75'
                      : 'bg-white border-[#EDE1E5]'
                  }`}
                >
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          aria-label="Edit reminder title"
                          className="sm:col-span-3 px-3 py-2 rounded-xl border border-[#DFCED4] text-sm"
                        />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          aria-label="Edit reminder date"
                          className="px-3 py-2 rounded-xl border border-[#DFCED4] text-xs"
                        />
                        <input
                          type="text"
                          value={editDueTime}
                          onChange={(e) => setEditDueTime(e.target.value)}
                          aria-label="Edit reminder time"
                          className="px-3 py-2 rounded-xl border border-[#DFCED4] text-xs"
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes"
                          aria-label="Edit reminder notes"
                          className="px-3 py-2 rounded-xl border border-[#DFCED4] text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DFCED4] text-xs font-medium text-[#5E4E5E] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingEdit}
                          onClick={() => void handleSaveEdit(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#6E56A3] text-white text-xs font-semibold hover:bg-[#59438B] cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {savingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => void handleToggle(item)}
                          aria-label={`Mark ${item.title} as ${
                            item.completed ? 'incomplete' : 'completed'
                          }`}
                          className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer ${
                            item.completed
                              ? 'bg-[#15803D] border-[#15803D] text-white'
                              : 'bg-white border-[#DFCED4]'
                          }`}
                        >
                          {item.completed && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="space-y-1">
                          <p className="text-xs text-[#6E5C6B] tabular-nums">
                            {item.category} · {item.dueDate} · {item.dueTime} · {item.frequency}
                          </p>
                          <h3
                            className={`text-sm font-semibold ${
                              item.completed
                                ? 'line-through text-[#7A6879]'
                                : 'text-[#231B24]'
                            }`}
                          >
                            {item.title}
                          </h3>
                          {item.notes && (
                            <p className="text-xs text-[#5E4E5E]">{item.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          aria-label={`Edit ${item.title}`}
                          className="p-2 rounded-lg text-[#7A6879] hover:text-[#5B4490] hover:bg-[#F6F2FB] cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          aria-label={`Delete ${item.title}`}
                          className="p-2 rounded-lg text-[#7A6879] hover:text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
