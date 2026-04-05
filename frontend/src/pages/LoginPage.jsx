import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fingerprint, Wallet, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const type = new URLSearchParams(search).get('type') || 'user';
  const isAdmin = type === 'admin';

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      if (res.ok) {
        // Save to local storage
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/verify');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to backend. Is the server running?');
    }
    setLoading(false);
  };

  const connectWalletAdmin = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Admin check should happen on smart contract side, but mock for now
        localStorage.setItem('adminWallet', accounts[0]);
        navigate('/admin');
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Please install MetaMask.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-background overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-3xl p-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)] mb-6">
            {isAdmin ? <ShieldAlert className="w-8 h-8 text-white" /> : <Fingerprint className="w-8 h-8 text-white" />}
          </div>
          
          <h2 className="text-3xl font-extrabold mb-2 text-white text-center">
            {isAdmin ? 'Admin Console' : 'Voter Authentication'}
          </h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            {isAdmin ? 'Connect your authorized Web3 wallet to manage elections.' : 'Securely log in to access your digital ballot.'}
          </p>

          {isAdmin ? (
            <button 
              onClick={connectWalletAdmin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#f6851b] hover:bg-[#e2761b] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(246,133,27,0.4)]"
            >
              <Wallet className="w-5 h-5" />
              Connect MetaMask
            </button>
          ) : (
            <form onSubmit={handleUserLogin} className="w-full space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Aadhar / User ID</label>
                <input 
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="Enter your ID"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium border border-red-500/30">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(14,165,233,0.4)] disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Proceed to Verification'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>

              {!isAdmin && (
                <p className="text-center text-slate-400 text-sm pt-1">
                  New voter?{' '}
                  <Link to="/signup" className="text-secondary hover:underline font-semibold">
                    Create account
                  </Link>
                </p>
              )}
            </form>
          )}
        </div>
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate(isAdmin ? '/login?type=user' : '/login?type=admin')}
            className="text-slate-400 hover:text-white text-sm underline transition-colors"
          >
            Switch to {isAdmin ? 'User' : 'Admin'} Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
