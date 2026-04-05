import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';

function FloatingCubes() {
  const groupRef = useRef();
  
  useFrame((state) => {
    // Slight slow rotation of the entire group based on time
    if(groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      // Slight tilt
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 15 }).map((_, i) => (
        <Float
          key={i}
          speed={Math.random() * 2 + 1} 
          rotationIntensity={Math.random() * 5} 
          floatIntensity={Math.random() * 5}
          position={[
            (Math.random() - 0.5) * 20, 
            (Math.random() - 0.5) * 20, 
            (Math.random() - 0.5) * 10 - 5
          ]}
        >
          <mesh>
            <octahedronGeometry args={[Math.random() * 0.8 + 0.2]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? '#8b5cf6' : '#0ea5e9'} 
              wireframe={i % 3 === 0} 
              transparent 
              opacity={0.6}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0ea5e9" />
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <FloatingCubes />
      </Canvas>
    </div>
  );
}
