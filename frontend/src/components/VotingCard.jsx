import React, { useState } from 'react';
import AnimatedCard from './AnimatedCard';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Award } from 'lucide-react';

export default function VotingCard({ id, name, party, symbolURI, onVote, hasVoted, isVoting }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleVoteClick = () => {
    if (hasVoted) return;
    if (showConfirm) {
      onVote(id);
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <AnimatedCard className={`h-80 flex flex-col items-center flex-col justify-center gap-4 group ${hasVoted ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
      <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center p-2 mb-2 glass shadow-[0_0_20px_rgba(139,92,246,0.3)]">
        {symbolURI ? (
          <img src={symbolURI} alt={`${name} symbol`} className="w-full h-full object-contain rounded-full" />
        ) : (
          <Award className="w-12 h-12 text-secondary" />
        )}
      </div>
      
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:text-glow transition-all">{name}</h3>
        <p className="text-sm text-secondary font-mono tracking-wide">{party}</p>
      </div>

      <div className="mt-4 flex flex-col items-center">
        {hasVoted ? (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Voted</span>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVoteClick}
            disabled={isVoting}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              showConfirm
                ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-primary hover:bg-primary-hover shadow-[0_0_15px_rgba(139,92,246,0.5)]'
            }`}
          >
            {isVoting ? 'Processing...' : showConfirm ? 'Confirm Vote' : 'Vote Now'}
          </motion.button>
        )}
        
        <AnimatePresence>
          {showConfirm && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-slate-300 mt-2 text-center mt-3"
            >
              This action is immutable.<br/>Are you sure?
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </AnimatedCard>
  );
}
