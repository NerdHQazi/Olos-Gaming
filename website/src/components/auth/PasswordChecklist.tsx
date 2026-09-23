'use client';
import React from 'react';

/**
 * Mirrors src/middleware/validate.js's signupSchema exactly:
 *   min 8 chars, at least one uppercase, one lowercase, one number, one special char.
 * All four are required (not "number OR symbol" like the old version here checked) —
 * that mismatch would let the UI show all-green while the backend still 400s.
 */
export default function PasswordChecklist({ password }: { password: string }) {
  const rules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One number', ok: /[0-9]/.test(password) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm font-bold text-white">Password must contain:</p>
      {rules.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${r.ok ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-white/5 border-white/20 text-transparent'}`}>
            {r.ok ? '✓' : ''}
          </span>
          <span className={`text-xs ${r.ok ? 'text-gray-300' : 'text-gray-500'}`}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Same rule, usable outside the component for gating submit buttons. */
export function isPasswordValid(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
