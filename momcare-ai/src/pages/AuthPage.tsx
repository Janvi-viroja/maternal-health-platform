import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculatePregnancyDates } from '../data/pregnancyData';
import { parseJsonResponse } from '../lib/http';
import type { PageId } from '../types';

interface AuthPageProps {
  onNavigate: (page: PageId) => void;
}

type AuthTab = 'login' | 'register' | 'forgot';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const {
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
    signInAsDemo,
    authError,
    clearAuthError,
    loading,
  } = useAuth();

  const [tab, setTab] = useState<AuthTab>('login');
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Forgot password state (2-step email OTP verification)
  const [forgotEmail, setForgotEmail] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPwd, setResetNewPwd] = useState('');

  // Registration + pregnancy info form
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [age, setAge] = useState('28');
  const [pregnancyWeek, setPregnancyWeek] = useState('16');
  const [lmpDate, setLmpDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [dietPreference, setDietPreference] = useState<'vegetarian' | 'non-vegetarian'>(
    'vegetarian'
  );
  const [medicalHistory, setMedicalHistory] = useState('');

  const handleLmpChange = (val: string) => {
    setLmpDate(val);
    const calc = calculatePregnancyDates({ lmpDate: val });
    if (calc) {
      setExpectedDeliveryDate(calc.expectedDeliveryDate);
      setPregnancyWeek(String(calc.week));
    }
  };

  const handleEddChange = (val: string) => {
    setExpectedDeliveryDate(val);
    const calc = calculatePregnancyDates({ eddDate: val });
    if (calc) {
      setLmpDate(calc.lmpDate);
      setPregnancyWeek(String(calc.week));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthError();
    const cleanedEmail = loginEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setFormError('Please enter your password.');
      return;
    }
    setSubmitting(true);
    const ok = await loginWithEmail(cleanedEmail, loginPassword);
    setSubmitting(false);
    if (ok) onNavigate('profile');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthError();
    const cleanedEmail = regEmail.trim().toLowerCase();

    if (fullName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!EMAIL_REGEX.test(cleanedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (
      regPassword.length < 8 ||
      !/[A-Za-z]/.test(regPassword) ||
      !/[0-9]/.test(regPassword)
    ) {
      setFormError(
        'Password must be at least 8 characters and include both letters and numbers.'
      );
      return;
    }
    if (regPassword.toLowerCase() === cleanedEmail) {
      setFormError('Password cannot match your email address.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setFormError('Passwords do not match. Please confirm your password.');
      return;
    }

    const weekNum = pregnancyWeek ? Number(pregnancyWeek) : null;
    if (weekNum !== null && (weekNum < 1 || weekNum > 42)) {
      setFormError('Pregnancy week must be between 1 and 42.');
      return;
    }

    setSubmitting(true);
    const ok = await registerWithEmail({
      fullName: fullName.trim(),
      email: cleanedEmail,
      password: regPassword,
      age: age ? Number(age) : null,
      pregnancyWeek: weekNum,
      lmpDate: lmpDate || null,
      expectedDeliveryDate: expectedDeliveryDate || null,
      bloodGroup: bloodGroup || null,
      medicalHistory: medicalHistory.trim() || null,
      dietPreference,
    });
    setSubmitting(false);
    if (ok) onNavigate('profile');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setForgotMessage(null);
    const cleanedEmail = forgotEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(cleanedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      if (!challengeToken) {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanedEmail }),
        });
        const data = await parseJsonResponse<{
          sent?: boolean;
          challengeToken?: string;
          message?: string;
        }>(res);
        setForgotMessage(
          data.message || 'Check your email inbox for your 6-digit reset code.'
        );
        if (data.challengeToken) {
          setChallengeToken(data.challengeToken);
        }
      } else {
        if (!resetOtp.trim()) {
          throw new Error('Please enter the 6-digit code sent to your email.');
        }
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanedEmail,
            otp: resetOtp.trim(),
            challengeToken,
            newPassword: resetNewPwd,
          }),
        });
        const data = await parseJsonResponse<{ updated?: boolean; message?: string }>(res);
        setForgotMessage(
          data.message || 'Your password has been updated. You can now sign in.'
        );
        setChallengeToken(null);
        setResetOtp('');
        setResetNewPwd('');
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to process reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setFormError(null);
    clearAuthError();
    const ok = await signInWithGoogle();
    if (ok) onNavigate('profile');
  };

  const handleDemoClick = async (role: 'patient' | 'admin') => {
    setFormError(null);
    clearAuthError();
    const ok = await signInAsDemo(role);
    if (ok) onNavigate(role === 'admin' ? 'admin' : 'profile');
  };

  const combinedError = formError || authError;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#8E2F4C]">
              Your Private MomCare Account
            </p>
            <h1 className="text-3xl font-semibold text-[#231B24] [text-wrap:balance]">
              Your friendly pregnancy & baby helper
            </h1>
            <p className="text-sm text-[#5E4E5E] leading-relaxed">
              Sign in with Google or make a free account with your email, pregnancy week, and due date so MomCare AI gives you tips made for your week.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-[#EDE1E5]">
            <p className="text-xs font-semibold text-[#231B24]">Quick Try Without Signing Up</p>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                disabled={loading || submitting}
                onClick={() => handleDemoClick('patient')}
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#DFCED4] text-sm font-medium text-[#231B24] hover:bg-[#FFF4F5] transition-colors text-left cursor-pointer"
              >
                Try Demo Mom Account (Ananya · Week 24)
              </button>
              <button
                type="button"
                disabled={loading || submitting}
                onClick={() => handleDemoClick('admin')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F6F2FB] border border-[#E7DFF2] text-sm font-medium text-[#4D387B] hover:bg-[#EDE5F8] transition-colors text-left cursor-pointer"
              >
                Try Demo Admin Panel
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl bg-white border border-[#EDE1E5] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5]">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setFormError(null);
                clearAuthError();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-[#231B24] shadow-xs'
                  : 'text-[#6E5C6B] hover:text-[#231B24]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setFormError(null);
                clearAuthError();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-[#231B24] shadow-xs'
                  : 'text-[#6E5C6B] hover:text-[#231B24]'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('forgot');
                setFormError(null);
                clearAuthError();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'forgot'
                  ? 'bg-white text-[#231B24] shadow-xs'
                  : 'text-[#6E5C6B] hover:text-[#231B24]'
              }`}
            >
              Forgot Password
            </button>
          </div>

          {combinedError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{combinedError}</span>
            </div>
          )}

          {tab !== 'forgot' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading || submitting}
                className="w-full py-2.5 px-4 rounded-xl border border-[#DFCED4] bg-[#FFFDFB] hover:bg-[#FFF4F5] text-sm font-semibold text-[#231B24] flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12z"
                  />
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 text-xs text-[#7A6879]">
                <span className="flex-1 h-px bg-[#EDE1E5]" />
                <span>or use your email & password</span>
                <span className="flex-1 h-px bg-[#EDE1E5]" />
              </div>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="mother@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPwd ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5C6B] cursor-pointer"
                    aria-label={showLoginPwd ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Mail className="w-4 h-4" />
                {submitting ? 'Signing In...' : 'Sign In to MomCare AI'}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Meera Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="meera@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Password (8+ letters & numbers) *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="e.g., CareMom2026"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5C6B] cursor-pointer"
                      aria-label={showRegPwd ? 'Hide password' : 'Show password'}
                    >
                      {showRegPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Type Password Again *
                  </label>
                  <input
                    type={showRegPwd ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Type same password again"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Your Age
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={55}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Blood Group (optional)
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    First Day of Last Period
                  </label>
                  <input
                    type="date"
                    value={lmpDate}
                    onChange={(e) => handleLmpChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Expected Due Date (Baby’s Arrival)
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => handleEddChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Current Pregnancy Week (1–42)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={42}
                    value={pregnancyWeek}
                    onChange={(e) => setPregnancyWeek(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                    Diet Preference
                  </label>
                  <div className="flex gap-2">
                    {(['vegetarian', 'non-vegetarian'] as const).map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setDietPreference(pref)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold capitalize cursor-pointer ${
                          dietPreference === pref
                            ? 'bg-[#FCE7EE] border-[#D9A7B7] text-[#8E2F4C]'
                            : 'bg-white border-[#DFCED4] text-[#5E4E5E]'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                  Any Health Notes or Allergies (optional)
                </label>
                <textarea
                  rows={2}
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="e.g., thyroid medicine, low iron, food allergies"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <UserPlus className="w-4 h-4" />
                {submitting ? 'Creating Account...' : 'Create My Free Account'}
              </button>
            </form>
          )}

          {tab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-sm text-[#5E4E5E]">
                Enter your registered email address to receive a 6-digit verification code and set a new password.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                  Registered Email
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setChallengeToken(null);
                    setResetOtp('');
                  }}
                  placeholder="mother@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                />
              </div>
              {challengeToken && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                      6-Digit Code from Email
                    </label>
                    <input
                      type="text"
                      required
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
                      New Password (8+ chars, letters & numbers)
                    </label>
                    <input
                      type="password"
                      required
                      value={resetNewPwd}
                      onChange={(e) => setResetNewPwd(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm focus:outline-none focus:ring-2 focus:ring-[#B84A6A]/30"
                    />
                  </div>
                </>
              )}
              {forgotMessage && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forgotMessage}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-[#6E56A3] text-white text-sm font-semibold hover:bg-[#59438B] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" />
                {submitting
                  ? 'Processing...'
                  : challengeToken
                  ? 'Confirm Code & Update Password'
                  : 'Send Password Reset Code'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
