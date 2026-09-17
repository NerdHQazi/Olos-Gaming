'use client';
import React from 'react';

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'outline' | 'outline-green' | 'teal' | 'cyan';
  disabled?: boolean;
  loading?: boolean;
};

export default function AuthButton({
  children, onClick, type = 'button', variant = 'primary', disabled, loading,
}: Props) {
  const base = 'w-full h-14 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const styles =
    variant === 'primary'
      ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white'
      : variant === 'outline'
      ? 'bg-transparent border border-white/20 text-white hover:bg-white/5'
      : variant === 'outline-green'
      ? 'bg-transparent border border-green-500 text-green-500 hover:bg-green-500/10'
      : variant === 'teal' || variant === 'cyan'
      ? 'bg-[#0D9488] hover:bg-[#0F766E] text-white'
      : 'bg-transparent border border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10';

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${styles}`}>
      {loading ? (
        <>
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Please wait...
        </>
      ) : children}
    </button>
  );
}
