import React, { useCallback, useEffect, useState } from 'react';
import { Baby, CheckCircle2, HeartHandshake, Moon, Smile } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import type { PageId, PostpartumLog } from '../types';

interface PostpartumPageProps {
  onNavigate: (page: PageId) => void;
}

type GuideTab = 'recovery' | 'breastfeeding' | 'newborn' | 'mental' | 'nutrition';

export const PostpartumPage: React.FC<PostpartumPageProps> = ({ onNavigate }) => {
  const { user, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<GuideTab>('recovery');
  const [logs, setLogs] = useState<PostpartumLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [logDate, setLogDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  });
  const [mood, setMood] = useState('Calm & Hopeful');
  const [sleepHours, setSleepHours] = useState('6.0');
  const [feedingCount, setFeedingCount] = useState('8');
  const [painLevel, setPainLevel] = useState('2');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ logs: PostpartumLog[] }>('/api/postpartum/logs');
      setLogs(data.logs || []);
    } catch {
      // ignore if unauthenticated
    } finally {
      setLoading(false);
    }
  }, [user, apiFetch]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErrMsg(null);
    if (!user) {
      setErrMsg('Please sign in to save daily recovery logs.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/postpartum/logs', {
        method: 'POST',
        body: JSON.stringify({
          logDate,
          mood,
          sleepHours,
          feedingCount: Number(feedingCount),
          painLevel: Number(painLevel),
          notes: notes.trim() || undefined,
        }),
      });
      setNotes('');
      setMsg('Postpartum recovery log saved.');
      await loadLogs();
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : 'Unable to save log.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-2">
          <p className="text-xs font-semibold text-[#8E2F4C]">
            Care After Birth & Newborn Help
          </p>
          <h1 className="text-3xl font-semibold text-[#231B24]">
            After Birth & Baby Care
          </h1>
          <p className="text-sm text-[#5E4E5E] leading-relaxed">
            Simple advice for body healing, feeding your baby, newborn care, emotional health, and daily recovery notes for new moms.
          </p>
        </div>
        <div className="lg:col-span-5 aspect-[4/3] rounded-3xl overflow-hidden border border-[#EDE1E5]">
          <SafeImage
            src="/src/assets/images/postpartum_mother_baby_1794900598814.jpg"
            alt="New mother holding her newborn baby by a sunlit window"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Educational Tabs */}
      <div className="rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5]">
          {(
            [
              { id: 'recovery', label: 'Body Healing' },
              { id: 'breastfeeding', label: 'Feeding Baby' },
              { id: 'newborn', label: 'Newborn Care' },
              { id: 'mental', label: 'Mood & Mind' },
              { id: 'nutrition', label: 'Healing Foods' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white text-[#231B24] shadow-xs'
                  : 'text-[#6E5C6B] hover:text-[#231B24]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'recovery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#231B24]">
                Healing After Normal Birth or C-Section
              </h2>
              <p className="text-sm text-[#5E4E5E] leading-relaxed">
                After giving birth, give your body gentle rest for the first 6 weeks. Warm water baths help soothe soreness after a normal birth. If you had a C-section, keep the stitches clean and dry, and do not lift anything heavier than your baby until your doctor says it is okay.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#FFF7F5] border border-[#EFE1E5] space-y-2">
              <p className="text-xs font-semibold text-[#B91C1C]">
                Call Your Doctor Right Away If You Notice
              </p>
              <ul className="text-xs text-[#4A3B4B] space-y-1.5">
                <li>• Soaking more than 1 heavy pad in an hour or passing big blood clots</li>
                <li>• Fever over 100.4°F (38°C) or bad-smelling discharge</li>
                <li>• Redness, swelling, warmth, or opening around your C-section stitches</li>
                <li>• Swelling in one leg, chest pain, or trouble breathing</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'breastfeeding' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#231B24]">
                Comfortable Latch & Feeding Times
              </h2>
              <p className="text-sm text-[#5E4E5E] leading-relaxed">
                Newborns drink 8 to 12 times in 24 hours whenever they are hungry. Hold your baby tummy-to-tummy at chest height so they open wide and take a deep, pain-free latch. Listen for soft swallowing sounds.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2] space-y-2">
              <p className="text-xs font-semibold text-[#5B4490]">Signs Baby Is Getting Enough Milk</p>
              <ul className="text-xs text-[#4A3B4B] space-y-1.5">
                <li>• 6 or more wet diapers a day by Day 5–6</li>
                <li>• Soft yellow poop after the first dark baby poop passes</li>
                <li>• Your breasts feel softer and lighter after a feed</li>
                <li>• Ask a feeding specialist or doctor if breastfeeding hurts every time</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'newborn' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#231B24]">
                Safe Sleep & Daily Baby Care
              </h2>
              <p className="text-sm text-[#5E4E5E] leading-relaxed">
                Always lay your baby flat on their back on a firm bed with no loose blankets, pillows, or soft toys nearby. Keep the belly-button stump clean and dry so it falls off naturally in 1 to 3 weeks.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#FFF5EE] border border-[#F2E2D7] space-y-2">
              <p className="text-xs font-semibold text-[#8C5B3C]">Simple Baby Tips</p>
              <ul className="text-xs text-[#4A3B4B] space-y-1.5">
                <li>• Holding baby skin-to-skin keeps them warm, calm, and steady</li>
                <li>• Gently burp baby after feeds and watch for hunger signs like sucking fingers</li>
                <li>• Call a baby doctor right away if a baby under 3 months gets a fever</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'mental' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#231B24]">
                Baby Blues vs. Deeper Sadness
              </h2>
              <p className="text-sm text-[#5E4E5E] leading-relaxed">
                Feeling tearful or moody ("baby blues") is very common in the first 2 weeks after birth. If deep sadness, strong worry, or panic stays past two weeks, please talk openly with your doctor — help is available and works well.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F6F2FB] border border-[#E7DFF2] space-y-2">
              <p className="text-xs font-semibold text-[#5B4490]">Easy Ways to Care for Your Mind</p>
              <ul className="text-xs text-[#4A3B4B] space-y-1.5">
                <li>• Ask family or your partner to watch baby so you get one 4-hour nap</li>
                <li>• Step outside into morning sunlight for 10–15 minutes</li>
                <li>• Talk honestly with someone you trust or your doctor when things feel heavy</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#231B24]">
                Warm Foods for Healing & Milk
              </h2>
              <p className="text-sm text-[#5E4E5E] leading-relaxed">
                Making milk uses extra energy every day. Eat warm, easy-to-digest home foods like moong dal soup, ajwain-jeera water, soaked almonds, oats, methi leaves, paneer, eggs or fish, and drink water at every feed.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#FFF7F5] border border-[#EFE1E5] space-y-2">
              <p className="text-xs font-semibold text-[#8E2F4C]">Everyday After-Birth Foods</p>
              <ul className="text-xs text-[#4A3B4B] space-y-1.5">
                <li>• Keep taking calcium, vitamin D, and iron if your doctor told you to</li>
                <li>• Eat soft vegetables and drink warm fluids to stay comfortable</li>
                <li>• Keep easy one-hand snacks like nuts, dates, and fruit near your feeding spot</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Recovery Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveLog}
          className="lg:col-span-5 rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#8E2F4C]" />
            <h2 className="text-lg font-semibold text-[#231B24]">
              Daily Check-In
            </h2>
          </div>

          {!user && (
            <div className="p-3 rounded-xl bg-[#F6F2FB] border border-[#E7DFF2] text-xs text-[#4D387B] flex items-center justify-between gap-2">
              <span>Sign in to save your daily notes.</span>
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="font-semibold underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}

          {errMsg && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              {errMsg}
            </div>
          )}
          {msg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#DFCED4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                How You Feel Today
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DFCED4] bg-white text-sm"
              >
                <option value="Calm & Hopeful">Calm & Hopeful</option>
                <option value="Tired but Steady">Tired but Steady</option>
                <option value="Overwhelmed / Tearful">Overwhelmed / Tearful</option>
                <option value="Anxious">Worried</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Hours Slept
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="16"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DFCED4] text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                Baby Feeds Today
              </label>
              <input
                type="number"
                min="0"
                max="24"
                value={feedingCount}
                onChange={(e) => setFeedingCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DFCED4] text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-[#231B24]">
                Pain Level Today (1–10)
              </span>
              <span className="font-mono text-[#8E2F4C] tabular-nums">
                {painLevel} / 10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={painLevel}
              onChange={(e) => setPainLevel(e.target.value)}
              className="w-full accent-[#B84A6A] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Daily Note (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write how healing feels or questions for your doctor..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !user}
            className="w-full py-2.5 px-4 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Today’s Check-In'}
          </button>
        </form>

        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#231B24]">Your Past Check-Ins</h2>

          {loading ? (
            <div className="h-32 rounded-2xl bg-[#FDF8F6] animate-pulse" />
          ) : logs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] text-center space-y-1">
              <p className="text-sm font-semibold text-[#231B24]">No check-ins yet</p>
              <p className="text-xs text-[#6E5C6B]">
                Save your sleep, mood, baby feeds, and pain level on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E5C6B] tabular-nums">
                    <span className="font-semibold text-[#231B24]">{entry.logDate}</span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Smile className="w-3.5 h-3.5 text-[#8E2F4C]" />
                        {entry.mood}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5 text-[#5B4490]" />
                        {entry.sleepHours}h sleep
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Baby className="w-3.5 h-3.5 text-[#A25B34]" />
                        {entry.feedingCount} feeds
                      </span>
                      <span>Pain {entry.painLevel}/10</span>
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-[#4A3B4B] leading-relaxed">{entry.notes}</p>
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
