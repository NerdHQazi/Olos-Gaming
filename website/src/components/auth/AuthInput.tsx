'use client';
import React from 'react';

type Props = {
  id: string;
  type?: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  invalid?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  autoComplete?: string;
};

export default function AuthInput({
  id, type = 'text', name, placeholder, value, onChange,
  leftIcon, rightIcon, invalid, errorMessage, disabled, autoComplete,
}: Props) {
  return (
    <div className="w-full">
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full h-14 bg-black border ${
            invalid ? 'border-red-500' : 'border-[#3B82F6]/30'
          } rounded-xl ${leftIcon ? 'pl-12' : 'pl-4'} ${
            rightIcon ? 'pr-12' : 'pr-4'
          } text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#3B82F6] transition-all disabled:opacity-50`}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {invalid && errorMessage && (
        <p className="mt-2 text-xs text-red-500 font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
