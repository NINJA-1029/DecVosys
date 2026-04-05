import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Calendar, Lock, ArrowRight, CheckCircle, Globe } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function SignupPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('manual'); // 'manual' | 'google'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    fullName: '',
    dob: '',
    phone: '',
    email: '',
    gender: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleManualSignup = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.phone.length !== 10 || isNaN(form.phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess(true);
        setTimeout(() => navigate('/verify'), 2000);
      }
    } catch {
      setError('Cannot connect to backend. Is the server running?');
    }
    setLoading(false);
  };

  const handleGoogleSignup = () => {
    // Open Google OAuth consent screen
    const redirectUri = encodeURIComponent(`${window.location.origin}/login?type=user`);
    const scope = encodeURIComponent('openid email profile');
    const state = 'google_signup';
    if (!GOOGLE_CLIENT_ID) {
      alert('Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.\n\nFor now, please use Manual Signup.');
      return;
    }
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&state=${state}`;
    window.location.href = url;
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6 py-20">
      <div className="absolute inset-0 bg-background overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-secondary/15 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.3 }}
        className="w-full max-w-xl"
      >
        <div className="glass rounded-3xl p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white">Create Your Account</h1>
            <p className="text-slate-400 mt-2 text-sm">Register as a voter in the Decentralized Voting System</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-xl">
            {['manual', 'google'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                  tab === t ? 'bg-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'google' ? '🔵 Sign up with Google' : '📋 Manual Registration'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Google Tab */}
            {tab === 'google' && (
              <motion.div
                key="google"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center gap-6 py-8"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Globe className="w-12 h-12 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl mb-2">Continue with Google</p>
                  <p className="text-slate-400 text-sm max-w-sm">
                    Your basic Google profile (name, email) will be used to pre-fill your voter registration.
                  </p>
                </div>
                <button
                  onClick={handleGoogleSignup}
                  className="w-full py-4 bg-white text-gray-800 font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </button>
                <p className="text-slate-500 text-xs text-center">Requires VITE_GOOGLE_CLIENT_ID configured in .env</p>
              </motion.div>
            )}

            {/* Manual Tab */}
            {tab === 'manual' && !success && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleManualSignup} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">User ID *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input name="userId" required value={form.userId} onChange={handleChange}
                          className={inputCls + " pl-10"} placeholder="e.g. voter007" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                      <input name="fullName" required value={form.fullName} onChange={handleChange}
                        className={inputCls} placeholder="As on ID card" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date of Birth *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input name="dob" type="date" required value={form.dob} onChange={handleChange}
                          className={inputCls + " pl-10"} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gender *</label>
                      <select name="gender" required value={form.gender} onChange={handleChange}
                        className={inputCls + " bg-slate-900"}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other / Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input name="phone" type="tel" required maxLength={10} value={form.phone} onChange={handleChange}
                        className={inputCls + " pl-10"} placeholder="10-digit mobile number" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input name="email" type="email" required value={form.email} onChange={handleChange}
                        className={inputCls + " pl-10"} placeholder="your@email.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Residential Address</label>
                    <textarea name="address" rows={2} value={form.address} onChange={handleChange}
                      className={inputCls} placeholder="House no, Street, City, State" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input name="password" type="password" required value={form.password} onChange={handleChange}
                          className={inputCls + " pl-10"} placeholder="Min 6 characters" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange}
                          className={inputCls + " pl-10"} placeholder="Re-enter password" />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium border border-red-500/30">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(14,165,233,0.4)] disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Registering...' : 'Create Voter Account'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Success */}
            {success && (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-10 gap-4 text-center"
              >
                <CheckCircle className="w-20 h-20 text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]" />
                <h2 className="text-2xl font-extrabold text-white">Registration Successful!</h2>
                <p className="text-slate-400">Redirecting you to identity verification...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login?type=user" className="text-secondary hover:underline font-semibold">
              Login here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
