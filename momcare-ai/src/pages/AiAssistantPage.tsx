import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bot, Send, ShieldAlert, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isEmergency?: boolean;
}

const SUGGESTED_PROMPTS = [
  'I am in Week 24 — what body changes are normal, and when should I call my doctor?',
  'What simple Indian vegetarian foods give good iron during pregnancy?',
  'What easy questions should I ask my doctor at my next checkup?',
  'How can I rest and heal well in the first 2 weeks after delivery?',
];

export const AiAssistantPage: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [weekContext, setWeekContext] = useState<string>(
    user?.pregnancyWeek ? String(user.pregnancyWeek) : '24'
  );
  const [userChangedWeek, setUserChangedWeek] = useState(false);

  useEffect(() => {
    if (!userChangedWeek && user?.pregnancyWeek) {
      setWeekContext(String(Math.min(40, Math.max(1, user.pregnancyWeek))));
    }
  }, [user?.pregnancyWeek, userChangedWeek]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am MomCare AI, your friendly pregnancy helper. Ask me anything in simple words about symptoms, everyday healthy food, baby growth, after-birth care, or what to ask your doctor.\n\nPlease remember: I share general tips only and cannot replace a real doctor or prescribe medicine.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const historyPayload = nextMessages
        .filter((m) => m.id !== 'welcome')
        .slice(0, -1)
        .map((m) => ({ role: m.role, text: m.text }));

      const data = await apiFetch<{ reply: string; isEmergency?: boolean }>(
        '/api/ai/assistant',
        {
          method: 'POST',
          body: JSON.stringify({
            message: trimmed,
            history: historyPayload,
            weekContext: weekContext ? Number(weekContext) : null,
          }),
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply,
          isEmergency: data.isEmergency,
        },
      ]);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to reach MomCare AI right now. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#6E56A3]">
            Friendly 24/7 Pregnancy Helper
          </p>
          <h1 className="text-3xl font-semibold text-[#231B24]">
            Ask MomCare AI
          </h1>
          <p className="text-sm text-[#5E4E5E]">
            Ask any question in plain English about pregnancy, daily food, baby growth, or after-birth care.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-medium text-[#5E4E5E]" htmlFor="ai-week-select">
            Your Week:
          </label>
          <select
            id="ai-week-select"
            value={weekContext}
            onChange={(e) => {
              setUserChangedWeek(true);
              setWeekContext(e.target.value);
            }}
            className="px-3 py-2 rounded-xl border border-[#DFCED4] bg-white text-xs font-semibold text-[#231B24] tabular-nums"
          >
            {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={String(w)}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-[#FFF5EE] border border-[#F2E2D7] flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <p className="text-xs text-[#5E4E5E] leading-relaxed">
          <strong className="text-[#231B24]">Please Remember:</strong> MomCare AI gives everyday tips only — it is not a doctor and cannot prescribe medicine. Call your doctor or go to the hospital right away if you have heavy bleeding, strong belly pain, a bad headache, blurry eyes, high fever, leaking water, or if your baby stops moving.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chat Stream */}
        <div className="lg:col-span-8 rounded-3xl bg-white border border-[#EDE1E5] flex flex-col h-[580px] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-[#F5F1FB] text-[#5B4490] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#B84A6A] text-white'
                      : msg.isEmergency
                      ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#7F1D1D]'
                      : 'bg-[#FDF8F6] border border-[#EDE1E5] text-[#231B24]'
                  }`}
                >
                  {msg.isEmergency && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#B91C1C] mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Urgent Medical Attention Recommended</span>
                    </div>
                  )}
                  {msg.text}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#FCE7EE] text-[#8E2F4C] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-3 text-xs text-[#6E5C6B]">
                <div className="w-8 h-8 rounded-full bg-[#F5F1FB] text-[#5B4490] flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span>Reviewing maternal guidance...</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mx-5 mb-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-[#EDE1E5] bg-[#FDF8F6] flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question here (e.g., What should I eat for energy?)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>

        {/* Suggested Prompts & Topics */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#231B24]">
              Tap a Question to Try
            </h2>
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={sending}
                  className="w-full text-left p-3 rounded-xl bg-white border border-[#EDE1E5] text-xs text-[#4A3B4B] hover:border-[#D9A7B7] hover:bg-[#FFF4F5] transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#EDE1E5] p-5 space-y-2">
            <h3 className="text-sm font-semibold text-[#231B24]">
              When to Call a Doctor Right Away
            </h3>
            <ul className="text-xs text-[#5E4E5E] space-y-1.5 leading-relaxed">
              <li>• Any bleeding or sudden water leaking</li>
              <li>• Strong headache, blurry eyes, or sudden hand/face swelling</li>
              <li>• Sharp belly pain or early tightening cramps</li>
              <li>• Baby is kicking or moving much less than normal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
