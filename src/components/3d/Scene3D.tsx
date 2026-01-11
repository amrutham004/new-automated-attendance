/**
 * Scene3D.tsx - Main 3D Canvas Background Component
 * 
 * Creates an immersive Three.js scene with:
 * - Floating geometric shapes (spheres, boxes, torus)
 * - Animated particles in the background
 * - Ambient lighting and depth effects
 * 
 * Uses @react-three/fiber for React integration
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Stars, MeshDistortMaterial } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Floating Sphere - Main decorative element
const FloatingSphere = ({ position, color, size = 1 }: { position: [number, number, number]; color: string; size?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Subtle rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          distort={0.3}
          speed={2}
        />
      </mesh>
    </Float>
  );
};

// Floating Box - Secondary decorative element
const FloatingBox = ({ position, color, size = 0.8 }: { position: [number, number, number]; color: string; size?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          metalness={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
};

// Floating Torus - Accent element
const FloatingTorus = ({ position, color }: { position: [number, number, number]; color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.z += 0.01;
    }
  });

  return (
    <Float speed={3} rotationIntensity={0.3} floatIntensity={1.2}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[0.6, 0.2, 16, 32]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
};

// Main 3D Scene with all elements
const Scene = () => {
  return (
    <>
      {/* Lighting Setup */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#22d3ee" />
      <pointLight position={[10, -10, 5]} intensity={0.3} color="#a855f7" />
      
      {/* Background Stars */}
      <Stars 
        radius={100} 
        depth={50} 
        count={2000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={1}
      />
      
      {/* Floating Elements - Positioned around the viewport */}
      <FloatingSphere position={[-3, 2, -2]} color="#22d3ee" size={0.8} />
      <FloatingSphere position={[3, -1, -3]} color="#06b6d4" size={0.6} />
      <FloatingSphere position={[4, 2, -4]} color="#0891b2" size={1} />
      
      <FloatingBox position={[-4, -2, -3]} color="#a855f7" size={0.7} />
      <FloatingBox position={[2, 3, -5]} color="#7c3aed" size={0.5} />
      
      <FloatingTorus position={[-2, 0, -4]} color="#f59e0b" />
      <FloatingTorus position={[4, -2, -3]} color="#10b981" />
      
      {/* Camera Controls - Limited for background effect */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </>
  );
};

// Exported Canvas Component - Ready to use as background
const Scene3D = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3D;
