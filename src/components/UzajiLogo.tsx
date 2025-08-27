import React from 'react';

interface UzajiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export function UzajiLogo({ className = '', size = 'md', variant = 'full' }: UzajiLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const LogoIcon = () => (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      {/* Outer circle with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-full shadow-lg"></div>
      
      {/* Inner design - stylized "U" with modern geometric elements */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <svg viewBox="0 0 32 32" className="w-full h-full text-white" fill="currentColor">
          {/* Stylized U shape with modern twist */}
          <path d="M8 6v12c0 4.4 3.6 8 8 8s8-3.6 8-8V6h-3v12c0 2.8-2.2 5-5 5s-5-2.2-5-5V6H8z" />
          {/* Accent dots for modern touch */}
          <circle cx="12" cy="10" r="1.5" opacity="0.7" />
          <circle cx="20" cy="10" r="1.5" opacity="0.7" />
          {/* Bottom accent line */}
          <rect x="10" y="24" width="12" height="2" rx="1" opacity="0.8" />
        </svg>
      </div>
      
      {/* Subtle outer glow */}
      <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 rounded-full opacity-20 blur-sm"></div>
    </div>
  );

  if (variant === 'icon') {
    return <LogoIcon />;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <LogoIcon />
      <span className={`font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
        Uzaji
      </span>
    </div>
  );
}