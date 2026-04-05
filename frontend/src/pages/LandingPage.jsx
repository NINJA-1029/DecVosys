import React from 'react';
import ThreeBackground from '../components/3DBackground';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { ChevronRight, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen pt-20 overflow-hidden flex flex-col">
      <Navbar />
      <ThreeBackground />
      
      <main className="relative z-10 flex-grow flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-secondary/30 mb-4"
          >
            <Cpu className="w-4 h-4 text-secondary" />
            <span className="text-xs font-mono text-secondary uppercase tracking-wider">Powered by Ethereum Blockchain</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-white mb-6"
          >
            <span className="block">Decentralized Voting</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">
              Reimagined.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            Secure, immutable, and transparent elections. Utilizing Web3 smart contracts alongside advanced OCR and Facial Recognition for bulletproof identity verification.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/login?type=user" className="w-full sm:w-auto">
              <button className="group relative w-full sm:w-auto px-8 py-4 bg-white text-background rounded-full font-bold text-lg overflow-hidden flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <span className="relative z-10">Cast Your Vote</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </Link>
            
            <Link to="/login?type=admin" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg glass-hover text-white flex items-center justify-center gap-3">
                Manage Election
              </button>
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Decorative gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />
    </div>
  );
}
