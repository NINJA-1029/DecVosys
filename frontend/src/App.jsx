import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerificationPage from './pages/VerificationPage';
import AdminDashboard from './pages/AdminDashboard';
import VotingPage from './pages/VotingPage';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-animated text-white selection:bg-primary selection:text-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<VerificationPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/vote" element={<VotingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
