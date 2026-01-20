/**
 * FloatingCard.tsx - 3D Floating Card Component
 * 
 * A card component with 3D perspective effects:
 * - Responds to mouse movement with tilt
 * - Glassmorphism styling
 * - Smooth hover animations
 */

import { useState, useRef, ReactNode } from 'react';
interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}
const FloatingCard = ({
  children,
  className = '',
  glowColor = 'rgba(45, 212, 191, 0.3)'
}: FloatingCardProps) => {
  // Track mouse position for 3D tilt effect
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate rotation based on mouse position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate rotation (max 15 degrees)
    const rotateYValue = (e.clientX - centerX) / (rect.width / 2) * 10;
    const rotateXValue = (centerY - e.clientY) / (rect.height / 2) * 10;
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  // Reset rotation on mouse leave
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };
  return <div ref={cardRef} onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={handleMouseLeave} className={`
        relative
        transition-all duration-300 ease-out
        ${className}
      `} style={{
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'translateZ(20px)' : ''}`,
    transformStyle: 'preserve-3d'
  }}>
      {/* Glow effect behind card */}
      <div className="absolute inset-0 rounded-2xl blur-xl opacity-50 transition-opacity duration-300" style={{
      background: glowColor,
      opacity: isHovered ? 0.6 : 0.2,
      transform: 'translateZ(-10px)'
    }} />
      
      {/* Main card with glassmorphism */}
      <div style={{
      transform: 'translateZ(0)'
    }} className="relative backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl text-primary bg-[#096e71]">
        {children}
      </div>
    </div>;
};
export default FloatingCard;