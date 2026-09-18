import React from 'react';
import Image from 'next/image';

/**
 * Real OLOS logo, extracted from the Figma export (Splash/Welcome screens).
 * `variant="header"` = horizontal icon + wordmark lockup (used top-left of auth cards)
 * `variant="stacked"` = icon above wordmark, centered (used on splash/loading screens)
 */
export default function Logo({
  variant = 'header',
  className = '',
}: {
  variant?: 'header' | 'stacked';
  className?: string;
}) {
  if (variant === 'stacked') {
    return (
      <Image
        src="/images/olos-logo-stacked.png"
        alt="OLOS"
        width={269}
        height={260}
        priority
        className={`w-auto ${className}`}
      />
    );
  }

  return (
    <Image
      src="/images/olos-logo-header.png"
      alt="OLOS"
      width={220}
      height={68}
      priority
      className={`w-auto ${className}`}
    />
  );
}
