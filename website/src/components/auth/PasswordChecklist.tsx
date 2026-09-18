'use client';
import React from 'react';

export default function PasswordChecklist({ password }: { password: string }) {
  const rules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'one number or symbol', ok: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm font-bold text-white">Password must contain:</p>
      {rules.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${r.ok ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500'}`}>
            {r.ok ? '✓' : '○'}
          </span>
          <span className={`text-xs ${r.ok ? 'text-gray-300' : 'text-gray-500'}`}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}
