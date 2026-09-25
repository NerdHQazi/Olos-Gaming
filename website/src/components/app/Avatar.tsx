import React from 'react';

const COLORS = ['#7135DB', '#169EFA', '#22D3EE', '#F59E0B', '#EF4444', '#22C55E', '#EC4899'];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

/** Generated colored-initial avatar — used for mock player data (leaderboard,
 * tournament bracket, chat) where no real avatar image exists. */
export default function Avatar({
  name,
  size = 32,
  className = '',
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: colorFor(name),
        fontSize: size * 0.4,
      }}
    >
      {initials || '?'}
    </div>
  );
}
