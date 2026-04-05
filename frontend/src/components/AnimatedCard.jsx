import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedCard({ children, className = '', onClick }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation based on cursor position relative to center
    const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg tilt
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      className={`glass rounded-2xl relative overflow-hidden p-6 cursor-pointer ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
        scale: 1,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
    >
      {/* Glossy overlay effect */}
      <div 
        className="absolute inset-0 z-10 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${rotation.y * 10 + 50}% ${rotation.x * -10 + 50}%, rgba(255,255,255,0.4), transparent 50%)`
        }} 
      />
      <div className="relative z-20">
        {children}
      </div>
    </motion.div>
  );
}
