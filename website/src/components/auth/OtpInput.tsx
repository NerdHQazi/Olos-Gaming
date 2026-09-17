'use client';
import React, { useRef } from 'react';

type Props = {
  length?: number;
  value: string[];
  onChange: (next: string[]) => void;
};

export default function OtpInput({ length = 6, value, onChange }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/[^0-9]/g, '').slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length }, (_, i) => pasted[i] ?? '');
    onChange(next);
    const lastIndex = Math.min(pasted.length, length) - 1;
    refs.current[lastIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-14 h-16 md:w-16 md:h-[4.5rem] text-center text-2xl font-bold bg-black border border-[#7135DB]/50 rounded-xl text-white focus:outline-none focus:border-[#22D3EE] transition-all"
        />
      ))}
    </div>
  );
}
