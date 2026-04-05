import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const location = useLocation();

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 w-full z-50 glass border-b border-primary/20 backdrop-blur-xl bg-background/50"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center p-0.5">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-wider text-glow font-mono">DecVoSys</span>
        </Link>
        <div className="flex gap-4">
          <Link to="/login?type=user">
            <button className="px-5 py-2.5 rounded-full text-sm font-semibold glass hover:bg-white/10 transition-colors flex items-center gap-2">
              <User className="w-4 h-4" /> User Login
            </button>
          </Link>
          <Link to="/login?type=admin">
            <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all">
              Admin Gateway
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
