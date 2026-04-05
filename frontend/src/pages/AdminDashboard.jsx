import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Play, Square, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import { BrowserProvider, Contract } from 'ethers';
import VotingABI from '../contracts/Voting.json';
import { VOTING_CONTRACT_ADDRESS } from '../config';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [electionActive, setElectionActive] = useState(false);
  const [electionTitle, setElectionTitle] = useState('Loading...');
  const [candidates, setCandidates] = useState([]);
  const [newCandidate, setNewCandidate] = useState({ name: '', party: '', symbolURI: '' });
  const [isDeploying, setIsDeploying] = useState(false);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    loadContractData();
  }, []);

  const loadContractData = async () => {
    if(!window.ethereum) return;
    try {
      const p = new BrowserProvider(window.ethereum);
      setProvider(p);
      const contract = new Contract(VOTING_CONTRACT_ADDRESS, VotingABI.abi, p);
      
      const details = await contract.getElectionDetails();
      setElectionTitle(details[0] || 'Create Election');
      setElectionActive(details[3]);

      const data = await contract.getAllCandidates();
      const formatted = data.map(c => ({
        id: Number(c.id),
        name: c.name,
        party: c.party,
        voteCount: Number(c.voteCount)
      }));
      setCandidates(formatted);
    } catch(err) {
      console.warn("Chain not reachable to load stats. Check node & address.", err);
    }
  };

  const handleCreateElection = async () => {
    if(!provider) return alert("Install MetaMask");
    setIsDeploying(true);
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(VOTING_CONTRACT_ADDRESS, VotingABI.abi, signer);
      const tx = await contract.createElection("Presidential Election 2026", 1440); // 24 hours
      await tx.wait();
      setElectionActive(true);
      setElectionTitle("Presidential Election 2026");
      alert("Election Started successfully!");
    } catch(err) {
      console.error(err);
      alert("Failed to create election. " + (err.reason || err.message));
    }
    setIsDeploying(false);
  };

  const handleEndElection = async () => {
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(VOTING_CONTRACT_ADDRESS, VotingABI.abi, signer);
      const tx = await contract.endElection();
      await tx.wait();
      setElectionActive(false);
      alert("Election Ended successfully!");
    } catch(err) {
      console.error(err);
      alert("Failed to end election. " + (err.reason || err.message));
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!electionActive) return alert("Please start an election first before adding candidates.");
    
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(VOTING_CONTRACT_ADDRESS, VotingABI.abi, signer);
      const tx = await contract.addCandidate(newCandidate.name, newCandidate.party, newCandidate.symbolURI || "https://example.com/sym.png");
      await tx.wait();
      
      alert("Candidate Added to blockchain!");
      setNewCandidate({ name: '', party: '', symbolURI: '' });
      loadContractData();
      setActiveTab('candidates');
    } catch(err) {
      console.error(err);
      alert("Failed to add candidate. " + (err.reason || err.message));
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center">
      <Navbar />

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-6xl glass rounded-3xl p-8 flex flex-col md:flex-row gap-8"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-4">
          <div className="text-xl font-bold mb-4 px-4 text-glow flex items-center gap-2">
            <Activity className="w-5 h-5" /> Admin Panel
          </div>
          
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all ${
              activeTab === 'overview' ? 'bg-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'hover:bg-white/10'
            }`}
          >
            <Activity className="w-5 h-5" /> Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('candidates')}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all ${
              activeTab === 'candidates' ? 'bg-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'hover:bg-white/10'
            }`}
          >
            <Users className="w-5 h-5" /> Candidates
          </button>
          
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all ${
              activeTab === 'new' ? 'bg-secondary shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'hover:bg-white/10'
            }`}
          >
            <Plus className="w-5 h-5" /> Add Candidate
          </button>

          <div className="mt-auto p-4 rounded-2xl bg-slate-900 border border-slate-700">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 mb-2">
              <AlertCircle className="w-4 h-4" /> Blockchain Status
            </div>
            <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Local Network
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-background/50 rounded-2xl p-6 border border-slate-700/50">
          <AnimatePresence mode="wait">
            
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                  <div>
                    <h2 className="text-3xl font-extrabold">{electionTitle}</h2>
                    <p className="text-slate-400 mt-1">Status: {electionActive ? <span className="text-green-400 font-bold">ACTIVE</span> : <span className="text-red-400 font-bold">NOT STARTED</span>}</p>
                  </div>
                  <div>
                    {electionActive ? (
                      <button onClick={handleEndElection} className="flex flex-col items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 rounded-xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all">
                        <Square className="w-5 h-5" /> End Election
                      </button>
                    ) : (
                      <button onClick={handleCreateElection} disabled={isDeploying} className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all">
                        {isDeploying ? <RefreshCw className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5" />}
                        {isDeploying ? 'Deploying to Chain...' : 'Start Election'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="glass p-6 rounded-2xl flex flex-col justify-between">
                    <span className="text-slate-400 font-semibold mb-2 block">Total Votes Cast</span>
                    <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-primary">
                      {candidates.reduce((sum, c) => sum + c.voteCount, 0)}
                    </span>
                  </div>
                  <div className="glass p-6 rounded-2xl flex flex-col justify-between">
                    <span className="text-slate-400 font-semibold mb-2 block">Registered Candidates</span>
                    <span className="text-5xl font-extrabold text-white">{candidates.length}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'candidates' && (
              <motion.div 
                key="candidates"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold border-b border-slate-700 pb-4">Candidate Leaderboard</h2>
                
                <div className="space-y-4">
                  {candidates.sort((a,b) => b.voteCount - a.voteCount).map((c, index) => (
                    <div key={c.id} className="glass p-6 rounded-2xl flex items-center justify-between hover:scale-[1.02] transition-transform">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold flex items-center gap-3">
                          <span className="text-slate-500 font-mono text-lg">#{index+1}</span> {c.name}
                        </span>
                        <span className="text-sm text-secondary tracking-widest uppercase">{c.party}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-3xl font-extrabold text-primary">{c.voteCount}</span>
                        <span className="text-xs text-slate-400">VOTES</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'new' && (
              <motion.div 
                key="new"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold border-b border-slate-700 pb-4 mb-6">Register New Candidate</h2>
                
                <form onSubmit={handleAddCandidate} className="max-w-xl space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Candidate Name</label>
                    <input 
                      type="text" required
                      value={newCandidate.name} onChange={e => setNewCandidate({...newCandidate, name: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Political Party / Affiliation</label>
                    <input 
                      type="text" required
                      value={newCandidate.party} onChange={e => setNewCandidate({...newCandidate, party: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Symbol Image URL</label>
                    <input 
                      type="url"
                      value={newCandidate.symbolURI} onChange={e => setNewCandidate({...newCandidate, symbolURI: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-secondary hover:bg-sky-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all"
                  >
                    Add to Smart Contract
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
