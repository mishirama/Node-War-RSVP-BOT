import React from 'react';
import { Swords, Hammer, Megaphone, Music } from 'lucide-react';

interface RoleIconProps {
  role: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFallbackEmoji?: boolean;
}

export const RoleIcon: React.FC<RoleIconProps> = ({
  role,
  className = '',
  size = 'md',
  showFallbackEmoji = false,
}) => {
  const normalized = role.toLowerCase().trim();

  // Determine sizing class
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }[size];

  const finalClass = `${sizeClasses} ${className} inline-block shrink-0 object-contain align-middle`;

  // Custom uploaded icons
  if (normalized.includes('elephant')) {
    return (
      <img
        src="/icons/elephant.svg"
        alt="Elephant"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized.includes('hwacha')) {
    return (
      <img
        src="/icons/hwacha.svg"
        alt="Hwacha"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized.includes('flag')) {
    return (
      <img
        src="/icons/flag.svg"
        alt="Flag Man"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized === 'ft' || normalized.includes('flame') || normalized.includes('tower')) {
    return (
      <img
        src="/icons/flame_tower.svg"
        alt="Flame Tower"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized.includes('witch') || normalized.includes('wizard')) {
    return (
      <img
        src="/icons/witch_wizard.svg"
        alt="Witch / Wizard"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Complementary high quality roles
  if (normalized.includes('main ball') || normalized === 'main') {
    return <Swords className={`${sizeClasses} ${className} text-indigo-400`} />;
  }

  if (normalized.includes('builder')) {
    return <Hammer className={`${sizeClasses} ${className} text-amber-400`} />;
  }

  if (normalized.includes('shotcaller')) {
    return <Megaphone className={`${sizeClasses} ${className} text-rose-400`} />;
  }

  if (normalized.includes('shai')) {
    return <Music className={`${sizeClasses} ${className} text-emerald-400`} />;
  }

  return <span className={className}>⚔️</span>;
};
