/**
 * GlassButton.tsx - 3D Glass-style Button
 * 
 * A button with:
 * - Glassmorphism effect
 * - 3D hover lift
 * - Gradient glow on hover
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface GlassButtonProps {
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'large';
  className?: string;
  disabled?: boolean;
}

const GlassButton = ({ 
  children, 
  to, 
  onClick, 
  variant = 'primary',
  size = 'default',
  className = '',
  disabled = false
}: GlassButtonProps) => {
  // Base styles for glass effect
  const baseStyles = `
    relative
    inline-flex items-center justify-center gap-3
    font-semibold
    rounded-xl
    overflow-hidden
    transition-all duration-300 ease-out
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:-translate-y-1 active:scale-100 active:translate-y-0 cursor-pointer'}
    group
  `;

  // Size variants
  const sizeStyles = {
    default: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  // Color variants
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-green-500/80 via-teal-500/80 to-blue-500/80
      backdrop-blur-md
      border border-teal-400/30
      text-white
      shadow-lg shadow-teal-500/25
      hover:shadow-xl hover:shadow-teal-500/40
      hover:border-teal-300/50
    `,
    secondary: `
      bg-white/10
      backdrop-blur-md
      border border-white/20
      text-foreground
      shadow-lg shadow-black/10
      hover:bg-white/20
      hover:border-white/30
    `,
  };

  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  // Inner content with animated glow
  const content = (
    <>
      {/* Animated gradient glow on hover */}
      <span 
        className="
          absolute inset-0 
          bg-gradient-to-r from-teal-400/0 via-white/20 to-teal-400/0
          translate-x-[-100%]
          group-hover:translate-x-[100%]
          transition-transform duration-700
        "
      />
      
      {/* Button content */}
      <span className="relative z-10 flex items-center gap-3">
        {children}
      </span>
    </>
  );

  // Render as Link or button
  if (to) {
    return (
      <Link to={to} className={combinedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} className={combinedClassName}>
      {content}
    </button>
  );
};

export default GlassButton;
