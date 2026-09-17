import React from 'react';
import Image from 'next/image';

// Natural pixel dimensions of each cropped source image, so next/image never distorts them.
const ICONS = {
  envelope: { src: '/images/icon-envelope.png', w: 270, h: 220 },
  lock: { src: '/images/icon-lock.png', w: 280, h: 220 },
  shield: { src: '/images/icon-shield.png', w: 230, h: 210 },
  phone: { src: '/images/icon-phone.png', w: 220, h: 220 },
} as const;

export default function AuthIcon({
  name,
  size = 140,
  className = '',
}: {
  name: keyof typeof ICONS;
  /** Target height in px; width is derived from the image's real aspect ratio. */
  size?: number;
  className?: string;
}) {
  const icon = ICONS[name];
  const width = Math.round((icon.w / icon.h) * size);
  return (
    <Image
      src={icon.src}
      alt=""
      width={width}
      height={size}
      className={`mx-auto ${className}`}
    />
  );
}
