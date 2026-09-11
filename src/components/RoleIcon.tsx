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

  // Custom uploaded icons matching user assets in /assets/ folder
  if (normalized.includes('shai')) {
    return (
      <img
        src="https://cdn.discordapp.com/emojis/1544203289393111080.webp?size=48"
        alt="Shai"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized.includes('elephant')) {
    return (
      <img
        src="https://cdn.discordapp.com/emojis/1543984913047486545.webp?size=48"
        alt="Elephant"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized.includes('hwacha')) {
    return (
      <img
        src="https://cdn.discordapp.com/emojis/1543984939861803108.webp?size=48"
        alt="Hwacha"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized.includes('flag')) {
    return (
      <img
        src="https://cdn.discordapp.com/emojis/1543984858894704710.webp?size=48"
        alt="Flag Man"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized === 'ft' || normalized.includes('flame') || normalized.includes('tower')) {
    return (
      <img
        src="https://cdn.discordapp.com/emojis/1543984885432062092.webp?size=48"
        alt="Flame Tower"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized.includes('witch') && normalized.includes('wizard')) {
    return (
      <div className="inline-flex items-center -space-x-1 shrink-0 align-middle">
        <img
          src="https://cdn.discordapp.com/emojis/1544202932256252167.webp?size=48"
          alt="Witch"
          className={sizeClasses}
          referrerPolicy="no-referrer"
        />
        <img
          src="https://cdn.discordapp.com/emojis/1544202904817373224.webp?size=48"
          alt="Wizard"
          className={sizeClasses}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (normalized.includes('witch')) {
    return (
      <img
        src="https://cdn.discordapp.com/emojis/1544202932256252167.webp?size=48"
        alt="Witch"
        className={finalClass}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (normalized.includes('wizard')) {
    return (
      <img
        src="https://cdn.discordapp.com/emojis/1544202904817373224.webp?size=48"
        alt="Wizard"
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

  return <span className={className}>⚔️</span>;
};
