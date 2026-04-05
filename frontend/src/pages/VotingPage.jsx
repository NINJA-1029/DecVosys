import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import VotingCard from '../components/VotingCard';
import { motion } from 'framer-motion';
import { ethers, BrowserProvider, Contract } from 'ethers';
import VotingABI from '../contracts/Voting.json';
import { VOTING_CONTRACT_ADDRESS } from '../config';

export default function VotingPage() {
  const [hasVotedGlobal, setHasVotedGlobal] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [electionActive, setElectionActive] = useState(true);
  
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      if (!window.ethereum) return alert("Install MetaMask");
      
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(VOTING_CONTRACT_ADDRESS, VotingABI.abi, provider);
      
      // Get candidates
      const data = await contract.getAllCandidates();
      const formatted = data.map(c => ({
        id: Number(c.id),
        name: c.name,
        party: c.party,
        symbolURI: c.symbolURI
      }));
      setCandidates(formatted);

      // Check if current user voted
      const accounts = await provider.send('eth_requestAccounts', []);
      const votedStatus = await contract.hasVoted(accounts[0]);
      setHasVotedGlobal(votedStatus);

      // Check election status
      const details = await contract.getElectionDetails();
      setElectionActive(details[3]);
      
    } catch (err) {
      console.error("Error fetching candidates from blockchain:", err);
      // Fallback for if hardhat isn't running
      alert("Error connecting to Blockchain. Make sure Hardhat node is running and MetaMask is connected.");
    }
  };

  const handleVote = async (candidateId) => {
    if (!electionActive) return alert("Election is currently closed.");
    setIsVoting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(VOTING_CONTRACT_ADDRESS, VotingABI.abi, signer);
      
      const tx = await contract.vote(candidateId);
      await tx.wait(); // Wait for mining
      
      setHasVotedGlobal(true);
      alert('Transaction successful! Your vote has been immutably recorded.');
    } catch(err) {
      console.error(err);
      if(err.reason) {
         alert("Reverted: " + err.reason);
      } else {
         alert("Transaction failed or rejected by user.");
      }
    }
    setIsVoting(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center relative">
      <Navbar />

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-5xl text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4 drop-shadow-md">
          Official Ballot Booth
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Please select your preferred candidate. This action will trigger a Web3 transaction and cannot be undone. One wallet equals one vote.
        </p>
      </motion.div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {candidates.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
          >
            <VotingCard
              id={c.id}
              name={c.name}
              party={c.party}
              symbolURI={c.symbolURI}
              onVote={handleVote}
              hasVoted={hasVotedGlobal}
              isVoting={isVoting}
            />
          </motion.div>
        ))}
      </div>

      {hasVotedGlobal && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-16 glass px-10 py-6 rounded-full border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] text-center max-w-lg"
        >
          <p className="text-green-400 font-bold text-lg flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-400 animate-ping" />
            Vote Successfully Recorded on Chain
          </p>
        </motion.div>
      )}
    </div>
  );
}
